import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: any;
  createdAt: string;
  readAt?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = createStyles(colors, isMobile);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'unread' ? '?unread_only=true' : '';
      const response = await apiService.get(`/notifications${params}`);
      const notificationsData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      
      // Map snake_case to camelCase
      const mappedNotifications = notificationsData.map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        actionUrl: n.action_url,
        metadata: n.metadata,
        createdAt: n.created_at,
        readAt: n.read_at,
      }));
      
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notif: Notification) => {
    try {
      // Mark as read if not already
      if (!notif.isRead) {
        await apiService.put(`/notifications/${notif.id}/read`);
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
        );
      }

      // Navigate to action URL if available
      if (notif.actionUrl) {
        router.push(notif.actionUrl as any);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.post('/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await apiService.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleClearRead = async () => {
    Alert.alert(
      'Clear Read Notifications',
      'Are you sure you want to delete all read notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.post('/notifications/clear-read');
              setNotifications(prev => prev.filter(n => !n.isRead));
            } catch (error) {
              console.error('Failed to clear read notifications:', error);
              Alert.alert('Error', 'Failed to clear read notifications');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'IPCR_APPROVED':
        return 'checkCircle';
      case 'IPCR_RETURNED':
      case 'IPCR_INCOMPLETE':
        return 'alertCircle';
      case 'IPCR_SUBMITTED':
      case 'IPCR_ENDORSED':
      case 'IPCR_RATED':
        return 'fileText';
      case 'MESSAGE_RECEIVED':
      case 'MESSAGE_REPLY':
        return 'messageCircle';
      case 'MESSAGE_MENTION':
        return 'atSign';
      case 'CHANNEL_ADDED':
        return 'users';
      case 'ANNOUNCEMENT_POSTED':
      case 'SYSTEM_ANNOUNCEMENT':
        return 'bell';
      case 'TARGET_DEADLINE':
      case 'ACCOMPLISHMENT_DEADLINE':
      case 'REPORTORIAL_DUE':
        return 'clock';
      case 'REPORTORIAL_SUBMITTED':
        return 'checkCircle';
      case 'DOCUMENT_SHARED':
        return 'file';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'IPCR_APPROVED':
      case 'REPORTORIAL_SUBMITTED':
        return colors.green;
      case 'IPCR_RETURNED':
      case 'IPCR_INCOMPLETE':
        return colors.red;
      case 'MESSAGE_MENTION':
        return colors.yellow;
      case 'TARGET_DEADLINE':
      case 'ACCOMPLISHMENT_DEADLINE':
      case 'REPORTORIAL_DUE':
        return colors.orange;
      default:
        return colors.accent;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text2 }]}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <SvgIcon name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>Notifications</Text>
            <Text style={styles.topbarBreadcrumb}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.topbarActions}>
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleMarkAllAsRead}
            >
              <SvgIcon name="check" size={20} color={colors.text2} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleClearRead}
          >
            <SvgIcon name="trash" size={20} color={colors.text2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterTabText,
            filter === 'all' && styles.filterTabTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[
            styles.filterTabText,
            filter === 'unread' && styles.filterTabTextActive
          ]}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <SvgIcon name="bell" size={48} color={colors.text3} />
            <Text style={[styles.emptyText, { color: colors.text3 }]}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredNotifications.map(notif => (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  !notif.isRead && styles.notifCardUnread,
                ]}
                onPress={() => handleNotificationPress(notif)}
                onLongPress={() => {
                  Alert.alert(
                    'Notification Options',
                    notif.title,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: notif.isRead ? 'Mark as Unread' : 'Mark as Read',
                        onPress: async () => {
                          try {
                            if (notif.isRead) {
                              await apiService.put(`/notifications/${notif.id}/unread`);
                              setNotifications(prev =>
                                prev.map(n => n.id === notif.id ? { ...n, isRead: false, readAt: undefined } : n)
                              );
                            } else {
                              await apiService.put(`/notifications/${notif.id}/read`);
                              setNotifications(prev =>
                                prev.map(n => n.id === notif.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
                              );
                            }
                          } catch (error) {
                            console.error('Failed to toggle read status:', error);
                          }
                        },
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleDeleteNotification(notif.id),
                      },
                    ]
                  );
                }}
              >
                <View style={[
                  styles.notifIcon,
                  { backgroundColor: getNotificationColor(notif.type) + '20' }
                ]}>
                  <SvgIcon
                    name={getNotificationIcon(notif.type)}
                    size={20}
                    color={getNotificationColor(notif.type)}
                  />
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, { color: colors.text }]}>
                    {notif.title}
                  </Text>
                  <Text style={[styles.notifMessage, { color: colors.text2 }]}>
                    {notif.message}
                  </Text>
                  <Text style={[styles.notifTime, { color: colors.text3 }]}>
                    {formatDate(notif.createdAt)}
                  </Text>
                </View>
                {!notif.isRead && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: 12,
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: colors.accent,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text2,
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    padding: isMobile ? 12 : 16,
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
    backgroundColor: colors.bg2,
    borderColor: colors.accent + '40',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 16,
  },
});
