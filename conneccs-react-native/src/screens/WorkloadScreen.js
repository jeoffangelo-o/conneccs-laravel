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

export default function WorkloadScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const workloads = [
    {
      faculty: 'Dr. Maria Santos',
      teaching: 18,
      research: 6,
      extension: 3,
      admin: 3,
      total: 30,
    },
    {
      faculty: 'Prof. Juan Dela Cruz',
      teaching: 21,
      research: 3,
      extension: 3,
      admin: 3,
      total: 30,
    },
    {
      faculty: 'Dr. Ana Reyes',
      teaching: 15,
      research: 9,
      extension: 3,
      admin: 3,
      total: 30,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <SvgIcon name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Workload Distribution</Text>
          <Text style={styles.topbarBreadcrumb}>Faculty Teaching & Service Load</Text>
        </View>
        <TouchableOpacity>
          <SvgIcon name="notifications-outline" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workload Summary</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Faculty</Text>
            <Text style={styles.tableHeaderText}>Teaching</Text>
            <Text style={styles.tableHeaderText}>Research</Text>
            <Text style={styles.tableHeaderText}>Extension</Text>
            <Text style={styles.tableHeaderText}>Admin</Text>
            <Text style={styles.tableHeaderText}>Total</Text>
          </View>

          {workloads.map((workload, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>
                {workload.faculty}
              </Text>
              <Text style={styles.tableCell}>{workload.teaching}</Text>
              <Text style={styles.tableCell}>{workload.research}</Text>
              <Text style={styles.tableCell}>{workload.extension}</Text>
              <Text style={styles.tableCell}>{workload.admin}</Text>
              <Text style={[styles.tableCell, { fontWeight: '700', color: colors.accent }]}>
                {workload.total}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Workload Guidelines</Text>
          <View style={styles.guidelineItem}>
            <SvgIcon name="checkmark-circle" size={20} color={colors.green} />
            <Text style={styles.guidelineText}>
              Standard load: 30 units per semester
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <SvgIcon name="checkmark-circle" size={20} color={colors.green} />
            <Text style={styles.guidelineText}>
              Teaching: 15-21 units (50-70%)
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <SvgIcon name="checkmark-circle" size={20} color={colors.green} />
            <Text style={styles.guidelineText}>
              Research: 3-9 units (10-30%)
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <SvgIcon name="checkmark-circle" size={20} color={colors.green} />
            <Text style={styles.guidelineText}>
              Extension: 3 units (10%)
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <SvgIcon name="checkmark-circle" size={20} color={colors.green} />
            <Text style={styles.guidelineText}>
              Administrative: 3 units (10%)
            </Text>
          </View>
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  panel: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text2,
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
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  guidelineText: {
    fontSize: 13,
    color: colors.text2,
    flex: 1,
  },
});
