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

type TabType = 'compliance' | 'rating' | 'returned';

export default function ReviewQueueScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('compliance');
  const [complianceData, setComplianceData] = useState<any[]>([]);
  const [ratingQueue, setRatingQueue] = useState<any[]>([]);
  const [returnedTargets, setReturnedTargets] = useState<any[]>([]);

  useEffect(() => {
    loadReviewQueue();
  }, []);

  const loadReviewQueue = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/review-queue');
      setComplianceData(response.data.compliance || []);
      setRatingQueue(response.data.rating || []);
      setReturnedTargets(response.data.returned || []);
    } catch (error) {
      console.error('Failed to load review queue:', error);
      setComplianceData([]);
      setRatingQueue([]);
      setReturnedTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviewQueue();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'FINAL':
      case 'COMPLETED':
        return colors.green;
      case 'IN_PROGRESS':
      case 'SUBMITTED':
        return colors.yellow;
      case 'DELINQUENT':
      case 'OVERDUE':
        return colors.red;
      default:
        return colors.text3;
    }
  };

  const handleSendReminder = async (facultyId: string, facultyName: string) => {
    try {
      await apiService.post('/review-queue/reminder', { facultyId });
      alert(`Reminder sent to ${facultyName}`);
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Failed to send reminder');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text2 }]}>Loading review queue...</Text>
      </View>
    );
  }

  const tabs = [
    { key: 'compliance' as TabType, label: 'Compliance', count: complianceData.length },
    { key: 'rating' as TabType, label: 'Rating Queue', count: ratingQueue.length },
    { key: 'returned' as TabType, label: 'Returned', count: returnedTargets.length },
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
            <Text style={styles.topbarTitleText}>Review Queue</Text>
            <Text style={styles.topbarBreadcrumb}>Secretary Review Interface</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Faculty Compliance Dashboard</Text>
            
            {complianceData.length === 0 ? (
              <View style={styles.emptyState}>
                <SvgIcon name="checkCircle" size={48} color={colors.text3} />
                <Text style={styles.emptyText}>No compliance data</Text>
              </View>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>FACULTY NAME</Text>
                  <Text style={styles.tableHeaderCell}>TOTAL</Text>
                  <Text style={styles.tableHeaderCell}>SUBMITTED</Text>
                  <Text style={styles.tableHeaderCell}>PENDING</Text>
                  <Text style={styles.tableHeaderCell}>STATUS</Text>
                  <Text style={styles.tableHeaderCell}>ACTION</Text>
                </View>
                {complianceData.map((item) => (
                  <View key={item.facultyId} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.facultyName}</Text>
                    <Text style={styles.tableCell}>{item.totalTargets}</Text>
                    <Text style={[styles.tableCell, { color: colors.green, fontWeight: '600' }]}>
                      {item.submitted}
                    </Text>
                    <Text style={[styles.tableCell, { color: item.pending > 0 ? colors.yellow : colors.text3 }]}>
                      {item.pending}
                    </Text>
                    <View style={styles.tableCell}>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.tableCell, { flexDirection: 'row', gap: 8 }]}>
                      <TouchableOpacity
                        style={styles.reminderButton}
                        onPress={() => handleSendReminder(item.facultyId, item.facultyName)}
                      >
                        <SvgIcon name="bell" size={14} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Rating Queue Tab */}
        {activeTab === 'rating' && (
          <View style={styles.tabContent}>
            {ratingQueue.length === 0 ? (
              <View style={styles.emptyState}>
                <SvgIcon name="checkCircle" size={48} color={colors.text3} />
                <Text style={styles.emptyText}>No targets awaiting rating</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Faculty Awaiting Rating</Text>
                {ratingQueue.map((faculty) => (
                  <View key={faculty.facultyId} style={styles.facultyRatingCard}>
                    <View style={styles.facultyRatingHeader}>
                      <View style={styles.facultyRatingLeft}>
                        <View style={styles.facultyAvatar}>
                          <Text style={styles.facultyAvatarText}>
                            {faculty.facultyName?.[0] || '?'}
                          </Text>
                        </View>
                        <View style={styles.facultyRatingInfo}>
                          <Text style={styles.facultyRatingName}>{faculty.facultyName}</Text>
                          <Text style={styles.facultyRatingPeriod}>{faculty.period}</Text>
                        </View>
                      </View>
                      <SvgIcon name="arrowForward" size={20} color={colors.text3} />
                    </View>

                    <View style={styles.facultyRatingStats}>
                      <View style={styles.facultyRatingStat}>
                        <Text style={styles.facultyRatingStatValue}>{faculty.targetsCount}</Text>
                        <Text style={styles.facultyRatingStatLabel}>Targets to Rate</Text>
                      </View>
                      <View style={styles.facultyRatingDivider} />
                      <View style={styles.facultyRatingStat}>
                        <Text style={styles.facultyRatingStatValue}>{faculty.withDocuments}</Text>
                        <Text style={styles.facultyRatingStatLabel}>With Documents</Text>
                      </View>
                      <View style={styles.facultyRatingDivider} />
                      <View style={styles.facultyRatingStat}>
                        <Text style={[styles.facultyRatingStatValue, { color: colors.yellow }]}>
                          {faculty.lateSubmissions}
                        </Text>
                        <Text style={styles.facultyRatingStatLabel}>Late Submissions</Text>
                      </View>
                    </View>

                    <View style={styles.facultyRatingAction}>
                      <SvgIcon name="star" size={16} color={colors.accent} />
                      <Text style={styles.facultyRatingActionText}>Click to review and rate targets</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Returned Tab */}
        {activeTab === 'returned' && (
          <View style={styles.tabContent}>
            {returnedTargets.length === 0 ? (
              <View style={styles.emptyState}>
                <SvgIcon name="checkCircle" size={48} color={colors.text3} />
                <Text style={styles.emptyText}>No returned targets</Text>
              </View>
            ) : (
              returnedTargets.map((item) => (
                <View key={item.id} style={styles.targetCard}>
                  <View style={styles.targetHeader}>
                    <Text style={styles.facultyName}>{item.facultyName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${colors.red}20` }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.red }]}>RETURNED</Text>
                    </View>
                  </View>
                  <Text style={styles.targetDescription}>{item.description}</Text>
                  {item.incompleteNote && (
                    <View style={styles.noteSection}>
                      <Text style={styles.noteLabel}>Incomplete Reason:</Text>
                      <Text style={styles.noteText}>{item.incompleteNote}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text3,
  },
  tabTextActive: {
    color: colors.accent,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text3,
    marginTop: 16,
  },
  table: {
    backgroundColor: colors.bg2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.bg3,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reminderButton: {
    padding: 8,
    backgroundColor: colors.bg3,
    borderRadius: 4,
  },
  facultyRatingCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  facultyRatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  facultyRatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  facultyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facultyAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  facultyRatingInfo: {
    flex: 1,
  },
  facultyRatingName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  facultyRatingPeriod: {
    fontSize: 12,
    color: colors.text3,
  },
  facultyRatingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  facultyRatingStat: {
    flex: 1,
    alignItems: 'center',
  },
  facultyRatingStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 4,
  },
  facultyRatingStatLabel: {
    fontSize: 11,
    color: colors.text3,
    textAlign: 'center',
  },
  facultyRatingDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  facultyRatingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  facultyRatingActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  targetCard: {
    backgroundColor: colors.bg2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  targetDescription: {
    fontSize: 14,
    color: colors.text2,
    marginBottom: 12,
  },
  noteSection: {
    backgroundColor: colors.bg3,
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  noteText: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
  },
});
