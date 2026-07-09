import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgIcon } from '../components/SvgIcon';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function FacultyScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const faculty = [
    { id: 1, name: 'Dr. Maria Santos', email: 'm.santos@ccs.edu', role: 'Faculty', program: 'BSCS', teaching: 18, research: 6, extension: 4 },
    { id: 2, name: 'Prof. Juan Dela Cruz', email: 'j.delacruz@ccs.edu', role: 'Program Chair', program: 'BSIT', teaching: 12, research: 8, extension: 6 },
    { id: 3, name: 'Dr. Ana Reyes', email: 'a.reyes@ccs.edu', role: 'Research Coordinator', program: 'BSCS', teaching: 15, research: 10, extension: 3 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <SvgIcon name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Faculty</Text>
          <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal › Faculty</Text>
        </View>
        <TouchableOpacity>
          <SvgIcon name="search" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {faculty.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.facultyCard}
            onPress={() => navigation.navigate('FacultyDetail', { faculty: member })}
          >
            <View style={styles.facultyHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.facultyInfo}>
                <Text style={styles.facultyName}>{member.name}</Text>
                <Text style={styles.facultyEmail}>{member.email}</Text>
                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, styles.badgeBlue]}>
                    <Text style={[styles.badgeText, styles.badgeBlueText]}>{member.role}</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeGray]}>
                    <Text style={[styles.badgeText, styles.badgeGrayText]}>{member.program}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.workloadBar}>
              <View style={[styles.workloadSegment, { flex: member.teaching, backgroundColor: colors.accent }]} />
              <View style={[styles.workloadSegment, { flex: member.research, backgroundColor: colors.teal }]} />
              <View style={[styles.workloadSegment, { flex: member.extension, backgroundColor: colors.accent2 }]} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.accent }]}>{member.teaching}</Text>
                <Text style={styles.statLabel}>Teaching</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.teal }]}>{member.research}</Text>
                <Text style={styles.statLabel}>Research</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.accent2 }]}>{member.extension}</Text>
                <Text style={styles.statLabel}>Extension</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topbar: { backgroundColor: colors.bg2, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingVertical: 12, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topbarCenter: { flex: 1, marginHorizontal: 16 },
  topbarTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  topbarBreadcrumb: { fontSize: 11, color: colors.text3, marginTop: 2 },
  content: { flex: 1, padding: 16 },
  facultyCard: { backgroundColor: colors.bg2, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  facultyHeader: { flexDirection: 'row', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  facultyInfo: { flex: 1 },
  facultyName: { fontSize: 15, fontWeight: '700', color: colors.text },
  facultyEmail: { fontSize: 12, color: colors.text3, marginTop: 2 },
  badgeContainer: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 99 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeBlue: { backgroundColor: 'rgba(79,124,255,0.12)' },
  badgeBlueText: { color: colors.accent },
  badgeGray: { backgroundColor: 'rgba(255,255,255,0.06)' },
  badgeGrayText: { color: colors.text3 },
  workloadBar: { flexDirection: 'row', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 12, gap: 1 },
  workloadSegment: { height: '100%' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: colors.text3, textTransform: 'uppercase', marginTop: 2 },
});
