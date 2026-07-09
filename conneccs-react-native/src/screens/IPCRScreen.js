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

export default function IPCRScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const ipcrs = [
    { faculty: 'Dr. Maria Santos', period: 'Jan-Jun 2025', rating: 4.8, status: 'Completed' },
    { faculty: 'Prof. Juan Dela Cruz', period: 'Jan-Jun 2025', rating: 4.5, status: 'In Progress' },
    { faculty: 'Dr. Ana Reyes', period: 'Jan-Jun 2025', rating: 4.9, status: 'Completed' },
    { faculty: 'Prof. Carlos Mendoza', period: 'Jan-Jun 2025', rating: 4.6, status: 'Completed' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <SvgIcon name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>IPCR Monitoring</Text>
          <Text style={styles.topbarBreadcrumb}>Individual Performance Commitment Review</Text>
        </View>
        <TouchableOpacity>
          <SvgIcon name="notifications-outline" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>IPCR Records</Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('IPCRForm')}
          >
            <SvgIcon name="add" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>New IPCR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          {ipcrs.map((ipcr, index) => (
            <View key={index} style={styles.ipcrItem}>
              <View style={styles.ipcrAvatar}>
                <Text style={styles.ipcrAvatarText}>
                  {ipcr.faculty.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.ipcrInfo}>
                <Text style={styles.ipcrName}>{ipcr.faculty}</Text>
                <Text style={styles.ipcrPeriod}>{ipcr.period}</Text>
                <View style={styles.ratingRow}>
                  <SvgIcon name="star" size={14} color={colors.yellow} />
                  <Text style={styles.ratingText}>{ipcr.rating.toFixed(1)}</Text>
                </View>
              </View>
              <View style={[
                styles.badge,
                ipcr.status === 'Completed' ? styles.badgeGreen : styles.badgeYellow
              ]}>
                <Text style={[
                  styles.badgeText,
                  ipcr.status === 'Completed' ? styles.badgeGreenText : styles.badgeYellowText
                ]}>
                  {ipcr.status}
                </Text>
              </View>
            </View>
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
    padding: 16,
  },
  ipcrItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ipcrAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ipcrAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  ipcrInfo: {
    flex: 1,
  },
  ipcrName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  ipcrPeriod: {
    fontSize: 12,
    color: colors.text2,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeGreen: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  badgeGreenText: {
    color: colors.green,
  },
  badgeYellow: {
    backgroundColor: 'rgba(234,179,8,0.12)',
  },
  badgeYellowText: {
    color: colors.yellow,
  },
});
