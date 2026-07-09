import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgIcon } from '../components/SvgIcon';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function AnnouncementsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const announcements = [
    { id: 1, title: 'Q1 2025 Report Submission Deadline', author: "Dean's Office", date: '2025-04-01', priority: 'High', pinned: true, message: 'All faculty members are reminded to submit their Q1 2025 Accomplishment Reports on or before April 15, 2025.' },
    { id: 2, title: 'IPCR Rating Period Now Open', author: 'Dr. Maria Santos', date: '2025-04-03', priority: 'Medium', message: 'Faculty IPCR entries for the 1st Semester 2025 are now open for submission.' },
    { id: 3, title: 'Research Colloquium – April 25', author: 'Dr. Ana Reyes', date: '2025-04-05', priority: 'Medium', message: 'Research Coordinators and Faculty with ongoing research projects are required to present updates.' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <SvgIcon name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Announcements</Text>
          <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal › Announcements</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('AnnouncementForm')}>
          <SvgIcon name="plus" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {announcements.map((item) => (
          <View key={item.id} style={[styles.announcementCard, item.pinned && styles.pinnedCard]}>
            {item.pinned && <Text style={styles.pinIcon}>📌</Text>}
            <Text style={styles.announcementTitle}>{item.title}</Text>
            <Text style={styles.announcementMeta}>
              👤 {item.author} • 📅 {item.date}
            </Text>
            <Text style={styles.announcementBody}>{item.message}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, item.priority === 'High' ? styles.badgeRed : styles.badgeYellow]}>
                <Text style={[styles.badgeText, item.priority === 'High' ? styles.badgeRedText : styles.badgeYellowText]}>
                  {item.priority} Priority
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topbar: { backgroundColor: colors.bg2, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingVertical: 12, paddingTop: 48, flexDirection: 'row', alignItems: 'center' },
  topbarCenter: { flex: 1, marginHorizontal: 16 },
  topbarTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  topbarBreadcrumb: { fontSize: 11, color: colors.text3, marginTop: 2 },
  content: { flex: 1, padding: 16 },
  announcementCard: { backgroundColor: colors.bg3, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  pinnedCard: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  pinIcon: { fontSize: 16, marginBottom: 6 },
  announcementTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
  announcementMeta: { fontSize: 12, color: colors.text3, marginBottom: 8 },
  announcementBody: { fontSize: 14, color: colors.text2, lineHeight: 20, marginBottom: 12 },
  badgeContainer: { flexDirection: 'row', gap: 6 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeRed: { backgroundColor: 'rgba(244,63,94,0.12)' },
  badgeRedText: { color: colors.red },
  badgeYellow: { backgroundColor: 'rgba(234,179,8,0.12)' },
  badgeYellowText: { color: colors.yellow },
});
