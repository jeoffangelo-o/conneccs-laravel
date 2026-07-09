import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Modal,
  Alert,
} from 'react-native';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const MESSAGES_STORAGE_KEY = '@conneccs_messages';

type Channel = {
  id: string;
  name: string;
  type: 'text';
};

type Message = {
  id: string;
  author: string;
  role: string;
  avatar: string;
  time: string;
  text: string;
  attachment?: {
    name: string;
    size: string;
  };
};

type Member = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  online: boolean;
};

const channels: Channel[] = [
  { id: '1', name: 'general', type: 'text' },
  { id: '2', name: 'announcements', type: 'text' },
  { id: '3', name: 'faculty-lounge', type: 'text' },
  { id: '4', name: 'research-updates', type: 'text' },
];

const channelMessages: Record<string, Message[]> = {
  '1': [ // general
    {
      id: '1',
      author: "Dean's Office",
      role: 'Dean',
      avatar: 'D',
      time: 'Today at 9:30 AM',
      text: 'Good morning everyone! Reminder that Q1 2025 reports are due on April 15. Please ensure all submissions are completed on time.',
    },
    {
      id: '2',
      author: 'Dr. Maria Santos',
      role: 'Faculty',
      avatar: 'MS',
      time: 'Today at 9:45 AM',
      text: "Thank you for the reminder! I've already submitted mine yesterday. 📝",
    },
    {
      id: '3',
      author: 'Prof. Juan Dela Cruz',
      role: 'Program Chair',
      avatar: 'JD',
      time: 'Today at 10:15 AM',
      text: 'I have a question about the IPCR evaluation criteria. Can someone share the updated rubric?',
    },
    {
      id: '4',
      author: 'Dr. Ana Reyes',
      role: 'Research Coordinator',
      avatar: 'AR',
      time: 'Today at 10:20 AM',
      text: "Here's the updated IPCR rubric for this semester:",
      attachment: {
        name: 'IPCR_Rubric_2025.pdf',
        size: '2.4 MB',
      },
    },
    {
      id: '5',
      author: 'Prof. Juan Dela Cruz',
      role: 'Program Chair',
      avatar: 'JD',
      time: 'Today at 10:22 AM',
      text: 'Perfect! Thank you so much, Dr. Reyes! 🙏',
    },
    {
      id: '6',
      author: 'Prof. Carlos Mendoza',
      role: 'Faculty',
      avatar: 'CM',
      time: 'Today at 11:05 AM',
      text: "Don't forget about the Research Colloquium on April 25! Looking forward to seeing everyone's presentations.",
    },
  ],
  '2': [ // announcements
    {
      id: '1',
      author: "Dean's Office",
      role: 'Dean',
      avatar: 'D',
      time: 'Yesterday at 2:00 PM',
      text: '📢 Important Announcement: Faculty Development Workshop on May 10, 2025. All faculty members are encouraged to attend.',
    },
    {
      id: '2',
      author: "Dean's Office",
      role: 'Dean',
      avatar: 'D',
      time: 'Yesterday at 3:30 PM',
      text: 'Reminder: Mid-year performance reviews will be conducted from April 20-30. Please prepare your documentation.',
    },
  ],
  '3': [ // faculty-lounge
    {
      id: '1',
      author: 'Dr. Maria Santos',
      role: 'Faculty',
      avatar: 'MS',
      time: 'Today at 8:15 AM',
      text: 'Good morning everyone! Anyone up for coffee later? ☕',
    },
    {
      id: '2',
      author: 'Prof. Carlos Mendoza',
      role: 'Faculty',
      avatar: 'CM',
      time: 'Today at 8:20 AM',
      text: "I'm in! Let's meet at the faculty lounge around 3 PM?",
    },
    {
      id: '3',
      author: 'Dr. Ana Reyes',
      role: 'Research Coordinator',
      avatar: 'AR',
      time: 'Today at 8:25 AM',
      text: 'Count me in! See you all later. 😊',
    },
  ],
  '4': [ // research-updates
    {
      id: '1',
      author: 'Dr. Ana Reyes',
      role: 'Research Coordinator',
      avatar: 'AR',
      time: 'Today at 9:00 AM',
      text: 'Update on ongoing research projects: We have 5 papers submitted for publication this quarter. Great work everyone!',
    },
    {
      id: '2',
      author: 'Prof. Juan Dela Cruz',
      role: 'Program Chair',
      avatar: 'JD',
      time: 'Today at 9:30 AM',
      text: 'My research on AI in Education has been accepted for the International Conference! 🎉',
    },
    {
      id: '3',
      author: 'Dr. Maria Santos',
      role: 'Faculty',
      avatar: 'MS',
      time: 'Today at 9:45 AM',
      text: 'Congratulations, Prof. Juan! That\'s amazing news!',
    },
  ],
};

