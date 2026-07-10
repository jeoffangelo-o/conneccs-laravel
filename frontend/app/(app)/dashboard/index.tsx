import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';

export default function DashboardScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const stats = [
    { label: 'TOTAL REPORTS', value: '42', icon: 'document', color: colors.yellow, subtext: 'Across all faculty' },
    { label: 'SUBMITTED', value: '35', icon: 'checkCircle', color: colors.green, subtext: 'On time' },
    { label: 'OVERDUE', value: '3', icon: 'alertCircle', color: colors.red, subtext: 'Requires follow-up' },
    { label: 'IPCR PENDING', value: '4', icon: 'barChart', color: colors.yellow, subtext: 'Awaiting review' },
    { label: 'ACTIVE FACULTY', value: '5', icon: 'users', color: colors.teal, subtext: 'Currently on-duty' },
  ];

  const recentReports = [
    { faculty: 'Dr. Maria Santos', type: 'Accomplishment Report', period: 'Q1 2025', date: 'Apr 15, 2025', status: 'Submitted' },
    { faculty: 'Prof. Juan Dela Cruz', type: 'Extension Output', period: 'Q1 2025', date: 'Apr 15, 2025', status: 'Pending' },
    { faculty: 'Dr. Ana Reyes', type: 'Research Output', period: 'Q1 2025', date: 'Apr 10, 2025', status: 'Overdue' },
  ];

  const ipcrs = [
    { faculty: 'Dr. Maria Santos', period: '1st Sem 2025', score: '4.86', rating: 'Outstanding', status: 'Approved' },
    { faculty: 'Prof. Juan Dela Cruz', period: '1st Sem 2025', score: '4.59', rating: 'Very Satisfactory', status: 'For Review' },
  ];

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
            <Text style={styles.topbarTitleText}>Dashboard</Text>
            <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal • Dashboard</Text>
          </View>
        </View>
        <View style={styles.topbarRight}>
          <TouchableOpacity style={styles.btnYellow} onPress={() => router.push('/reportorial-requirements')}>
            <Text style={styles.btnYellowText}>+ New Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topbarIconBtn} onPress={() => router.push('/notifications')}>
            <SvgIcon name="bell" size={22} color={colors.text2} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>4</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <SvgIcon name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statSubtext}>{stat.subtext}</Text>
            </View>
          ))}
        </View>

        {/* Recent Report Activity */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>● Recent Report Activity</Text>
            <TouchableOpacity onPress={() => router.push('/reportorial-requirements')}>
              <Text style={styles.linkText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>FACULTY</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>REPORT TYPE</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>PERIOD</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>DUE DATE</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>STATUS</Text>
            </View>
            {recentReports.map((report, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{report.faculty}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{report.type}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{report.period}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{report.date}</Text>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={[styles.statusBadge, report.status === 'Submitted' ? styles.statusGreen : report.status === 'Pending' ? styles.statusYellow : styles.statusRed]}>
                    <Text style={styles.statusText}>{report.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* IPCR Summary */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>● IPCR Summary</Text>
            <TouchableOpacity onPress={() => router.push('/my-ipcr')}>
              <Text style={styles.linkText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>FACULTY</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>PERIOD</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>FINAL SCORE</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>RATING</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>STATUS</Text>
            </View>
            {ipcrs.map((ipcr, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{ipcr.faculty}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{ipcr.period}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontWeight: '700' }]}>{ipcr.score}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, color: colors.green }]}>{ipcr.rating}</Text>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={[styles.statusBadge, styles.statusGreen]}>
                    <Text style={styles.statusText}>{ipcr.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnYellow: {
    backgroundColor: colors.yellow,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnYellowText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  topbarIconBtn: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.red,
    borderRadius: 99,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flex: 1,
    minWidth: 160,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: colors.text3,
  },
  panel: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  linkText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
  table: {
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 13,
    color: colors.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGreen: {
    backgroundColor: 'rgba(143,181,105,0.2)',
  },
  statusYellow: {
    backgroundColor: 'rgba(244,208,63,0.2)',
  },
  statusRed: {
    backgroundColor: 'rgba(217,113,113,0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
});
