import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

type TabType = 'Targets' | 'Accomplishments' | 'Rating Summary';

export default function IPCRDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ipcr, setIpcr] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Targets');

  const ipcrId = params.id;

  useEffect(() => {
    if (ipcrId) {
      loadIPCRDetail();
    }
  }, [ipcrId]);

  const loadIPCRDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/ipcrs/${ipcrId}`);
      setIpcr(response.data);
    } catch (error) {
      console.error('Failed to load IPCR detail:', error);
      Alert.alert('Error', 'Failed to load IPCR details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIPCRDetail();
    setRefreshing(false);
  };

  const tabs: TabType[] = ['Targets', 'Accomplishments', 'Rating Summary'];

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
              <Text style={styles.topbarTitleText}>IPCR Detail</Text>
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

  if (!ipcr) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ padding: 10 }}
            >
              <SvgIcon name="arrowBack" size={24} color={colors.text} style={{}} />
            </TouchableOpacity>
            <View style={styles.topbarTitle}>
              <Text style={styles.topbarTitleText}>IPCR Detail</Text>
              <Text style={styles.topbarBreadcrumb}>Not Found</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <SvgIcon name="document" size={64} color={colors.text3} style={{}} />
          <Text style={styles.emptyText}>IPCR not found</Text>
        </View>
      </View>
    );
  }

  const renderTargetsTab = () => (
    <View>
      {ipcr.majorFunctions?.map((mf: any) => (
        <View key={mf.id} style={styles.card}>
          <Text style={styles.cardTitle}>{mf.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{mf.category} ({(mf.weight * 100)}%)</Text>
          </View>
          
          {mf.targets?.map((target: any, index: number) => (
            <View key={target.id} style={styles.targetCard}>
              <Text style={styles.targetLabel}>Target {index + 1}</Text>
              
              <View style={styles.targetSection}>
                <Text style={styles.targetSectionLabel}>Description:</Text>
                <Text style={styles.targetSectionText}>{target.description}</Text>
              </View>

              <View style={styles.targetSection}>
                <Text style={styles.targetSectionLabel}>Measures:</Text>
                <Text style={styles.targetSectionText}>{target.measures}</Text>
              </View>

              {target.status && (
                <View style={[styles.statusBadge, styles[`badge${target.status}`]]}>
                  <Text style={styles.statusText}>{target.status}</Text>
                </View>
              )}

              {target.ratings && (
                <View style={styles.ratingsSection}>
                  <Text style={styles.ratingsLabel}>Ratings:</Text>
                  <View style={styles.ratingsRow}>
                    {target.ratings.q && <Text style={styles.ratingItem}>Q: {target.ratings.q}</Text>}
                    {target.ratings.e && <Text style={styles.ratingItem}>E: {target.ratings.e}</Text>}
                    {target.ratings.t && <Text style={styles.ratingItem}>T: {target.ratings.t}</Text>}
                    {target.ratings.avg && (
                      <Text style={styles.ratingAvg}>Avg: {target.ratings.avg.toFixed(2)}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  const renderAccomplishmentsTab = () => (
    <View>
      {ipcr.majorFunctions?.map((mf: any) => (
        <View key={mf.id} style={styles.card}>
          <Text style={styles.cardTitle}>{mf.title}</Text>
          
          {mf.targets?.map((target: any, index: number) => (
            <View key={target.id} style={styles.targetCard}>
              <Text style={styles.targetLabel}>Target {index + 1}</Text>
              <Text style={styles.targetDescription}>{target.description}</Text>
              
              {target.accomplishment ? (
                <View style={styles.accomplishmentSection}>
                  <Text style={styles.accomplishmentLabel}>Accomplishment:</Text>
                  <Text style={styles.accomplishmentText}>{target.accomplishment}</Text>
                </View>
              ) : (
                <Text style={styles.noDataText}>No accomplishment recorded</Text>
              )}

              {target.documents && target.documents.length > 0 && (
                <View style={styles.documentsSection}>
                  <Text style={styles.documentsLabel}>Documents ({target.documents.length}):</Text>
                  {target.documents.map((doc: string, idx: number) => (
                    <View key={idx} style={styles.documentItem}>
                      <SvgIcon name="document" size={16} color={colors.accent} style={{}} />
                      <Text style={styles.documentName}>{doc}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  const renderRatingSummaryTab = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Rating Summary</Text>
      
      {ipcr.ratingSummary ? (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Strategic Functions (45%):</Text>
            <Text style={styles.summaryValue}>{ipcr.ratingSummary.strategicWeighted?.toFixed(2) || 'N/A'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Core Functions (45%):</Text>
            <Text style={styles.summaryValue}>{ipcr.ratingSummary.coreWeighted?.toFixed(2) || 'N/A'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Support Functions (10%):</Text>
            <Text style={styles.summaryValue}>{ipcr.ratingSummary.supportWeighted?.toFixed(2) || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.finalRatingCard}>
            <Text style={styles.finalRatingLabel}>Final Average Rating</Text>
            <Text style={styles.finalRatingValue}>{ipcr.finalRating?.toFixed(3) || 'N/A'}</Text>
            {ipcr.adjectivalRating && (
              <Text style={styles.adjectivalRating}>{ipcr.adjectivalRating}</Text>
            )}
          </View>
        </>
      ) : (
        <Text style={styles.noDataText}>Rating summary not available</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ padding: 10 }}
          >
            <SvgIcon name="arrowBack" size={24} color={colors.text} style={{}} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>IPCR Detail</Text>
            <Text style={styles.topbarBreadcrumb}>
              {ipcr.facultyName} • {ipcr.period}
            </Text>
          </View>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, styles[`badge${ipcr.status}`]]}>
              <Text style={styles.statusText}>{ipcr.status || 'DRAFT'}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Phase</Text>
            <Text style={styles.infoValue}>{ipcr.currentPhase || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
      >
        {activeTab === 'Targets' && renderTargetsTab()}
        {activeTab === 'Accomplishments' && renderAccomplishmentsTab()}
        {activeTab === 'Rating Summary' && renderRatingSummaryTab()}
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
  infoCard: {
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 24,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
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
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text2,
    textTransform: 'uppercase',
  },
  targetCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  targetSection: {
    marginBottom: 12,
  },
  targetSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
  },
  targetSectionText: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
  },
  targetDescription: {
    fontSize: 13,
    color: colors.text2,
    marginBottom: 12,
    lineHeight: 18,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  badgeDRAFT: { backgroundColor: 'rgba(156,163,175,0.12)' },
  badgeSUBMITTED: { backgroundColor: 'rgba(59,130,246,0.12)' },
  badgeAPPROVED: { backgroundColor: 'rgba(34,197,94,0.12)' },
  badgeRATED: { backgroundColor: 'rgba(168,85,247,0.12)' },
  badgeFINAL: { backgroundColor: 'rgba(34,197,94,0.12)' },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  ratingsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 8,
  },
  ratingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ratingItem: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
  },
  ratingAvg: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  accomplishmentSection: {
    marginTop: 12,
  },
  accomplishmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 6,
  },
  accomplishmentText: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
  },
  documentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  documentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  documentName: {
    fontSize: 13,
    color: colors.text2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  finalRatingCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.bg3,
    borderRadius: 8,
  },
  finalRatingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  finalRatingValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.accent,
  },
  adjectivalRating: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text2,
    marginTop: 8,
  },
  noDataText: {
    fontSize: 13,
    color: colors.text3,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text2,
    textAlign: 'center',
    marginTop: 16,
  },
});
