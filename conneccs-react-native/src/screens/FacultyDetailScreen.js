import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgIcon } from '../components/SvgIcon';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function FacultyDetailScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const faculty = route.params?.faculty || { name: 'Dr. Maria Santos', email: 'm.santos@ccs.edu', teaching: 18, research: 6, extension: 4 };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <SvgIcon name="arrowBack" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Faculty Profile</Text>
          <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal › Faculty › Profile</Text>
        </View>
        <TouchableOpacity>
          <SvgIcon name="moreVertical" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>{faculty.name.split(' ').map(n => n[0]).join('')}</Text>
          </View>
          <Text style={styles.profileName}>{faculty.name}</Text>
          <Text style={styles.profileEmail}>{faculty.email}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeBlue]}>
              <Text style={[styles.badgeText, styles.badgeBlueText]}>Faculty</Text>
            </View>
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={[styles.badgeText, styles.badgeGreenText]}>Active</Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Workload Distribution</Text>
          </View>
          <View style={styles.panelBody}>
            <View style={styles.workloadBar}>
              <View style={[styles.workloadSegment, { flex: faculty.teaching, backgroundColor: colors.accent }]} />
              <View style={[styles.workloadSegment, { flex: faculty.research, backgroundColor: colors.teal }]} />
              <View style={[styles.workloadSegment, { flex: faculty.extension, backgroundColor: colors.accent2 }]} />
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.accent }]}>{faculty.teaching}</Text>
                <Text style={styles.statLabel}>Teaching Units</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.teal }]}>{faculty.research}</Text>
                <Text style={styles.statLabel}>Research Units</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.accent2 }]}>{faculty.extension}</Text>
                <Text style={styles.statLabel}>Extension Units</Text>
              </View>
            </View>
          </View>
        </View>
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
  profileCard: { backgroundColor: colors.bg2, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatarLg: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarLgText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  profileName: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: colors.text3, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeBlue: { backgroundColor: 'rgba(79,124,255,0.12)' },
  badgeBlueText: { color: colors.accent },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.12)' },
  badgeGreenText: { color: colors.green },
  panel: { backgroundColor: colors.bg2, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  panelHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  panelTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  panelBody: { padding: 16 },
  workloadBar: { flexDirection: 'row', height: 12, borderRadius: 99, overflow: 'hidden', marginBottom: 20, gap: 2 },
  workloadSegment: { height: '100%' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: colors.bg3, borderRadius: 8, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  statLabel: { fontSize: 10, color: colors.text3, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },
});
