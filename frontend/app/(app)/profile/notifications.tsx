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
import { useTheme } from '@/context/ThemeContext';
import { SvgIcon } from '@/components/SvgIcon';

export default function NotificationSettingsScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
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
          icon: 'bell',
        },
        {
          key: 'emailNotifications' as const,
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          icon: 'mail',
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
          icon: 'megaphone',
        },
        {
          key: 'messageAlerts' as const,
          label: 'Messages',
          description: 'Get notified about new messages',
          icon: 'messageCircle',
        },
        {
          key: 'opcrAlerts' as const,
          label: 'OPCR Updates',
          description: 'Get notified about OPCR submissions',
          icon: 'fileText',
        },
        {
          key: 'weeklyDigest' as const,
          label: 'Weekly Digest',
          description: 'Receive weekly activity summary',
          icon: 'calendar',
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
          icon: 'volume2',
        },
        {
          key: 'vibrationEnabled' as const,
          label: 'Vibration',
          description: 'Vibrate for notifications',
          icon: 'smartphone',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <SvgIcon name="arrowLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <SvgIcon name="info" size={24} color={colors.accent} />
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
                    <SvgIcon name={item.icon as any} size={24} color={colors.accent} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => handleToggle(item.key)}
                    trackColor={{ false: colors.border2, true: `${colors.accent}80` }}
                    thumbColor={settings[item.key] ? colors.accent : colors.text3}
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
          <SvgIcon name="bell" size={20} color={colors.accent} />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg3,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text2,
    marginLeft: 12,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingsCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.text3,
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    marginLeft: 8,
  },
});
