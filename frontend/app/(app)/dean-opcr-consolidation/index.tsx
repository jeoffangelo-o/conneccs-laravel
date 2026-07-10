import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

type ConsolidationData = {
  year: number;
  totalFaculty: number;
  approvedCount: number;
  pendingCount: number;
  averageRating: number;
  collegeAdjectival: string;
  ratingDistribution: {
    outstanding: number;
    verySatisfactory: number;
    satisfactory: number;
    unsatisfactory: number;
    poor: number;
  };
  facultyRatings: Array<{
    id: string;
    name: string;
    period: string;
    rating: number;
    adjectival: string;
  }>;
  isConsolidated: boolean;
  consolidatedDate?: string;
};

export default function DeanOPCRConsolidationScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ConsolidationData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConsolidationData();
  }, []);

  const loadConsolidationData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/opcr/consolidate');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load consolidation data:', error);
      // Mock data for development
      setData({
        year: 2026,
        totalFaculty: 45,
        approvedCount: 38,
        pendingCount: 7,
        averageRating: 4.12,
        collegeAdjectival: 'Very Satisfactory',
        ratingDistribution: {
          outstanding: 12,
          verySatisfactory: 20,
          satisfactory: 6,
          unsatisfactory: 0,
          poor: 0,
        },
        facultyRatings: [
          { id: '1', name: 'Dr. John Benosa', period: 'Jan-Jun 2026', rating: 4.85, adjectival: 'Outstanding' },
          { id: '2', name: 'Prof. Maria Colle', period: 'Jan-Jun 2026', rating: 4.52, adjectival: 'Outstanding' },
          { id: '3', name: 'Prof. Mark Omorog', period: 'Jan-Jun 2026', rating: 4.38, adjectival: 'Very Satisfactory' },
          { id: '4', name: 'Dr. Ana Pandes', period: 'Jan-Jun 2026', rating: 4.15, adjectival: 'Very Satisfactory' },
          { id: '5', name: 'Prof. Luis Benitez', period: 'Jan-Jun 2026', rating: 3.92, adjectival: 'Very Satisfactory' },
        ],
        isConsolidated: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConsolidationData();
    setRefreshing(false);
  };

  const handleSubmitCertification = () => {
    if (data && data.pendingCount > 0) {
      Alert.alert('Cannot Submit', `${data.pendingCount} IPCR(s) are still pending approval.`);
      return;
    }

    Alert.alert(
      'Submit OPCR Certification',
      'This will submit the consolidated OPCR report to IPDU. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiService.post('/opcr/submit-consolidation', {
                year: data?.year,
              });
              Alert.alert('Success', 'OPCR certification submitted to IPDU');
              await loadConsolidationData();
            } catch (error) {
              console.error('Failed to submit certification:', error);
              Alert.alert('Error', 'Failed to submit certification. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleExportReport = () => {
    Alert.alert('Export Report', 'Export functionality will be implemented');
  };

  if (!user || user.role !== 'DEAN') {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <TouchableOpacity 
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ padding: 10 }}
            >
              <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
            </TouchableOpacity>
            <View style={styles.topbarTitle}>
              <Text style={styles.topbarTitleText}>OPCR Consolidation</Text>
              <Text style={styles.topbarBreadcrumb}>Access Denied</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <SvgIcon name="alert" size={64} color={colors.red} style={{}} />
          <Text style={styles.errorText}>Access denied. Dean role required.</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <TouchableOpacity 
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ padding: 10 }}
            >
              <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
            </TouchableOpacity>
            <View style={styles.topbarTitle}>
              <Text style={styles.topbarTitleText}>OPCR Consolidation</Text>
              <Text style={styles.topbarBreadcrumb}>Loading...</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <TouchableOpacity 
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ padding: 10 }}
            >
              <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
            </TouchableOpacity>
            <View style={styles.topbarTitle}>
              <Text style={styles.topbarTitleText}>OPCR Consolidation</Text>
              <Text style={styles.topbarBreadcrumb}>No Data</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <SvgIcon name="document" size={64} color={colors.text3} style={{}} />
          <Text style={styles.emptyText}>No consolidation data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{ padding: 10 }}
          >
            <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>OPCR Consolidation</Text>
            <Text style={styles.topbarBreadcrumb}>College of Computer Studies - {data.year}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <SvgIcon name="people" size={32} color={colors.blue} style={{}} />
            <Text style={styles.summaryValue}>{data.totalFaculty}</Text>
            <Text style={styles.summaryLabel}>Total Faculty</Text>
          </View>

          <View style={styles.summaryCard}>
            <SvgIcon name="checkCircle" size={32} color={colors.green} style={{}} />
            <Text style={styles.summaryValue}>{data.approvedCount}</Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>

          <View style={styles.summaryCard}>
            <SvgIcon name="clock" size={32} color={colors.orange} style={{}} />
            <Text style={styles.summaryValue}>{data.pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>

          <View style={styles.summaryCard}>
            <SvgIcon name="star" size={32} color={colors.purple} style={{}} />
            <Text style={styles.summaryValue}>{data.averageRating.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>College Avg</Text>
          </View>
        </View>

        {/* College Rating */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overall College Rating</Text>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingValue}>{data.averageRating.toFixed(3)}</Text>
            <Text style={styles.ratingAdjectival}>{data.collegeAdjectival}</Text>
          </View>
        </View>

        {/* Rating Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rating Distribution</Text>
          <View style={styles.distributionList}>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(data.ratingDistribution.outstanding / (data.approvedCount || 1)) * 100}%`, backgroundColor: '#10b981' }]} />
              <Text style={styles.distributionLabel}>Outstanding: {data.ratingDistribution.outstanding}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(data.ratingDistribution.verySatisfactory / (data.approvedCount || 1)) * 100}%`, backgroundColor: '#3b82f6' }]} />
              <Text style={styles.distributionLabel}>Very Satisfactory: {data.ratingDistribution.verySatisfactory}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(data.ratingDistribution.satisfactory / (data.approvedCount || 1)) * 100}%`, backgroundColor: '#f59e0b' }]} />
              <Text style={styles.distributionLabel}>Satisfactory: {data.ratingDistribution.satisfactory}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(data.ratingDistribution.unsatisfactory / (data.approvedCount || 1)) * 100}%`, backgroundColor: '#ef4444' }]} />
              <Text style={styles.distributionLabel}>Unsatisfactory: {data.ratingDistribution.unsatisfactory}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(data.ratingDistribution.poor / (data.approvedCount || 1)) * 100}%`, backgroundColor: '#991b1b' }]} />
              <Text style={styles.distributionLabel}>Poor: {data.ratingDistribution.poor}</Text>
            </View>
          </View>
        </View>

        {/* Faculty List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Faculty Ratings ({data.facultyRatings.length})</Text>
          {data.facultyRatings.map(faculty => (
            <View key={faculty.id} style={styles.facultyCard}>
              <View style={styles.facultyInfo}>
                <Text style={styles.facultyName}>{faculty.name}</Text>
                <Text style={styles.facultyPeriod}>{faculty.period}</Text>
              </View>
              <View style={styles.facultyRating}>
                <Text style={styles.facultyRatingValue}>{faculty.rating.toFixed(2)}</Text>
                <Text style={styles.facultyRatingAdjectival}>{faculty.adjectival}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!data.isConsolidated ? (
            <>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
                <SvgIcon name="download" size={20} color={colors.blue} style={{}} />
                <Text style={styles.exportButtonText}>Export Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, (data.pendingCount > 0 || submitting) && styles.submitButtonDisabled]}
                onPress={handleSubmitCertification}
                disabled={data.pendingCount > 0 || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <SvgIcon name="send" size={20} color="#fff" style={{}} />
                )}
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Submitting...' : 'Submit Certification to IPDU'}
                </Text>
              </TouchableOpacity>

              {data.pendingCount > 0 && (
                <Text style={styles.warningText}>⚠️ {data.pendingCount} IPCR(s) still pending approval</Text>
              )}
            </>
          ) : (
            <View style={styles.consolidatedBanner}>
              <SvgIcon name="checkCircle" size={32} color={colors.green} style={{}} />
              <Text style={styles.consolidatedText}>OPCR Consolidated and Submitted to IPDU</Text>
              <Text style={styles.consolidatedDate}>{data.consolidatedDate || new Date().toLocaleDateString()}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text2,
    textAlign: 'center',
    marginTop: 16,
  },
});
