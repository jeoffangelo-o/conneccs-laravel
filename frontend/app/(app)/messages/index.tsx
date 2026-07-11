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
  Image,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
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
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [channelMembers, setChannelMembers] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionedUsers, setMentionedUsers] = useState<any[]>([]);
  const [completedMentions, setCompletedMentions] = useState<Array<{start: number, end: number, name: string}>>([]);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      loadChannelMembers(selectedChannel.id);
      if (isMobile) {
        setShowChannelsList(false);
      }
    }
  }, [selectedChannel]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/channels');
      // API returns { success: true, data: [...] }
      const channelsData = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
          ? response.data 
          : [];
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
      // API returns { success: true, data: [...] }
      const messagesData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
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

  const loadChannelMembers = async (channelId: string) => {
    try {
      const response = await apiService.get(`/channels/${channelId}/members`);
      const membersData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setChannelMembers(membersData);
    } catch (error) {
      console.error('Failed to load channel members:', error);
      setChannelMembers([]);
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
    if ((!messageText.trim() && attachments.length === 0) || !selectedChannel) return;
    
    // Extract mentioned user IDs
    const mentionedUserIds = mentionedUsers.map(u => u.id);
    
    const tempMessage = {
      id: `temp-${Date.now()}`,
      channelId: selectedChannel.id,
      userId: user?.id,
      userName: user?.name,
      content: messageText.trim(),
      attachments: attachments,
      replyToId: replyingTo?.id,
      replyTo: replyingTo,
      reactions: [],
      mentionedUsers: mentionedUserIds,
      createdAt: new Date().toISOString(),
      isMine: true,
      isCurrentUser: true,
    };
    
    // Optimistic update
    setMessages([...messages, tempMessage]);
    setMessageText('');
    setAttachments([]);
    setReplyingTo(null);
    setMentionedUsers([]);
    setCompletedMentions([]);
    setShowMentions(false);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      setSending(true);
      await apiService.post(`/channels/${selectedChannel.id}/messages`, {
        content: messageText.trim(),
        replyToId: replyingTo?.id,
        attachments: attachments,
        mentionedUsers: mentionedUserIds,
      });
      
      // Reload messages to get server version
      await loadMessages(selectedChannel.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages(messages);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMessageTextChange = (text: string) => {
    setMessageText(text);

    // Check for @ mentions
    const lastAtIndex = text.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if @ is at start or after a space
      const charBeforeAt = lastAtIndex === 0 ? ' ' : text[lastAtIndex - 1];
      
      if (charBeforeAt === ' ' || lastAtIndex === 0) {
        const textAfterAt = text.substring(lastAtIndex + 1);
        const spaceAfterAt = textAfterAt.indexOf(' ');
        const searchQuery = spaceAfterAt === -1 ? textAfterAt : textAfterAt.substring(0, spaceAfterAt);
        
        // Show mention suggestions
        if (spaceAfterAt === -1) {
          setMentionSearch(searchQuery.toLowerCase());
          setMentionStartIndex(lastAtIndex);
          setShowMentions(true);
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMention = (member: any) => {
    if (mentionStartIndex === -1) return;

    // Replace @search with @username
    const beforeMention = messageText.substring(0, mentionStartIndex);
    const afterMention = messageText.substring(mentionStartIndex + mentionSearch.length + 1);
    const mentionText = `@${member.name}`;
    const newText = `${beforeMention}${mentionText} ${afterMention}`;
    
    // Track this completed mention for highlighting
    const mentionEnd = mentionStartIndex + mentionText.length;
    setCompletedMentions([
      ...completedMentions,
      { start: mentionStartIndex, end: mentionEnd, name: member.name }
    ]);
    
    setMessageText(newText);
    setShowMentions(false);
    setMentionSearch('');
    setMentionStartIndex(-1);
    
    // Add to mentioned users if not already added
    if (!mentionedUsers.find(u => u.id === member.id)) {
      setMentionedUsers([...mentionedUsers, member]);
    }
  };

  const filteredMembers = channelMembers.filter(member =>
    member.name.toLowerCase().includes(mentionSearch) ||
    member.email.toLowerCase().includes(mentionSearch)
  );

  const renderMessageContent = (content: string, mentionedUserIds: any[], isMine: boolean) => {
    if (!content) return null;
    
    // Check if content has any @ symbols
    if (!content.includes('@')) {
      return content;
    }
    
    // Define inline styles for mentions
    const mentionStyle = {
      color: isMine ? '#ffffff' : '#f4c430',
      fontWeight: '700' as '700',
      backgroundColor: isMine ? 'rgba(255, 255, 255, 0.25)' : 'rgba(244, 196, 48, 0.3)',
      paddingLeft: 4,
      paddingRight: 4,
      paddingTop: 2,
      paddingBottom: 2,
      borderRadius: 4,
    };
    
    // Split by @ and process each part
    const segments = content.split(/(@[\w\s.]+)/g);
    
    return (
      <>
        {segments.map((segment, index) => {
          // Check if this segment is a mention (starts with @)
          if (segment.startsWith('@') && segment.length > 1) {
            return (
              <Text key={index} style={mentionStyle}>
                {segment}
              </Text>
            );
          }
          return <Text key={index}>{segment}</Text>;
        })}
      </>
    );
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        await uploadFile(result);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadFile = async (file: any) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || file.type || 'application/octet-stream',
        name: file.name || file.fileName || 'file',
      } as any);

      const response = await apiService.post('/channels/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.data) {
        setAttachments([...attachments, response.data.data]);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleReply = (message: any) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await apiService.post(`/channels/${selectedChannel.id}/messages/${messageId}/react`, {
        emoji,
      });
      
      // Reload messages to get updated reactions
      await loadMessages(selectedChannel.id);
      setShowEmojiPicker(null);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥'];

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
                  const isMine = message.isCurrentUser || message.userId === user?.id;
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
                        
                        {/* Reply Preview */}
                        {message.replyTo && (
                          <TouchableOpacity style={[
                            styles.replyPreview,
                            isMine && styles.replyPreviewMine
                          ]}>
                            <View style={styles.replyLine} />
                            <View style={styles.replyContent}>
                              <Text style={[
                                styles.replyUserName,
                                isMine && styles.replyTextMine
                              ]}>
                                {message.replyTo.userName}
                              </Text>
                              <Text 
                                style={[
                                  styles.replyText,
                                  isMine && styles.replyTextMine
                                ]} 
                                numberOfLines={2}
                              >
                                {message.replyTo.content}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}

                        <View style={[
                          styles.messageBubble,
                          isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                        ]}>
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <View style={styles.attachmentsContainer}>
                              {message.attachments.map((attachment: any, idx: number) => (
                                <TouchableOpacity 
                                  key={idx} 
                                  style={styles.attachmentItem}
                                  onPress={() => {/* Open attachment */}}
                                >
                                  {attachment.type?.startsWith('image/') ? (
                                    <Image 
                                      source={{ uri: attachment.url }} 
                                      style={styles.attachmentImage}
                                      resizeMode="cover"
                                    />
                                  ) : (
                                    <View style={styles.attachmentFile}>
                                      <SvgIcon name="file" size={24} color={colors.text2} />
                                      <Text style={styles.attachmentFileName} numberOfLines={1}>
                                        {attachment.name}
                                      </Text>
                                      <Text style={styles.attachmentFileSize}>
                                        {(attachment.size / 1024).toFixed(1)} KB
                                      </Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {message.content || message.text ? (
                            <Text style={[
                              styles.messageText,
                              isMine && styles.messageTextMine
                            ]}>
                              {renderMessageContent(
                                message.content || message.text,
                                message.mentionedUsers,
                                isMine
                              )}
                            </Text>
                          ) : null}
                        </View>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <View style={styles.reactionsContainer}>
                            {message.reactions.map((reaction: any, idx: number) => (
                              <TouchableOpacity
                                key={idx}
                                style={[
                                  styles.reactionBubble,
                                  reaction.hasReacted && styles.reactionBubbleActive
                                ]}
                                onPress={() => handleReaction(message.id, reaction.emoji)}
                              >
                                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                                <Text style={[
                                  styles.reactionCount,
                                  reaction.hasReacted && styles.reactionCountActive
                                ]}>
                                  {reaction.count}
                                </Text>
                              </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                              style={styles.addReactionButton}
                              onPress={() => setShowEmojiPicker(message.id)}
                            >
                              <SvgIcon name="plus" size={12} color={colors.text3} />
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* Message Actions */}
                        <View style={styles.messageActions}>
                          {!message.reactions || message.reactions.length === 0 ? (
                            <TouchableOpacity
                              style={styles.messageAction}
                              onPress={() => setShowEmojiPicker(message.id)}
                            >
                              <SvgIcon name="smile" size={14} color={colors.text3} />
                            </TouchableOpacity>
                          ) : null}
                          <TouchableOpacity
                            style={styles.messageAction}
                            onPress={() => handleReply(message)}
                          >
                            <SvgIcon name="cornerUpLeft" size={14} color={colors.text3} />
                          </TouchableOpacity>
                          <Text style={[
                            styles.messageTime,
                            isMine && styles.messageTimeMine
                          ]}>
                            {formatTime(message.createdAt)}
                          </Text>
                        </View>
                      </View>

                      {/* Emoji Picker Modal */}
                      {showEmojiPicker === message.id && (
                        <Modal
                          visible={true}
                          transparent={true}
                          animationType="fade"
                          onRequestClose={() => setShowEmojiPicker(null)}
                        >
                          <TouchableOpacity 
                            style={styles.emojiPickerOverlay}
                            activeOpacity={1}
                            onPress={() => setShowEmojiPicker(null)}
                          >
                            <View style={styles.emojiPicker}>
                              {commonEmojis.map((emoji, idx) => (
                                <TouchableOpacity
                                  key={idx}
                                  style={styles.emojiButton}
                                  onPress={() => handleReaction(message.id, emoji)}
                                >
                                  <Text style={styles.emojiText}>{emoji}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </TouchableOpacity>
                        </Modal>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.messageInputContainer}>
              {/* Mention Suggestions */}
              {showMentions && filteredMembers.length > 0 && (
                <View style={styles.mentionSuggestions}>
                  <ScrollView 
                    style={styles.mentionList}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredMembers.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        style={styles.mentionItem}
                        onPress={() => handleSelectMention(member)}
                      >
                        <View style={styles.mentionAvatar}>
                          <Text style={styles.mentionAvatarText}>
                            {member.name?.[0] || '?'}
                          </Text>
                        </View>
                        <View style={styles.mentionInfo}>
                          <Text style={styles.mentionName}>{member.name}</Text>
                          <Text style={styles.mentionEmail}>{member.email}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Reply Bar */}
              {replyingTo && (
                <View style={styles.replyBar}>
                  <View style={styles.replyBarContent}>
                    <SvgIcon name="cornerUpLeft" size={16} color={colors.text3} />
                    <View style={styles.replyBarText}>
                      <Text style={styles.replyBarUser}>Replying to {replyingTo.userName}</Text>
                      <Text style={styles.replyBarMessage} numberOfLines={1}>
                        {replyingTo.content}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleCancelReply}>
                    <SvgIcon name="x" size={20} color={colors.text3} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <ScrollView 
                  horizontal 
                  style={styles.attachmentsPreview}
                  showsHorizontalScrollIndicator={false}
                >
                  {attachments.map((attachment, index) => (
                    <View key={index} style={styles.attachmentPreviewItem}>
                      {attachment.type?.startsWith('image/') ? (
                        <Image 
                          source={{ uri: attachment.url }} 
                          style={styles.attachmentPreviewImage}
                        />
                      ) : (
                        <View style={styles.attachmentPreviewFile}>
                          <SvgIcon name="file" size={24} color={colors.accent} />
                          <Text style={styles.attachmentPreviewName} numberOfLines={1}>
                            {attachment.name}
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => handleRemoveAttachment(index)}
                      >
                        <SvgIcon name="x" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={styles.messageInputWrapper}>
                {/* Attachment Buttons */}
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={handlePickImage}
                  disabled={uploading}
                >
                  <SvgIcon name="image" size={20} color={colors.text2} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={handlePickDocument}
                  disabled={uploading}
                >
                  <SvgIcon name="paperclip" size={20} color={colors.text2} />
                </TouchableOpacity>

                {/* Message Input with Overlay for Highlighting */}
                <View style={styles.messageInputContainer2}>
                  {/* Highlighted Text Overlay */}
                  {messageText.length > 0 && (
                    <View style={[styles.messageInputOverlay, { pointerEvents: 'none' }]}>
                      <Text style={[styles.messageInputText]}>
                        {(() => {
                          // Use tracked completed mentions for accurate highlighting
                          if (completedMentions.length === 0) {
                            return <Text style={{ color: colors.text }}>{messageText}</Text>;
                          }
                          
                          const parts: any[] = [];
                          let lastIndex = 0;
                          
                          // Sort mentions by start position
                          const sortedMentions = [...completedMentions].sort((a, b) => a.start - b.start);
                          
                          sortedMentions.forEach((mention) => {
                            // Skip if mention is outside current text bounds
                            if (mention.start >= messageText.length) return;
                            
                            // Add text before this mention
                            if (mention.start > lastIndex) {
                              parts.push({
                                type: 'text',
                                content: messageText.substring(lastIndex, mention.start),
                              });
                            }
                            
                            // Add the mention (adjust end if text was edited)
                            const adjustedEnd = Math.min(mention.end, messageText.length);
                            parts.push({
                              type: 'mention',
                              content: messageText.substring(mention.start, adjustedEnd),
                            });
                            
                            lastIndex = adjustedEnd;
                          });
                          
                          // Add remaining text
                          if (lastIndex < messageText.length) {
                            parts.push({
                              type: 'text',
                              content: messageText.substring(lastIndex),
                            });
                          }
                          
                          return parts.map((part, index) => {
                            if (part.type === 'mention') {
                              return (
                                <Text
                                  key={index}
                                  style={{
                                    color: colors.accent,
                                    fontWeight: '700',
                                    backgroundColor: `${colors.accent}25`,
                                    paddingHorizontal: 4,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                  }}
                                >
                                  {part.content}
                                </Text>
                              );
                            }
                            return (
                              <Text key={index} style={{ color: colors.text }}>
                                {part.content}
                              </Text>
                            );
                          });
                        })()}
                      </Text>
                    </View>
                  )}

                  {/* Actual TextInput (transparent text when there's content) */}
                  <TextInput
                    style={[
                      styles.messageInput,
                      messageText.length > 0 && { color: 'transparent' },
                    ]}
                    placeholder={`Message #${selectedChannel.name}`}
                    placeholderTextColor={colors.text3}
                    value={messageText}
                    onChangeText={handleMessageTextChange}
                    multiline
                    maxLength={2000}
                    onSubmitEditing={handleSendMessage}
                  />
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    ((!messageText.trim() && attachments.length === 0) || sending || uploading) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={(!messageText.trim() && attachments.length === 0) || sending || uploading}
                >
                  {sending || uploading ? (
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
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  messageAction: {
    padding: 4,
  },
  // Reply Preview
  replyPreview: {
    backgroundColor: colors.bg,
    borderLeftWidth: 3,
    borderLeftColor: colors.text3,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  replyPreviewMine: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderLeftColor: '#fff',
  },
  replyLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  replyContent: {
    paddingLeft: 8,
  },
  replyUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    color: colors.text3,
  },
  replyTextMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Attachments
  attachmentsContainer: {
    marginBottom: 8,
  },
  attachmentItem: {
    marginBottom: 4,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  attachmentFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentFileName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  attachmentFileSize: {
    fontSize: 12,
    color: colors.text3,
  },
  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.bg3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reactionBubbleActive: {
    backgroundColor: `${colors.accent}15`,
    borderColor: colors.accent,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text2,
  },
  reactionCountActive: {
    color: colors.accent,
  },
  addReactionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Emoji Picker
  emojiPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: colors.bg2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 300,
  },
  emojiButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg3,
    borderRadius: 24,
  },
  emojiText: {
    fontSize: 28,
  },
  // Reply Bar
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.bg3,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  replyBarText: {
    flex: 1,
  },
  replyBarUser: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 2,
  },
  replyBarMessage: {
    fontSize: 13,
    color: colors.text2,
  },
  // Attachments Preview
  attachmentsPreview: {
    maxHeight: 100,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  attachmentPreviewItem: {
    position: 'relative',
    marginRight: 12,
  },
  attachmentPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  attachmentPreviewFile: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  attachmentPreviewName: {
    fontSize: 10,
    color: colors.text2,
    textAlign: 'center',
    marginTop: 4,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Mention Suggestions
  mentionSuggestions: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.bg2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mentionList: {
    flex: 1,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mentionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mentionAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  mentionInfo: {
    flex: 1,
  },
  mentionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  mentionEmail: {
    fontSize: 12,
    color: colors.text3,
  },
  mentionText: {
    color: '#f4c430', // Explicit yellow color
    fontWeight: '700',
    backgroundColor: 'rgba(244, 196, 48, 0.25)', // Yellow with 25% opacity
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  mentionTextMine: {
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    fontWeight: '700',
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
  messageInputContainer2: {
    flex: 1,
    position: 'relative',
  },
  messageInputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  messageInputText: {
    fontSize: 14,
    lineHeight: 20,
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
