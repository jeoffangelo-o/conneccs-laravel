import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useReportorial } from '../../context/ReportorialContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import { getTimelinessStatus } from '../../utils/timeliness';
import { clearReportorialCache, debugReportorialData } from '../../utils/clearReportorialCache';

export default function ReportorialRequirementsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { requirements, submissions, getSubmissionsForRequirement, rateSubmission } = useReportorial();
  const styles = createStyles(colors);
  const [activeTab, setActiveTab] = useState<'requirements' | 'other'>('requirements');
  
  // Rating modal state
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [qualityRating, setQualityRating] = useState('');
  const [timelinessRating, setTimelinessRating] = useState('');
  const [remarks, setRemarks] = useState('');

  console.log('=== REPORTORIAL DEBUG ===');
  console.log('Total requirements:', requirements.length);
  console.log('User:', user?.name, 'Role:', user?.role);
  console.log('Requirements:', requirements.map(r => ({ id: r.id, name: r.requirement, category: r.category, staff: r.staff })));

  // Map secretary names to staff codes
  const getSecretaryStaffCode = (userName: string): string | null => {
    if (userName.includes('Jo Ann') || userName.includes('Baeta')) return 'JO';
    if (userName.includes('Stephanie') || userName.includes('Otares')) return 'STEPH';
    if (userName.includes('Reychille') || userName.includes('Tañamor')) return 'CHEN';
    if (userName.includes('Vianne') || userName.includes('Gastilo')) return 'VIANNE';
    return null;
  };

  // Get the staff code for the current user
  const userStaffCode = user ? getSecretaryStaffCode(user.name) : null;

  console.log('User staff code:', userStaffCode);

  // Filter requirements based on secretary assignment
  const filterRequirementsBySecretary = (reqs: any[]) => {
    // Show all requirements for now (remove filtering)
    return reqs;
    
    // Original filtering code (commented out):
    // if (!user || user.role !== 'SECRETARY' || !userStaffCode) {
    //   return reqs;
    // }
    // return reqs.filter(req => req.staff === userStaffCode);
  };

  const filteredRequirements = filterRequirementsBySecretary(
    requirements.filter(req => req.category === 'REPORTORIAL')
  );
  const filteredOtherDocuments = filterRequirementsBySecretary(
    requirements.filter(req => req.category === 'OTHER_DOCUMENTS')
  );

  console.log('Filtered REPORTORIAL requirements:', filteredRequirements.length);
  console.log('Filtered REPORTORIAL items:', filteredRequirements.map(r => r.requirement));
  console.log('Filtered OTHER_DOCUMENTS:', filteredOtherDocuments.length);
  console.log('Filtered OTHER_DOCUMENTS items:', filteredOtherDocuments.map(r => r.requirement));
  console.log('Active tab:', activeTab);

  // Debug function to clear cache
  const handleClearCache = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Clear reportorial cache and reload data?');
      if (confirmed) {
        await clearReportorialCache();
        window.alert('Cache cleared! Please refresh the page (Ctrl+Shift+R)');
      }
    } else {
      Alert.alert(
        'Clear Cache',
        'Clear reportorial cache and reload data?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            onPress: async () => {
              await clearReportorialCache();
              Alert.alert('Success', 'Cache cleared! Please restart the app.');
            },
          },
        ]
      );
    }
  };

  const handleDebugData = async () => {
    await debugReportorialData();
    if (Platform.OS === 'web') {
      window.alert('Check console for debug data');
    } else {
      Alert.alert('Debug', 'Check console for debug data');
    }
  };

  const renderRequirementCard = (req: any) => {
    const requirementSubmissions = getSubmissionsForRequirement(req.id);
    const submission = requirementSubmissions.find(s => s.facultyId === user?.id);
    const status = getTimelinessStatus(req.deadline, submission?.submittedAt);
    
    return (
      <TouchableOpacity 
        key={req.id} 
        style={styles.card}
        onPress={() => {
          // Navigate to folder view to see all submissions
          navigation.navigate('ReportorialFolder', { 
            requirementId: req.id,
          });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardNumber}>
            <Text style={styles.cardNumberText}>{req.no}</Text>
          </View>
          <View style={styles.cardStaff}>
            <Text style={styles.cardStaffText}>{req.staff}</Text>
          </View>
        </View>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {submission ? '✅ Submitted' : status.status === 'overdue' ? `⚠️ Overdue (${status.daysUntil} days)` : status.status === 'no-deadline' ? '📋 No Deadline' : `⏰ Pending (${status.daysUntil} days left)`}
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
            <Text style={styles.cardValue}>{req.copies}</Text>
          </View>
          <View style={styles.cardColumn}>
            <Text style={styles.cardLabel}>Size:</Text>
            <Text style={styles.cardValue}>{req.fileSize}</Text>
          </View>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.cardLabel}>Deadline:</Text>
          <Text style={[styles.cardValue, styles.deadlineText]}>{req.deadline || 'TBA'}</Text>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.cardLabel}>Remarks:</Text>
          <Text style={styles.cardValue}>{req.remarks}</Text>
        </View>
        
        {submission && (
          <View style={styles.submissionInfo}>
            <Text style={styles.submissionLabel}>
              Your submission: {new Date(submission.submittedAt).toLocaleDateString()}
            </Text>
            <View style={styles.ratingDisplayRow}>
              <View style={styles.ratingDisplay}>
                <Text style={styles.ratingDisplayLabel}>Quality:</Text>
                <Text style={styles.ratingDisplayStars}>
                  {submission.qualityRating ? '⭐'.repeat(submission.qualityRating) : '-'}
                </Text>
                <Text style={styles.ratingDisplayValue}>{submission.qualityRating || '-'}/5</Text>
              </View>
              <View style={styles.ratingDisplay}>
                <Text style={styles.ratingDisplayLabel}>Timeliness:</Text>
                <Text style={styles.ratingDisplayStars}>
                  {submission.timelinessRating ? '⭐'.repeat(submission.timelinessRating) : '-'}
                </Text>
                <Text style={styles.ratingDisplayValue}>{submission.timelinessRating || '-'}/5</Text>
              </View>
            </View>
            {submission.qualityRating && submission.timelinessRating && (
              <View style={styles.averageRatingBox}>
                <Text style={styles.averageLabel}>Average Rating:</Text>
                <Text style={styles.averageStars}>
                  {'⭐'.repeat(Math.round((submission.qualityRating + submission.timelinessRating) / 2))}
                </Text>
                <Text style={styles.averageValue}>
                  {((submission.qualityRating + submission.timelinessRating) / 2).toFixed(1)}/5
                </Text>
              </View>
            )}
            {!submission.qualityRating && (
              <TouchableOpacity 
                style={styles.rateButton}
                onPress={() => {
                  setSelectedSubmission(submission);
                  setSelectedRequirement(req);
                  setQualityRating('');
                  setTimelinessRating('');
                  setRemarks('');
                  setRatingModalVisible(true);
                }}
              >
                <Text style={styles.rateButtonText}>Rate This Submission</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={styles.cardFooter}>
          <SvgIcon name="folder" size={16} color={colors.accent} style={{}} />
          <Text style={styles.cardFooterText}>
            Click to open folder
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleSaveRating = () => {
    if (!selectedSubmission || !selectedRequirement) return;

    const q = parseFloat(qualityRating);
    const t = parseFloat(timelinessRating);

    if (isNaN(q) || q < 1 || q > 5) {
      Alert.alert('Invalid Rating', 'Quality rating must be between 1 and 5');
      return;
    }

    if (isNaN(t) || t < 1 || t > 5) {
      Alert.alert('Invalid Rating', 'Timeliness rating must be between 1 and 5');
      return;
    }

    rateSubmission(selectedSubmission.id, q, t, remarks);
    setRatingModalVisible(false);
    
    if (Platform.OS === 'web') {
      window.alert('Rating saved successfully!');
    } else {
      Alert.alert('Success', 'Rating saved successfully!');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>Reportorial Requirements</Text>
            <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal › Reportorial Requirements</Text>
          </View>
        </View>
        
        {/* Debug buttons - TEMPORARY */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleDebugData}
            style={{ padding: 8, backgroundColor: colors.bg3, borderRadius: 6 }}
          >
            <Text style={{ fontSize: 11, color: colors.text3 }}>Debug</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClearCache}
            style={{ padding: 8, backgroundColor: colors.orange, borderRadius: 6 }}
          >
            <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>Clear Cache</Text>
          </TouchableOpacity>
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

      {/* Grid */}
      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {activeTab === 'requirements'
            ? filteredRequirements.map(renderRequirementCard)
            : filteredOtherDocuments.map(renderRequirementCard)}
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg2 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Submission</Text>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                <SvgIcon name="close" size={24} color={colors.text} style={{}} />
              </TouchableOpacity>
            </View>

            {selectedSubmission && selectedRequirement && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>{selectedRequirement.requirement}</Text>
                
                {/* Quality Rating */}
                <View style={styles.inputGroup}>
                  <View style={styles.ratingLabelRow}>
                    <Text style={styles.inputLabel}>Quality Rating (1-5)</Text>
                    {qualityRating && (
                      <View style={styles.ratingIndicator}>
                        <Text style={styles.ratingStars}>
                          {'⭐'.repeat(Math.min(parseInt(qualityRating) || 0, 5))}
                        </Text>
                        <Text style={styles.ratingNumber}>{qualityRating}/5</Text>
                      </View>
                    )}
                  </View>
                  <RNTextInput
                    style={[styles.input, { backgroundColor: colors.bg3, color: colors.text, borderColor: colors.border }]}
                    value={qualityRating}
                    onChangeText={setQualityRating}
                    keyboardType="numeric"
                    placeholder="Enter 1-5"
                    placeholderTextColor={colors.text3}
                  />
                </View>

                {/* Timeliness Rating */}
                <View style={styles.inputGroup}>
                  <View style={styles.ratingLabelRow}>
                    <Text style={styles.inputLabel}>Timeliness Rating (1-5)</Text>
                    {timelinessRating && (
                      <View style={styles.ratingIndicator}>
                        <Text style={styles.ratingStars}>
                          {'⭐'.repeat(Math.min(parseInt(timelinessRating) || 0, 5))}
                        </Text>
                        <Text style={styles.ratingNumber}>{timelinessRating}/5</Text>
                      </View>
                    )}
                  </View>
                  <RNTextInput
                    style={[styles.input, { backgroundColor: colors.bg3, color: colors.text, borderColor: colors.border }]}
                    value={timelinessRating}
                    onChangeText={setTimelinessRating}
                    keyboardType="numeric"
                    placeholder="Enter 1-5"
                    placeholderTextColor={colors.text3}
                  />
                </View>

                {/* Remarks */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Remarks (Optional)</Text>
                  <RNTextInput
                    style={[styles.textArea, { backgroundColor: colors.bg3, color: colors.text, borderColor: colors.border }]}
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter remarks..."
                    placeholderTextColor={colors.text3}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.bg3 }]}
                    onPress={() => setRatingModalVisible(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.accent }]}
                    onPress={handleSaveRating}
                  >
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save Rating</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    justifyContent: 'flex-start',
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
  submissionInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submissionLabel: {
    fontSize: 11,
    color: colors.text3,
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 11,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
  },
  fileButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  fileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  selectedFile: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  rateButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.accent,
    borderRadius: 6,
    alignItems: 'center',
  },
  rateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    gap: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text2,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.accent}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingStars: {
    fontSize: 14,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  ratingDisplayRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  ratingDisplay: {
    flex: 1,
    backgroundColor: `${colors.accent}15`,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  ratingDisplayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
  },
  ratingDisplayStars: {
    fontSize: 16,
    marginBottom: 4,
  },
  ratingDisplayValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  averageRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${colors.green}20`,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: colors.green,
  },
  averageLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.green,
  },
  averageStars: {
    fontSize: 18,
  },
  averageValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.green,
  },
});
