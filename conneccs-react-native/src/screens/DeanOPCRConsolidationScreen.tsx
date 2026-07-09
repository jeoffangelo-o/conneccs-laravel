import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { ScrollView } from 'tamagui';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import { getAdjectivalRating } from '../../utils/calculations';
import { getTotalFacultyCount } from '../../utils/businessRules';
import usersData from '../../assets/data/users.json';

export default function DeanOPCRConsolidationScreen({ navigation }) {
  const { user } = useAuth();
  const { ipcrs, opcr } = useData();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [consolidated, setConsolidated] = useState(false);

  if (!user || user.role !== 'DEAN') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Dean role required.</Text>
      </View>
    );
  }

  const approvedIPCRs = ipcrs.filter(
    ipcr =>
      ipcr.overallStatus === 'APPROVED' ||
      ipcr.overallStatus === 'FINAL' ||
      (ipcr.finalRating !== null && ipcr.finalRating > 0)
  );

  // Use actual faculty count from users, not just IPCRs count
  const totalFaculty = getTotalFacultyCount(usersData as any[]);
  const approvedCount = approvedIPCRs.length;
  const pendingCount = totalFaculty - approvedCount;
  
  const averageRating =
    approvedIPCRs.length > 0
      ? approvedIPCRs.reduce((sum, ipcr) => sum + (ipcr.finalRating || 0), 0) / approvedIPCRs.length
      : 0;

  const collegeAdjectival = getAdjectivalRating(averageRating);

  const ratingDistribution = {
    outstanding: approvedIPCRs.filter(i => (i.finalRating || 0) >= 4.5).length,
    verySatisfactory: approvedIPCRs.filter(i => (i.finalRating || 0) >= 3.5 && (i.finalRating || 0) < 4.5).length,
    satisfactory: approvedIPCRs.filter(i => (i.finalRating || 0) >= 2.5 && (i.finalRating || 0) < 3.5).length,
    unsatisfactory: approvedIPCRs.filter(i => (i.finalRating || 0) >= 1.5 && (i.finalRating || 0) < 2.5).length,
    poor: approvedIPCRs.filter(i => (i.finalRating || 0) < 1.5).length,
  };

  const handleSubmitCertification = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Submit OPCR Certification\n\nThis will submit the consolidated OPCR report to IPDU. Continue?');
      if (confirmed) {
        setConsolidated(true);
        window.alert('OPCR certification submitted to IPDU');
      }
    } else {
      Alert.alert(
        'Submit OPCR Certification',
        'This will submit the consolidated OPCR report to IPDU. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: () => {
              setConsolidated(true);
              Alert.alert('Success', 'OPCR certification submitted to IPDU');
            },
          },
        ]
      );
    }
  };

  const handleExportReport = () => {
    if (Platform.OS === 'web') {
      window.alert('Export functionality will be implemented');
    } else {
      Alert.alert('Export Report', 'Export functionality will be implemented');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Main')}
            style={{ padding: 10 }}
          >
            <SvgIcon name="arrowBack" size={24} color={colors.text} style={{}} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>OPCR Consolidation</Text>
            <Text style={styles.topbarBreadcrumb}>College of Computer Studies - {opcr.year}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        flex={1}
        backgroundColor={colors.bg}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <SvgIcon name="people" size={32} color={colors.blue} style={{}} />
            <Text style={styles.summaryValue}>{totalFaculty}</Text>
            <Text style={styles.summaryLabel}>Total Faculty</Text>
          </View>

          <View style={styles.summaryCard}>
            <SvgIcon name="checkCircle" size={32} color={colors.green} style={{}} />
            <Text style={styles.summaryValue}>{approvedCount}</Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>

          <View style={styles.summaryCard}>
            <SvgIcon name="clock" size={32} color={colors.orange} style={{}} />
            <Text style={styles.summaryValue}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>

          <View style={styles.summaryCard}>
            <SvgIcon name="star" size={32} color={colors.purple} style={{}} />
            <Text style={styles.summaryValue}>{averageRating.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>College Avg</Text>
          </View>
        </View>

        {/* College Rating */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overall College Rating</Text>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingValue}>{averageRating.toFixed(3)}</Text>
            <Text style={styles.ratingAdjectival}>{collegeAdjectival}</Text>
          </View>
        </View>

        {/* Rating Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rating Distribution</Text>
          <View style={styles.distributionList}>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(ratingDistribution.outstanding / (approvedCount || 1)) * 100}%`, backgroundColor: '#10b981' }]} />
              <Text style={styles.distributionLabel}>Outstanding: {ratingDistribution.outstanding}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(ratingDistribution.verySatisfactory / (approvedCount || 1)) * 100}%`, backgroundColor: '#3b82f6' }]} />
              <Text style={styles.distributionLabel}>Very Satisfactory: {ratingDistribution.verySatisfactory}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(ratingDistribution.satisfactory / (approvedCount || 1)) * 100}%`, backgroundColor: '#f59e0b' }]} />
              <Text style={styles.distributionLabel}>Satisfactory: {ratingDistribution.satisfactory}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(ratingDistribution.unsatisfactory / (approvedCount || 1)) * 100}%`, backgroundColor: '#ef4444' }]} />
              <Text style={styles.distributionLabel}>Unsatisfactory: {ratingDistribution.unsatisfactory}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(ratingDistribution.poor / (approvedCount || 1)) * 100}%`, backgroundColor: '#991b1b' }]} />
              <Text style={styles.distributionLabel}>Poor: {ratingDistribution.poor}</Text>
            </View>
          </View>
        </View>

        {/* Faculty List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Faculty Ratings</Text>
          {approvedIPCRs.map(ipcr => (
            <View key={ipcr.id} style={styles.facultyCard}>
              <View style={styles.facultyInfo}>
                <Text style={styles.facultyName}>{ipcr.facultyName}</Text>
                <Text style={styles.facultyPeriod}>{ipcr.period}</Text>
              </View>
              <View style={styles.facultyRating}>
                <Text style={styles.facultyRatingValue}>{ipcr.finalRating?.toFixed(2)}</Text>
                <Text style={styles.facultyRatingAdjectival}>{ipcr.adjectivalRating}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!consolidated ? (
            <>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
                <SvgIcon name="download" size={20} color={colors.blue} style={{}} />
                <Text style={styles.exportButtonText}>Export Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, pendingCount > 0 && styles.submitButtonDisabled]}
                onPress={handleSubmitCertification}
                disabled={pendingCount > 0}
              >
                <SvgIcon name="send" size={20} color="#fff" style={{}} />
                <Text style={styles.submitButtonText}>Submit Certification to IPDU</Text>
              </TouchableOpacity>

              {pendingCount > 0 && (
                <Text style={styles.warningText}>⚠️ {pendingCount} IPCR(s) still pending approval</Text>
              )}
            </>
          ) : (
            <View style={styles.consolidatedBanner}>
              <SvgIcon name="checkCircle" size={32} color={colors.green} style={{}} />
              <Text style={styles.consolidatedText}>OPCR Consolidated and Submitted to IPDU</Text>
              <Text style={styles.consolidatedDate}>{new Date().toLocaleDateString()}</Text>
            </View>
          )}
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text3,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  ratingBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.bg3,
    borderRadius: 8,
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.accent,
  },
  ratingAdjectival: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text2,
    marginTop: 8,
  },
  distributionList: {
    gap: 12,
  },
  distributionItem: {
    position: 'relative',
  },
  distributionBar: {
    height: 32,
    borderRadius: 4,
    marginBottom: 4,
  },
  distributionLabel: {
    fontSize: 14,
    color: colors.text2,
    marginLeft: 8,
  },
  facultyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.bg3,
    borderRadius: 6,
    marginBottom: 8,
  },
  facultyInfo: {
    flex: 1,
  },
  facultyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  facultyPeriod: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
  facultyRating: {
    alignItems: 'flex-end',
  },
  facultyRatingValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  facultyRatingAdjectival: {
    fontSize: 11,
    color: colors.text3,
  },
  actionSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.blue,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    backgroundColor: colors.accent,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 14,
    color: colors.orange,
    textAlign: 'center',
    marginTop: 8,
  },
  consolidatedBanner: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: `${colors.green}20`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.green,
  },
  consolidatedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.green,
    marginTop: 12,
    textAlign: 'center',
  },
  consolidatedDate: {
    fontSize: 14,
    color: colors.text3,
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: colors.red,
    textAlign: 'center',
    marginTop: 40,
  },
});
