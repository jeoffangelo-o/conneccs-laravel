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

export default function DocumentsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const requirements = [
    { name: 'Annual Report', category: 'Institutional', dueDate: 'Dec 31, 2025', status: 'Submitted' },
    { name: 'Research Output Report', category: 'Research', dueDate: 'Dec 15, 2025', status: 'Pending' },
    { name: 'Extension Services Report', category: 'Extension', dueDate: 'Dec 20, 2025', status: 'Pending' },
    { name: 'Faculty Development Report', category: 'Personnel', dueDate: 'Jan 15, 2026', status: 'Not Started' },
    { name: 'Financial Report', category: 'Finance', dueDate: 'Jan 31, 2026', status: 'Not Started' },
    { name: 'Accreditation Documents', category: 'Quality Assurance', dueDate: 'Feb 28, 2026', status: 'In Progress' },
  ];

  const categories = [
    { name: 'Institutional', count: 1, color: colors.yellow },
    { name: 'Research', count: 1, color: colors.teal },
    { name: 'Extension', count: 1, color: colors.green },
    { name: 'Personnel', count: 1, color: colors.accent2 },
    { name: 'Finance', count: 1, color: colors.orange },
    { name: 'Quality Assurance', count: 1, color: colors.red },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <SvgIcon name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Reportorial Requirements</Text>
          <Text style={styles.topbarBreadcrumb}>Philippine HEIS Standards</Text>
        </View>
        <TouchableOpacity>
          <SvgIcon name="bell" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reportorial Requirements</Text>
          <Text style={styles.headerSubtitle}>Philippine Higher Education Information System (HEIS)</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat, index) => (
              <TouchableOpacity key={index} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}20` }]}>
                  <Text style={{ fontSize: 24 }}>📋</Text>
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCount}>{cat.count} item</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>All Requirements</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>View Timeline</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>REQUIREMENT</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>CATEGORY</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>DUE DATE</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>STATUS</Text>
            </View>
            {requirements.map((req, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{req.name}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{req.category}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{req.dueDate}</Text>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={[styles.statusBadge, req.status === 'Submitted' ? styles.statusGreen : req.status === 'Pending' ? styles.statusYellow : req.status === 'In Progress' ? styles.statusBlue : styles.statusGray]}>
                    <Text style={styles.statusText}>{req.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>HEIS Submission Guidelines</Text>
          <View style={styles.guidelineItem}>
            <SvgIcon name="checkCircle" size={18} color={colors.green} />
            <Text style={styles.guidelineText}>Submit all reports through the official HEIS portal</Text>
          </View>
          <View style={styles.guidelineItem}>
            <SvgIcon name="checkCircle" size={18} color={colors.green} />
            <Text style={styles.guidelineText}>Ensure data accuracy and completeness before submission</Text>
          </View>
          <View style={styles.guidelineItem}>
            <SvgIcon name="checkCircle" size={18} color={colors.green} />
            <Text style={styles.guidelineText}>Meet all deadline requirements set by CHED</Text>
          </View>
          <View style={styles.guidelineItem}>
            <SvgIcon name="checkCircle" size={18} color={colors.green} />
            <Text style={styles.guidelineText}>Maintain records for audit and verification purposes</Text>
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
  headerSubtitle: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 4,
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
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  folderCard: {
    backgroundColor: colors.bg3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
  },
  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  folderName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  folderFiles: {
    fontSize: 12,
    color: colors.text3,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  fileDetails: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: colors.bg3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 11,
    color: colors.text3,
  },
  table: {
    marginTop: 12,
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
  statusBlue: {
    backgroundColor: 'rgba(79,124,255,0.2)',
  },
  statusGray: {
    backgroundColor: 'rgba(122,112,96,0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
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
