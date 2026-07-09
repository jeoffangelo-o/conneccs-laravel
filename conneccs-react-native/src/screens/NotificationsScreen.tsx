import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import { WebScrollView } from '../components/WebScrollView';

export default function NotificationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { notifications, markNotificationRead } = useData();
  const styles = createStyles(colors);

  const userNotifications = notifications.filter(n => n.userId === user?.id);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleNotificationPress = (notifId: string) => {
    markNotificationRead(notifId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'IPCR_APPROVED':
        return 'checkCircle';
      case 'IPCR_REVISION':
        return 'alertCircle';
      case 'IPCR_SUBMITTED':
        return 'fileText';
      case 'DEADLINE_REMINDER':
        return 'clock';
      default:
        return 'bell';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>Notifications</Text>
            <Text style={styles.topbarBreadcrumb}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      <WebScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {userNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <SvgIcon name="bell" size={48} color={colors.text3} style={{}} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {userNotifications.map(notif => (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  !notif.isRead && styles.notifCardUnread,
                ]}
                onPress={() => handleNotificationPress(notif.id)}
              >
                <View style={styles.notifIcon}>
                  <SvgIcon
                    name={getNotificationIcon(notif.type)}
                    size={20}
                    color={notif.isRead ? colors.text3 : colors.accent}
                    style={{}}
                  />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifMessage}>{notif.message}</Text>
                  <Text style={styles.notifTime}>{formatDate(notif.createdAt)}</Text>
                </View>
                {!notif.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </WebScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topbar: {
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  list: {
    gap: 12,
  },
  notifCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  notifCardUnread: {
    backgroundColor: '#1a1a1a',
    borderColor: colors.accent + '40',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
    color: colors.text3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text3,
    marginTop: 16,
  },
});
