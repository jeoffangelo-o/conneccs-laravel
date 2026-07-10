import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
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

export default function ReportorialFolderScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [folder, setFolder] = useState<any>(null);

  const folderId = params.id;

  useEffect(() => {
    if (folderId) {
      loadFolderData();
    }
  }, [folderId]);

  const loadFolderData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/reportorial/folders/${folderId}`);
      setFolder(response.data);
    } catch (error) {
      console.error('Failed to load folder:', error);
      // Mock data for development
      setFolder({
        id: folderId,
        requirement: 'Class Observation Reports',
        deadline: 'May 30, 2026',
        template: 'Observation Form 2026',
        copies: 2,
        staff: 'Dr. Smith',
        submittedCount: 12,
        totalCount: 18,
        submissions: [
          { id: 1, facultyName: 'Dr. John Benosa', submittedAt: '2026-05-15', qualityRating: 5, timelinessRating: 5 },
          { id: 2, facultyName: 'Prof. Maria Colle', submittedAt: '2026-05-20', qualityRating: 4, timelinessRating: 4 },
          { id: 3, facultyName: 'Prof. Mark Omorog', submittedAt: '2026-05-25', qualityRating: 5, timelinessRating: 3 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFolderData();
    setRefreshing(false);
  };

  const handleUploadSubmission = () => {
    Alert.alert('Upload', 'File upload functionality will be implemented');
  };

  const handleSendReminder = () => {
    const pendingCount = folder.totalCount - folder.submittedCount;
    Alert.alert(
      'Send Reminder',
      `Send reminder to ${pendingCount} faculty members who haven't submitted?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => Alert.alert('Success', 'Reminders sent!') },
      ]
    );
  };

  const handleGenerateReport = () => {
    Alert.alert('Generate Report', 'Report generation functionality will be implemented');
  };

  if (loading) {
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
              <Text style={styles.topbarTitleText}>Reportorial Folder</Text>
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

  if (!folder) {
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
              <Text style={styles.topbarTitleText}>Reportorial Folder</Text>
              <Text style={styles.topbarBreadcrumb}>Not Found</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <SvgIcon name="folder" size={64} color={colors.text3} style={{}} />
          <Text style={styles.emptyText}>Folder not found</Text>
        </View>
      </View>
    );
  }

  const submissionRate = Math.round((folder.submittedCount / folder.totalCount) * 100);
  const pendingCount = folder.totalCount - folder.submittedCount;
  const isSecretary = user?.role === 'SECRETARY';

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
            <Text style={styles.topbarTitleText}>{folder.requirement}</Text>
            <Text style={styles.topbarBreadcrumb}>Reportorial Folder</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Submission Summary</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{submissionRate}% Complete</Text>
            </View>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{folder.submittedCount}</Text>
              <Text style={styles.statLabel}>Submitted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.orange }]}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{folder.totalCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${submissionRate}%` }]} />
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Requirement Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Template:</Text>
            <Text style={styles.detailValue}>{folder.template}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Copies:</Text>
            <Text style={styles.detailValue}>{folder.copies}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deadline:</Text>
            <Text style={[styles.detailValue, { color: colors.orange, fontWeight: '600' }]}>
              {folder.deadline}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned to:</Text>
            <Text style={styles.detailValue}>{folder.staff}</Text>
          </View>
        </View>

        {/* Actions (Secretary Only) */}
        {isSecretary && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Actions</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSendReminder}>
              <SvgIcon name="bell" size={18} color="#fff" style={{}} />
              <Text style={styles.actionButtonText}>Send Reminder ({pendingCount})</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleGenerateReport}>
              <SvgIcon name="document" size={18} color="#fff" style={{}} />
              <Text style={styles.actionButtonText}>Generate Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Faculty View - Upload Section */}
        {!isSecretary && (
          <View style={styles.uploadCard}>
            <Text style={styles.cardTitle}>My Submission</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadSubmission}>
              <SvgIcon name="upload" size={18} color="#fff" style={{}} />
              <Text style={styles.uploadButtonText}>Upload Submission</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submissions List */}
        <View style={styles.submissionsCard}>
          <Text style={styles.cardTitle}>Faculty Submissions ({folder.submittedCount}/{folder.totalCount})</Text>
          
          {folder.submissions.map((submission: any) => (
            <View key={submission.id} style={styles.submissionCard}>
              <View style={styles.submissionHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{submission.facultyName.charAt(0)}</Text>
                </View>
                <View style={styles.submissionInfo}>
                  <Text style={styles.facultyName}>{submission.facultyName}</Text>
                  <Text style={styles.submissionDate}>
                    Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              {submission.qualityRating && (
                <View style={styles.ratingSection}>
                  <View style={styles.ratingItem}>
                    <Text style={styles.ratingLabel}>Quality:</Text>
                    <Text style={styles.ratingValue}>{submission.qualityRating}/5</Text>
                  </View>
                  <View style={styles.ratingItem}>
                    <Text style={styles.ratingLabel}>Timeliness:</Text>
                    <Text style={styles.ratingValue}>{submission.timelinessRating}/5</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
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
  summaryCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    backgroundColor: `${colors.accent}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  summaryStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.bg3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  detailsCard: {
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
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text3,
    width: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  actionsCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  uploadCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  submissionsCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submissionCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  submissionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  facultyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  submissionDate: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
  ratingSection: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingItem: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text2,
    textAlign: 'center',
    marginTop: 16,
  },
});
