import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgIcon } from '../components/SvgIcon';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function ReportsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const reports = [
    { id: 1, name: 'Dr. Maria Santos', type: 'Accomplishment Report', date: 'Apr 10, 2025', status: 'Submitted' },
    { id: 2, name: 'Prof. Juan Dela Cruz', type: 'Extension Output', date: 'Apr 8, 2025', status: 'Pending' },
    { id: 3, name: 'Dr. Ana Reyes', type: 'Research Output', date: 'Apr 5, 2025', status: 'Submitted' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <SvgIcon name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Reports</Text>
          <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal › Reports</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ReportForm')}>
          <SvgIcon name="plus" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{report.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportName}>{report.name}</Text>
                <Text style={styles.reportType}>{report.type}</Text>
                <Text style={styles.reportDate}>{report.date}</Text>
              </View>
              <View style={[styles.badge, report.status === 'Submitted' ? styles.badgeGreen : styles.badgeYellow]}>
                <Text style={[styles.badgeText, report.status === 'Submitted' ? styles.badgeGreenText : styles.badgeYellowText]}>
                  {report.status}
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
  reportCard: { backgroundColor: colors.bg2, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  reportHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  reportInfo: { flex: 1 },
  reportName: { fontSize: 14, fontWeight: '600', color: colors.text },
  reportType: { fontSize: 12, color: colors.text2, marginTop: 2 },
  reportDate: { fontSize: 11, color: colors.text3, marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.12)' },
  badgeGreenText: { color: colors.green },
  badgeYellow: { backgroundColor: 'rgba(234,179,8,0.12)' },
  badgeYellowText: { color: colors.yellow },
});