const members: Member[] = [
  { id: '1', name: "Dean's Office", avatar: 'D', role: 'DEAN', online: true },
  { id: '2', name: 'Prof. Juan Dela Cruz', avatar: 'JD', role: 'PROGRAM CHAIRS', online: true },
  { id: '3', name: 'Prof. Ramon Garcia', avatar: 'RG', role: 'PROGRAM CHAIRS', online: false },
  { id: '4', name: 'Dr. Maria Santos', avatar: 'MS', role: 'FACULTY', online: true },
  { id: '5', name: 'Dr. Ana Reyes', avatar: 'AR', role: 'FACULTY', online: true },
  { id: '6', name: 'Prof. Carlos Mendoza', avatar: 'CM', role: 'FACULTY', online: true },
  { id: '7', name: 'Dr. Lisa Tan', avatar: 'LT', role: 'FACULTY', online: false },
];

export default function MessagesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors, width);
  const [activeChannel, setActiveChannel] = useState('1');
  const [messageText, setMessageText] = useState('');
  const [channelMessageLists, setChannelMessageLists] = useState(channelMessages);
  const [showMembers, setShowMembers] = useState(width > 1024);
  const [showChannels, setShowChannels] = useState(width > 768);
  const [isLoading, setIsLoading] = useState(true);
  const [showAttachmentChoice, setShowAttachmentChoice] = useState(false);

  // Update sidebar visibility when window resizes
  useEffect(() => {
    setShowMembers(width > 1024);
    setShowChannels(width > 768);
  }, [width]);

  // Load messages from AsyncStorage on mount
  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 2 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
      if (stored) {
        const parsedMessages = JSON.parse(stored);
        setChannelMessageLists(parsedMessages);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      setIsLoading(false);
    }
  };

  const saveMessages = async (messages: Record<string, Message[]>) => {
    try {
      await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const currentMessages = channelMessageLists[activeChannel] || [];

  const handleSendMessage = async () => {
    if (messageText.trim() === '') return;

    const newMessage: Message = {
      id: String(Date.now()),
      author: user?.name || 'Anonymous',
      role: user?.role || 'User',
      avatar: user?.initials || 'U',
      time: 'Just now',
      text: messageText,
    };

    const updatedMessages = {
      ...channelMessageLists,
      [activeChannel]: [...currentMessages, newMessage],
    };

    setChannelMessageLists(updatedMessages);
    await saveMessages(updatedMessages);
    setMessageText('');
  };

  const handleAttachmentPress = () => {
    if (Platform.OS === 'web') {
      // On web, show custom modal
      setShowAttachmentChoice(true);
    } else {
      // On mobile, show native dialog
      Alert.alert(
        'Add Attachment',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: () => handleTakePhoto(),
          },
          {
            text: 'Choose from Files',
            onPress: () => handleChooseFile(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    setShowAttachmentChoice(false);
    
    if (Platform.OS === 'web') {
      // On web, use file input with capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          sendImageMessage(file.name, URL.createObjectURL(file));
        }
      };
      input.click();
    } else {
      // On mobile, use camera
      try {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        
        if (permissionResult.granted === false) {
          Alert.alert('Permission Required', 'Permission to access camera is required!');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          sendImageMessage('Photo', result.assets[0].uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const handleChooseFile = async () => {
    setShowAttachmentChoice(false);
    
    if (Platform.OS === 'web') {
      // On web, use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const fileSize = (file.size / (1024 * 1024)).toFixed(2);
          sendFileMessage(file.name, fileSize);
        }
      };
      input.click();
    } else {
      // On mobile, use document picker
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          const fileSize = (file.size / (1024 * 1024)).toFixed(2);
          sendFileMessage(file.name, fileSize);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to pick file');
      }
    }
  };

  const sendImageMessage = async (fileName: string, imageUrl: string) => {
    const newMessage: Message = {
      id: String(Date.now()),
      author: user?.name || 'Anonymous',
      role: user?.role || 'User',
      avatar: user?.initials || 'U',
      time: 'Just now',
      text: `📷 Shared an image: ${fileName}`,
    };

    const updatedMessages = {
      ...channelMessageLists,
      [activeChannel]: [...currentMessages, newMessage],
    };

    setChannelMessageLists(updatedMessages);
    await saveMessages(updatedMessages);
  };

  const sendFileMessage = async (fileName: string, fileSize: string) => {
    const newMessage: Message = {
      id: String(Date.now()),
      author: user?.name || 'Anonymous',
      role: user?.role || 'User',
      avatar: user?.initials || 'U',
      time: 'Just now',
      text: `Shared a file:`,
      attachment: {
        name: fileName,
        size: `${fileSize} MB`,
      },
    };

    const updatedMessages = {
      ...channelMessageLists,
      [activeChannel]: [...currentMessages, newMessage],
    };

    setChannelMessageLists(updatedMessages);
    await saveMessages(updatedMessages);
  };

  const groupedMembers = members.reduce((acc, member) => {
    if (!acc[member.role]) {
      acc[member.role] = [];
    }
    acc[member.role].push(member);
    return acc;
  }, {} as Record<string, Member[]>);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          {width <= 768 && (
            <TouchableOpacity onPress={() => setShowChannels(!showChannels)}>
              <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
            </TouchableOpacity>
          )}
          {width > 768 && (
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
            </TouchableOpacity>
          )}
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>Messages</Text>
            <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal › Messages</Text>
          </View>
        </View>
      </View>

      <View style={styles.messagesLayout}>
        {/* Overlay backdrop for mobile */}
        {showChannels && width <= 768 && (
          <TouchableOpacity 
            style={styles.mobileOverlay}
            activeOpacity={1}
            onPress={() => setShowChannels(false)}
          />
        )}

        {/* Channels Sidebar - Collapsible on mobile */}
        {showChannels && (
          <View style={[styles.channelsSidebar, width <= 768 && styles.channelsSidebarMobile]}>
          <View style={styles.channelsHeader}>
            <Text style={styles.channelsHeaderText}>CCS Channels</Text>
            {width <= 768 && (
              <TouchableOpacity onPress={() => setShowChannels(false)}>
                <SvgIcon name="x" size={20} color={colors.text3} style={{}} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={styles.channelsList}>
            <Text style={styles.channelSectionLabel}>TEXT CHANNELS</Text>
            {channels.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.channelItem,
                  activeChannel === channel.id && styles.channelItemActive,
                ]}
                onPress={() => {
                  setActiveChannel(channel.id);
                  if (width <= 768) {
                    setShowChannels(false);
                  }
                }}
              >
                <SvgIcon
                  name="messageCircle"
                  size={16}
                  color={activeChannel === channel.id ? colors.accent : colors.text2}
                  style={{}}
                />
                <Text
                  style={[
                    styles.channelItemText,
                    activeChannel === channel.id && styles.channelItemTextActive,
                  ]}
                >
                  {channel.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        )}

        {/* Chat Area */}
        <View style={styles.chatArea}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            {width <= 768 && (
              <TouchableOpacity onPress={() => setShowChannels(!showChannels)}>
                <SvgIcon name="menu" size={20} color={colors.text2} style={{}} />
              </TouchableOpacity>
            )}
            <SvgIcon name="messageCircle" size={20} color={colors.text2} style={{}} />
            <Text style={styles.chatHeaderTitle}>
              # {channels.find((c) => c.id === activeChannel)?.name}
            </Text>
            <View style={{ flex: 1 }} />
            {width > 768 && (
              <TouchableOpacity 
                style={styles.toggleMembersBtn}
                onPress={() => setShowMembers(!showMembers)}
              >
                <SvgIcon name="users" size={20} color={colors.text2} style={{}} />
              </TouchableOpacity>
            )}
          </View>

          {/* Messages */}
          <ScrollView style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent}>
            {currentMessages.map((message) => (
              <View key={message.id} style={styles.messageGroup}>
                <View style={styles.messageAvatar}>
                  <Text style={styles.messageAvatarText}>{message.avatar}</Text>
                </View>
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageAuthor}>{message.author}</Text>
                    <View style={styles.messageRole}>
                      <Text style={styles.messageRoleText}>{message.role}</Text>
                    </View>
                    <Text style={styles.messageTime}>{message.time}</Text>
                  </View>
                  <Text style={styles.messageText}>{message.text}</Text>
                  {message.attachment && (
                    <View style={styles.messageAttachment}>
                      <View style={styles.attachmentIcon}>
                        <SvgIcon name="document" size={16} color={colors.accent} style={{}} />
                      </View>
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName}>{message.attachment.name}</Text>
                        <Text style={styles.attachmentSize}>{message.attachment.size}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.chatInputArea}>
            <View style={styles.chatInputWrapper}>
              <TouchableOpacity style={styles.inputBtn}>
                <SvgIcon name="link" size={18} color={colors.text3} style={{}} />
              </TouchableOpacity>
              <TextInput
                style={styles.chatInput}
                placeholder={`Message #${channels.find((c) => c.id === activeChannel)?.name}`}
                placeholderTextColor={colors.text3}
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.inputBtn} onPress={handleAttachmentPress}>
                <SvgIcon name="plus" size={18} color={colors.text3} style={{}} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.inputBtn, styles.sendBtn]} 
                onPress={handleSendMessage}
              >
                <SvgIcon name="chevronRight" size={18} color="#fff" style={{}} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Members Sidebar - Toggleable, hidden on mobile */}
        {showMembers && width > 768 && (
          <View style={styles.membersSidebar}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.entries(groupedMembers).map(([role, roleMembers]) => (
                <View key={role} style={styles.memberSection}>
                  <Text style={styles.memberSectionLabel}>
                    {role} — {roleMembers.length}
                  </Text>
                  {roleMembers.map((member) => (
                    <TouchableOpacity key={member.id} style={styles.memberItem}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                        <View style={[styles.statusIndicator, !member.online && styles.statusIndicatorOffline]} />
                      </View>
                      <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Attachment Choice Modal */}
      <Modal
        visible={showAttachmentChoice}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttachmentChoice(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setShowAttachmentChoice(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 400 }}
          >
            <YStack bg="$bg2" br="$4" p="$5" maxWidth={400} width="100%">
              {/* Modal Header */}
              <XStack jc="space-between" ai="center" mb="$4">
                <TamaguiText fontSize={20} fontWeight="800" color="$text">
                  Add Attachment
                </TamaguiText>
                <XStack
                  w={32}
                  h={32}
                  bg="$bg3"
                  br={16}
                  ai="center"
                  jc="center"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={() => setShowAttachmentChoice(false)}
                  cursor="pointer"
                >
                  <SvgIcon name="x" size={18} color={colors.text} style={{}} />
                </XStack>
              </XStack>

              <TamaguiText fontSize={14} color="$text3" mb="$4">
                Choose how you want to add an attachment
              </TamaguiText>

              {/* Take Photo Button */}
              <XStack
                bg="$accent"
                p="$4"
                br="$3"
                ai="center"
                gap="$3"
                mb="$3"
                pressStyle={{ opacity: 0.8 }}
                onPress={handleTakePhoto}
                cursor="pointer"
              >
                <YStack
                  w={48}
                  h={48}
                  bg="rgba(255,255,255,0.2)"
                  br={24}
                  ai="center"
                  jc="center"
                >
                  <SvgIcon name="camera" size={24} color="#fff" style={{}} />
                </YStack>
                <YStack f={1}>
                  <TamaguiText fontSize={16} fontWeight="700" color="#fff" mb={2}>
                    Take Photo
                  </TamaguiText>
                  <TamaguiText fontSize={12} color="rgba(255,255,255,0.8)">
                    Use your camera to capture a photo
                  </TamaguiText>
                </YStack>
              </XStack>

              {/* Choose from Files Button */}
              <XStack
                bg="$bg3"
                p="$4"
                br="$3"
                ai="center"
                gap="$3"
                bw={1}
                bc="$border"
                pressStyle={{ opacity: 0.7 }}
                onPress={handleChooseFile}
                cursor="pointer"
              >
                <YStack
                  w={48}
                  h={48}
                  bg="$accent"
                  br={24}
                  ai="center"
                  jc="center"
                >
                  <SvgIcon name="document" size={24} color="#fff" style={{}} />
                </YStack>
                <YStack f={1}>
                  <TamaguiText fontSize={16} fontWeight="700" color="$text" mb={2}>
                    Choose from Files
                  </TamaguiText>
                  <TamaguiText fontSize={12} color="$text3">
                    Select a file or image from your device
                  </TamaguiText>
                </YStack>
              </XStack>

              {/* Cancel Button */}
              <XStack
                bg="$border"
                p="$3.5"
                br="$3"
                ai="center"
                jc="center"
                mt="$4"
                pressStyle={{ opacity: 0.8 }}
                onPress={() => setShowAttachmentChoice(false)}
                cursor="pointer"
              >
                <TamaguiText fontSize={14} fontWeight="700" color="$text">
                  Cancel
                </TamaguiText>
              </XStack>
            </YStack>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any, width: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topbar: {
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: width <= 768 ? 16 : 24,
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
  messagesLayout: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  mobileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9,
  },
  // Channels Sidebar
  channelsSidebar: {
    width: width <= 768 ? '100%' : width <= 1024 ? 200 : 240,
    backgroundColor: colors.bg2,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  channelsSidebarMobile: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  channelsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelsHeaderText: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
  },
  channelsList: {
    flex: 1,
    padding: 8,
  },
  channelSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 2,
    position: 'relative',
  },
  channelItemActive: {
    backgroundColor: `${colors.accent}15`,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 3,
    borderRightColor: colors.accent,
    marginRight: -3,
  },
  channelItemText: {
    fontSize: 14,
    color: colors.text2,
  },
  channelItemTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  // Chat Area
  chatArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  chatHeader: {
    height: 60,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg2,
  },
  chatHeaderTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
  },
  toggleMembersBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: width <= 768 ? 12 : 20,
    gap: width <= 768 ? 12 : 16,
  },
  messageGroup: {
    flexDirection: 'row',
    gap: width <= 768 ? 8 : 12,
    marginBottom: width <= 768 ? 12 : 16,
  },
  messageAvatar: {
    width: width <= 768 ? 32 : 40,
    height: width <= 768 ? 32 : 40,
    borderRadius: width <= 768 ? 16 : 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  messageAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: width <= 768 ? 12 : 14,
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  messageAuthor: {
    fontWeight: '600',
    fontSize: width <= 768 ? 13 : 14,
    color: colors.text,
  },
  messageRole: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${colors.accent}20`,
  },
  messageRoleText: {
    fontSize: width <= 768 ? 10 : 11,
    color: colors.accent,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: width <= 768 ? 10 : 11,
    color: colors.text3,
  },
  messageText: {
    fontSize: width <= 768 ? 13 : 14,
    color: colors.text2,
    lineHeight: width <= 768 ? 18 : 20,
  },
  messageAttachment: {
    marginTop: 8,
    padding: width <= 768 ? 10 : 12,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: width <= 768 ? '100%' : 400,
  },
  attachmentIcon: {
    width: 32,
    height: 32,
    backgroundColor: `${colors.accent}20`,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  attachmentSize: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  chatInputArea: {
    padding: width <= 768 ? 12 : 20,
    backgroundColor: colors.bg2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width <= 768 ? 8 : 12,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: width <= 768 ? 8 : 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 12,
  },
  chatInput: {
    flex: 1,
    fontSize: width <= 768 ? 13 : 14,
    color: colors.text,
    outlineStyle: 'none',
    minWidth: 0,
  },
  inputBtn: {
    width: width <= 768 ? 28 : 32,
    height: width <= 768 ? 28 : 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    flexShrink: 0,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  // Members Sidebar
  membersSidebar: {
    width: width <= 1024 ? 180 : 200,
    backgroundColor: colors.bg2,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    padding: 12,
  },
  memberSection: {
    marginBottom: 14,
  },
  memberSectionLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 2,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  memberAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  memberName: {
    flex: 1,
    fontSize: 12,
    color: colors.text2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.bg2,
  },
  statusIndicatorOffline: {
    backgroundColor: colors.text3,
  },
});
