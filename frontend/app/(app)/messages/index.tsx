import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

export default function MessagesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = createStyles(colors, isMobile);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [showChannelsList, setShowChannelsList] = useState(false);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      if (isMobile) {
        setShowChannelsList(false);
      }
    }
  }, [selectedChannel]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/channels');
      // Ensure we always have an array
      const channelsData = Array.isArray(response.data) ? response.data : [];
      setChannels(channelsData);
      
      // Auto-select first channel
      if (channelsData.length > 0 && !selectedChannel) {
        setSelectedChannel(channelsData[0]);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const response = await apiService.get(`/channels/${channelId}/messages`);
      // Ensure we always have an array
      const messagesData = Array.isArray(response.data) ? response.data : [];
      setMessages(messagesData);
      
      // Scroll to bottom after loading
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChannels();
    if (selectedChannel) {
      await loadMessages(selectedChannel.id);
    }
    setRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChannel) return;
    
    const tempMessage = {
      id: `temp-${Date.now()}`,
      channelId: selectedChannel.id,
      userId: user?.id,
      userName: user?.name,
      text: messageText.trim(),
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    
    // Optimistic update
    setMessages([...messages, tempMessage]);
    setMessageText('');
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      setSending(true);
      await apiService.post(`/channels/${selectedChannel.id}/messages`, {
        text: messageText.trim(),
      });
      
      // Reload messages to get server version
      await loadMessages(selectedChannel.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages(messages);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectChannel = (channel: any) => {
    setSelectedChannel(channel);
    setMessages([]);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatChannelTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const filteredChannels = Array.isArray(channels) 
    ? channels.filter(channel =>
        searchQuery.trim() === '' ||
        channel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'GENERAL':
        return 'users';
      case 'DEPARTMENT':
        return 'grid';
      case 'DIRECT':
        return 'messageCircle';
      case 'ANNOUNCEMENTS':
        return 'bell';
      default:
        return 'messageCircle';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text2 }]}>Loading channels...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <SvgIcon name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>Messages</Text>
            <Text style={styles.topbarBreadcrumb}>
              {selectedChannel ? selectedChannel.name : `${channels.length} channels`}
            </Text>
          </View>
        </View>
        <View style={styles.topbarActions}>
          {isMobile && (
            <TouchableOpacity 
              style={styles.channelsButton}
              onPress={() => setShowChannelsList(true)}
            >
              <SvgIcon name="messageCircle" size={20} color={colors.text2} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchButton}>
            <SvgIcon name="search" size={20} color={colors.text2} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.messengerContainer}>
        {/* Channels Sidebar - Desktop */}
        {!isMobile && (
          <View style={styles.channelsSidebar}>
          {/* Search */}
          <View style={styles.channelsSearch}>
            <SvgIcon name="search" size={16} color={colors.text3} />
            <TextInput
              style={styles.channelsSearchInput}
              placeholder="Search channels..."
              placeholderTextColor={colors.text3}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Channels List */}
          <ScrollView
            style={styles.channelsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
            }
          >
            {filteredChannels.length === 0 ? (
              <View style={styles.noChannels}>
                <Text style={styles.noChannelsText}>No channels found</Text>
              </View>
            ) : (
              filteredChannels.map((channel) => (
                <TouchableOpacity
                  key={channel.id}
                  style={[
                    styles.channelItem,
                    selectedChannel?.id === channel.id && styles.channelItemActive,
                  ]}
                  onPress={() => handleSelectChannel(channel)}
                >
                  <View style={[
                    styles.channelIcon,
                    selectedChannel?.id === channel.id && styles.channelIconActive
                  ]}>
                    <SvgIcon 
                      name={getChannelIcon(channel.type)} 
                      size={20} 
                      color={selectedChannel?.id === channel.id ? '#fff' : colors.text2} 
                    />
                  </View>
                  <View style={styles.channelInfo}>
                    <View style={styles.channelHeader}>
                      <Text style={[
                        styles.channelName,
                        selectedChannel?.id === channel.id && styles.channelNameActive
                      ]} numberOfLines={1}>
                        {channel.name}
                      </Text>
                      {channel.lastMessageAt && (
                        <Text style={styles.channelTime}>
                          {formatChannelTime(channel.lastMessageAt)}
                        </Text>
                      )}
                    </View>
                    {channel.lastMessage && (
                      <Text style={styles.channelLastMessage} numberOfLines={1}>
                        {channel.lastMessage}
                      </Text>
                    )}
                  </View>
                  {channel.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{channel.unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
        )}

        {/* Channels Sidebar - Mobile Modal */}
        {isMobile && (
          <Modal
            visible={showChannelsList}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowChannelsList(false)}
          >
            <View style={[styles.container, { paddingTop: 48 }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Channels</Text>
                <TouchableOpacity onPress={() => setShowChannelsList(false)}>
                  <SvgIcon name="x" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={styles.channelsSearch}>
                <SvgIcon name="search" size={16} color={colors.text3} />
                <TextInput
                  style={styles.channelsSearchInput}
                  placeholder="Search channels..."
                  placeholderTextColor={colors.text3}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Channels List */}
              <ScrollView
                style={styles.channelsList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
              >
                {filteredChannels.length === 0 ? (
                  <View style={styles.noChannels}>
                    <Text style={styles.noChannelsText}>No channels found</Text>
                  </View>
                ) : (
                  filteredChannels.map((channel) => (
                    <TouchableOpacity
                      key={channel.id}
                      style={[
                        styles.channelItem,
                        selectedChannel?.id === channel.id && styles.channelItemActive,
                      ]}
                      onPress={() => handleSelectChannel(channel)}
                    >
                      <View style={[
                        styles.channelIcon,
                        selectedChannel?.id === channel.id && styles.channelIconActive
                      ]}>
                        <SvgIcon 
                          name={getChannelIcon(channel.type)} 
                          size={20} 
                          color={selectedChannel?.id === channel.id ? '#fff' : colors.text2} 
                        />
                      </View>
                      <View style={styles.channelInfo}>
                        <View style={styles.channelHeader}>
                          <Text style={[
                            styles.channelName,
                            selectedChannel?.id === channel.id && styles.channelNameActive
                          ]} numberOfLines={1}>
                            {channel.name}
                          </Text>
                          {channel.lastMessageAt && (
                            <Text style={styles.channelTime}>
                              {formatChannelTime(channel.lastMessageAt)}
                            </Text>
                          )}
                        </View>
                        {channel.lastMessage && (
                          <Text style={styles.channelLastMessage} numberOfLines={1}>
                            {channel.lastMessage}
                          </Text>
                        )}
                      </View>
                      {channel.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{channel.unreadCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </Modal>
        )}

        {/* Chat Area */}
        {selectedChannel ? (
          <View style={styles.chatArea}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              {isMobile && (
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setShowChannelsList(true)}
                >
                  <SvgIcon name="arrowLeft" size={20} color={colors.text2} />
                </TouchableOpacity>
              )}
              <View style={styles.chatHeaderLeft}>
                <View style={styles.chatHeaderIcon}>
                  <SvgIcon 
                    name={getChannelIcon(selectedChannel.type)} 
                    size={24} 
                    color={colors.accent} 
                  />
                </View>
                <View>
                  <Text style={styles.chatHeaderTitle}>{selectedChannel.name}</Text>
                  <Text style={styles.chatHeaderSubtitle}>
                    {selectedChannel.memberCount || 0} members
                  </Text>
                </View>
              </View>
              <View style={styles.chatHeaderActions}>
                <TouchableOpacity style={styles.chatHeaderButton}>
                  <SvgIcon name="users" size={20} color={colors.text2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages Area */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesArea}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={styles.noMessages}>
                  <SvgIcon name="messageCircle" size={48} color={colors.text3} />
                  <Text style={styles.noMessagesTitle}>No messages yet</Text>
                  <Text style={styles.noMessagesText}>
                    Be the first to send a message in this channel
                  </Text>
                </View>
              ) : (
                messages.map((message, index) => {
                  const isMine = message.userId === user?.id;
                  const showAvatar = !isMine && (
                    index === messages.length - 1 ||
                    messages[index + 1]?.userId !== message.userId
                  );
                  const showName = !isMine && (
                    index === 0 ||
                    messages[index - 1]?.userId !== message.userId
                  );

                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageRow,
                        isMine && styles.messageRowMine,
                      ]}
                    >
                      {!isMine && (
                        <View style={styles.messageAvatarContainer}>
                          {showAvatar ? (
                            <View style={styles.messageAvatar}>
                              <Text style={styles.messageAvatarText}>
                                {message.userName?.[0] || '?'}
                              </Text>
                            </View>
                          ) : (
                            <View style={{ width: 32 }} />
                          )}
                        </View>
                      )}
                      <View style={[
                        styles.messageBubbleContainer,
                        isMine && styles.messageBubbleContainerMine
                      ]}>
                        {showName && !isMine && (
                          <Text style={styles.messageSenderName}>{message.userName}</Text>
                        )}
                        <View style={[
                          styles.messageBubble,
                          isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                        ]}>
                          <Text style={[
                            styles.messageText,
                            isMine && styles.messageTextMine
                          ]}>
                            {message.text}
                          </Text>
                        </View>
                        <Text style={[
                          styles.messageTime,
                          isMine && styles.messageTimeMine
                        ]}>
                          {formatTime(message.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.messageInputContainer}>
              <View style={styles.messageInputWrapper}>
                <TextInput
                  style={styles.messageInput}
                  placeholder={`Message #${selectedChannel.name}`}
                  placeholderTextColor={colors.text3}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={2000}
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!messageText.trim() || sending) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <SvgIcon name="send" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          !isMobile && (
            <View style={styles.noChannelSelected}>
              <SvgIcon name="messageCircle" size={64} color={colors.text3} />
              <Text style={styles.noChannelTitle}>Select a channel</Text>
              <Text style={styles.noChannelText}>
                Choose a channel from the sidebar to start messaging
              </Text>
            </View>
          )
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, isMobile: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  topbar: {
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  topbarTitle: {
    flex: 1,
  },
  topbarTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  topbarBreadcrumb: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  topbarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  channelsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messengerContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  // Modal Header (Mobile)
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  // Channels Sidebar
  channelsSidebar: {
    width: isMobile ? '100%' : 280,
    backgroundColor: colors.bg2,
    borderRightWidth: isMobile ? 0 : 1,
    borderRightColor: colors.border,
  },
  channelsSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.bg,
    margin: 12,
    borderRadius: 20,
  },
  channelsSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  channelsList: {
    flex: 1,
  },
  noChannels: {
    padding: 32,
    alignItems: 'center',
  },
  noChannelsText: {
    fontSize: 14,
    color: colors.text3,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    position: 'relative',
  },
  channelItemActive: {
    backgroundColor: `${colors.accent}15`,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  channelIconActive: {
    backgroundColor: colors.accent,
  },
  channelInfo: {
    flex: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  channelNameActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  channelTime: {
    fontSize: 11,
    color: colors.text3,
    marginLeft: 8,
  },
  channelLastMessage: {
    fontSize: 13,
    color: colors.text3,
    lineHeight: 18,
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  // Chat Area
  chatArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isMobile ? 12 : 16,
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Messages Area
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  noMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  noMessagesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noMessagesText: {
    fontSize: 14,
    color: colors.text3,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageAvatarContainer: {
    width: 32,
    marginRight: 8,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  messageBubbleContainer: {
    maxWidth: isMobile ? '80%' : '70%',
  },
  messageBubbleContainerMine: {
    alignItems: 'flex-end',
  },
  messageSenderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleOther: {
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 4,
  },
  messageBubbleMine: {
    backgroundColor: colors.accent,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 4,
    marginLeft: 12,
  },
  messageTimeMine: {
    marginLeft: 0,
    marginRight: 12,
    textAlign: 'right',
  },
  // Message Input
  messageInputContainer: {
    padding: isMobile ? 12 : 16,
    backgroundColor: colors.bg2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // No Channel Selected
  noChannelSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  noChannelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noChannelText: {
    fontSize: 14,
    color: colors.text3,
    textAlign: 'center',
  },
});
