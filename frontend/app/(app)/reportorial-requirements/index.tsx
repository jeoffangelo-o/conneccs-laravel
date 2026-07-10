import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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

export default function ReportorialRequirementsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'requirements' | 'other'>('requirements');

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/reportorial');
      setRequirements(response.data || []);
    } catch (error) {
      console.error('Failed to load requirements:', error);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequirements();
    setRefreshing(false);
  };

  const getTimelinessStatus = (deadline: string, submittedAt?: string) => {
    if (!deadline) return { status: 'no-deadline', color: colors.text3, daysUntil: 0 };
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (submittedAt) {
      return { status: 'submitted', color: colors.green, daysUntil: 0 };
    }

    if (diffDays < 0) {
      return { status: 'overdue', color: colors.red, daysUntil: Math.abs(diffDays) };
    }

    return { status: 'pending', color: colors.yellow, daysUntil: diffDays };
  };

  const filteredRequirements = requirements.filter(req =>
    activeTab === 'requirements' ? req.category === 'REPORTORIAL' : req.category === 'OTHER_DOCUMENTS'
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text2 }]}>Loading requirements...</Text>
      </View>
    );
  }

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
            <Text style={styles.topbarTitleText}>Reportorial Requirements</Text>
            <Text style={styles.topbarBreadcrumb}>Faculty Portal • Reportorial Requirements</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requirements' && styles.tabActive]}
          onPress={() => setActiveTab('requirements')}
        >
          <Text style={[styles.tabText, activeTab === 'requirements' && styles.tabTextActive]}>
            Reportorial Requirements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'other' && styles.tabActive]}
          onPress={() => setActiveTab('other')}
        >
          <Text style={[styles.tabText, activeTab === 'other' && styles.tabTextActive]}>
            Other Documents
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.grid}>
          {filteredRequirements.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <SvgIcon name="folder" size={48} color={colors.text3} />
              <Text style={styles.emptyTitle}>No Requirements</Text>
              <Text style={styles.emptyText}>There are no requirements in this category</Text>
            </View>
          ) : (
            filteredRequirements.map((req) => {
              const status = getTimelinessStatus(req.deadline, req.submittedAt);
              
              return (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardNumber}>
                      <Text style={styles.cardNumberText}>{req.no || '#'}</Text>
                    </View>
                    <View style={styles.cardStaff}>
                      <Text style={styles.cardStaffText}>{req.staff || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {req.submittedAt
                        ? '✅ Submitted'
                        : status.status === 'overdue'
                        ? `⚠️ Overdue (${status.daysUntil} days)`
                        : status.status === 'no-deadline'
                        ? '📋 No Deadline'
                        : `⏰ Pending (${status.daysUntil} days left)`}
                    </Text>
                  </View>

                  <Text style={styles.cardTitle}>{req.requirement}</Text>

                  <View style={styles.cardSection}>
                    <Text style={styles.cardLabel}>Template:</Text>
                    <Text style={styles.cardValue}>{req.template || 'N/A'}</Text>
                  </View>

                  <View style={styles.cardRow}>
                    <View style={styles.cardColumn}>
                      <Text style={styles.cardLabel}>Copies:</Text>
                      <Text style={styles.cardValue}>{req.copies || 'N/A'}</Text>
                    </View>
                    <View style={styles.cardColumn}>
                      <Text style={styles.cardLabel}>Size:</Text>
                      <Text style={styles.cardValue}>{req.fileSize || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardSection}>
                    <Text style={styles.cardLabel}>Deadline:</Text>
                    <Text style={[styles.cardValue, styles.deadlineText]}>{req.deadline || 'TBA'}</Text>
                  </View>

                  <View style={styles.cardSection}>
                    <Text style={styles.cardLabel}>Remarks:</Text>
                    <Text style={styles.cardValue}>{req.remarks || 'N/A'}</Text>
                  </View>

                  {req.submittedAt && (
                    <View style={styles.submissionInfo}>
                      <Text style={styles.submissionLabel}>
                        Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                      </Text>
                      {req.qualityRating && req.timelinessRating && (
                        <View style={styles.ratingDisplay}>
                          <Text style={styles.ratingLabel}>Rating: </Text>
                          <Text style={styles.ratingStars}>
                            {'⭐'.repeat(Math.round((req.qualityRating + req.timelinessRating) / 2))}
                          </Text>
                          <Text style={styles.ratingValue}>
                            {((req.qualityRating + req.timelinessRating) / 2).toFixed(1)}/5
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <SvgIcon name="folder" size={16} color={colors.accent} />
                    <Text style={styles.cardFooterText}>Click to open folder</Text>
                  </View>
                </View>
              );
            })
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text3,
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  emptyStateContainer: {
    width: '100%',
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text3,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    minWidth: 280,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  cardStaff: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: `${colors.accent}20`,
  },
  cardStaffText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardSection: {
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  cardColumn: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
  },
  deadlineText: {
    fontWeight: '600',
    color: colors.orange,
  },
  submissionInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submissionLabel: {
    fontSize: 11,
    color: colors.text3,
    marginBottom: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
  },
  ratingStars: {
    fontSize: 14,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
});
