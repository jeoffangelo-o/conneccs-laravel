import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    announcementAlerts: true,
    messageAlerts: true,
    opcrAlerts: true,
    weeklyDigest: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    // TODO: Save settings to backend
    Alert.alert('Success', 'Notification settings updated successfully');
  };

  const settingsSections = [
    {
      title: 'General',
      items: [
        {
          key: 'pushNotifications' as const,
          label: 'Push Notifications',
          description: 'Receive notifications on your device',
          icon: 'notifications-outline',
        },
        {
          key: 'emailNotifications' as const,
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          icon: 'mail-outline',
        },
      ],
    },
    {
      title: 'Alerts',
      items: [
        {
          key: 'announcementAlerts' as const,
          label: 'Announcements',
          description: 'Get notified about new announcements',
          icon: 'megaphone-outline',
        },
        {
          key: 'messageAlerts' as const,
          label: 'Messages',
          description: 'Get notified about new messages',
          icon: 'chatbubble-outline',
        },
        {
          key: 'opcrAlerts' as const,
          label: 'OPCR Updates',
          description: 'Get notified about OPCR submissions',
          icon: 'document-text-outline',
        },
        {
          key: 'weeklyDigest' as const,
          label: 'Weekly Digest',
          description: 'Receive weekly activity summary',
          icon: 'calendar-outline',
        },
      ],
    },
    {
      title: 'Sound & Vibration',
      items: [
        {
          key: 'soundEnabled' as const,
          label: 'Sound',
          description: 'Play sound for notifications',
          icon: 'volume-high-outline',
        },
        {
          key: 'vibrationEnabled' as const,
          label: 'Vibration',
          description: 'Vibrate for notifications',
          icon: 'phone-portrait-outline',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            Manage how you receive notifications from ConneCCS. Changes are saved automatically.
          </Text>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingsCard}>
              {section.items.map((item, itemIndex) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingItem,
                    itemIndex !== section.items.length - 1 && styles.settingItemBorder,
                  ]}
                >
                  <View style={styles.settingIconContainer}>
                    <Ionicons name={item.icon as any} size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => handleToggle(item.key)}
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={settings[item.key] ? '#3B82F6' : '#F3F4F6'}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Test Notification Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => Alert.alert('Test Notification', 'This is a test notification from ConneCCS')}
        >
          <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 8,
  },
});
