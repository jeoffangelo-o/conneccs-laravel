import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SvgIcon } from '../components/SvgIcon';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function MessagesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const messages = [
    {
      sender: 'Dr. Maria Santos',
      subject: 'IPCR Submission Reminder',
      preview: 'Please submit your IPCR forms by end of month...',
      time: '2h ago',
      unread: true,
    },
    {
      sender: 'Prof. Juan Dela Cruz',
      subject: 'Research Collaboration',
      preview: 'I would like to discuss potential collaboration...',
      time: '5h ago',
      unread: true,
    },
    {
      sender: 'Admin Office',
      subject: 'Faculty Meeting Schedule',
      preview: 'The next faculty meeting is scheduled for...',
      time: '1d ago',
      unread: false,
    },
    {
      sender: 'Dr. Ana Reyes',
      subject: 'Document Review Request',
      preview: 'Could you please review the attached document...',
      time: '2d ago',
      unread: false,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <SvgIcon name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Messages</Text>
          <Text style={styles.topbarBreadcrumb}>Internal Communication</Text>
        </View>
        <TouchableOpacity>
          <SvgIcon name="notifications-outline" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <TouchableOpacity style={styles.btnPrimary}>
            <SvgIcon name="create" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>Compose</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          {messages.map((message, index) => (
            <TouchableOpacity key={index} style={styles.messageItem}>
              <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>
                  {message.sender.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={[styles.messageSender, message.unread && styles.unreadText]}>
                    {message.sender}
                  </Text>
                  <Text style={styles.messageTime}>{message.time}</Text>
                </View>
                <Text style={[styles.messageSubject, message.unread && styles.unreadText]}>
                  {message.subject}
                </Text>
                <Text style={styles.messagePreview} numberOfLines={1}>
                  {message.preview}
                </Text>
              </View>
              {message.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topbar: {
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topbarCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  topbarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  topbarBreadcrumb: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  panel: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  messageAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  messageTime: {
    fontSize: 11,
    color: colors.text3,
  },
  messageSubject: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 12,
    color: colors.text3,
  },
  unreadText: {
    fontWeight: '700',
  },
  unreadDot: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
