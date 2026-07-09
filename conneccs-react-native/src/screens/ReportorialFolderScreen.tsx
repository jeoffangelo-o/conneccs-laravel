import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import { WebScrollView } from '../components/WebScrollView';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useReportorial } from '../../context/ReportorialContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import * as DocumentPicker from 'expo-document-picker';
import usersData from '../../assets/data/users.json';
import { getFacultyUsers } from '../../utils/businessRules';

export default function ReportorialFolderScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    requirements,
    submissions,
    uploadTemplate,
    getSubmissionsForRequirement,
    getFacultySubmission,
    rateSubmission,
    sendBulkReminder,
    generateSubmittedReport,
    generateNotSubmittedReport,
    generateSummaryReport,
    submitRequirement,
  } = useReportorial();
  
  // Log version to verify new code is loaded
  console.log('🔄 ReportorialFolderScreen loaded - Version 2.0 (Fixed)');
  
  // Safety check for colors
  if (!colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const requirementId = route.params?.requirementId;
  const requirement = requirements.find(req => req.id === requirementId);
  
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [qualityRating, setQualityRating] = useState('');
  const [timelinessRating, setTimelinessRating] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Document preview state
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  
  // Upload modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadType, setUploadType] = useState<'faculty' | 'template' | null>(null);

  const isSecretary = user?.role === 'SECRETARY';
  const isFaculty = user?.role === 'FACULTY';

  if (!requirement) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Requirement not found</Text>
      </View>
    );
  }

  const requirementSubmissions = getSubmissionsForRequirement(requirementId);
  const allFaculty = getFacultyUsers(usersData as any[]);
  
  const submittedCount = requirementSubmissions.length;
  const totalCount = allFaculty.length;
  const notSubmittedCount = totalCount - submittedCount;
  const submissionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

  // Handle faculty submission upload
  const handleFacultyUpload = async () => {
    setUploadType('faculty');
    setUploadModalVisible(true);
  };

  // Perform faculty upload after confirmation
  const performFacultyUpload = async () => {
    if (!user) return;

    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.xls,.xlsx';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const mockUrl = `https://example.com/submissions/${user.id}/${file.name}`;
          const submission = {
            id: `sub-${Date.now()}`,
            requirementId,
            facultyId: user.id,
            facultyName: user.name,
            submittedAt: new Date().toISOString(),
            fileUrl: mockUrl,
            fileName: file.name,
            status: 'SUBMITTED' as const,
          };
          submitRequirement(submission);
          setUploadModalVisible(false);
          Alert.alert('Success', `File uploaded: ${file.name}`);
        }
      };
      input.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          const mockUrl = `https://example.com/submissions/${user.id}/${file.name}`;
          const submission = {
            id: `sub-${Date.now()}`,
            requirementId,
            facultyId: user.id,
            facultyName: user.name,
            submittedAt: new Date().toISOString(),
            fileUrl: mockUrl,
            fileName: file.name,
            status: 'SUBMITTED' as const,
          };
          submitRequirement(submission);
          setUploadModalVisible(false);
          Alert.alert('Success', `File uploaded: ${file.name}`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to upload file');
      }
    }
  };

  // Handle template upload (Secretary only)
  const handleUploadTemplate = async () => {
    setUploadType('template');
    setUploadModalVisible(true);
  };

  // Perform template upload after confirmation
  const performTemplateUpload = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.xls,.xlsx';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const mockUrl = `https://example.com/templates/${file.name}`;
          uploadTemplate(requirementId, mockUrl);
          setUploadModalVisible(false);
          Alert.alert('Success', `Template uploaded: ${file.name}`);
        }
      };
      input.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          const mockUrl = `https://example.com/templates/${file.name}`;
          uploadTemplate(requirementId, mockUrl);
          setUploadModalVisible(false);
          Alert.alert('Success', `Template uploaded: ${file.name}`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to upload template');
      }
    }
  };

  // Handle send reminder to all non-submitters
  const handleSendReminder = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Send reminder to ${notSubmittedCount} faculty members who haven't submitted?`
      );
      if (confirmed) {
        sendBulkReminder(requirementId);
        window.alert('Reminders sent successfully!');
      }
    } else {
      Alert.alert(
        'Send Reminder',
        `Send reminder to ${notSubmittedCount} faculty members who haven't submitted?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: () => {
              sendBulkReminder(requirementId);
              Alert.alert('Success', 'Reminders sent successfully!');
            },
          },
        ]
      );
    }
  };

  // Handle generate report
  const handleGenerateReport = (type: 'SUBMITTED' | 'NOT_SUBMITTED' | 'SUMMARY') => {
    let report;
    if (type === 'SUBMITTED') {
      report = generateSubmittedReport(requirementId);
    } else if (type === 'NOT_SUBMITTED') {
      report = generateNotSubmittedReport(requirementId);
    } else {
      report = generateSummaryReport(requirementId);
    }

    // In production, this would export to PDF/Excel
    const message = `Report generated:\n\n${report.facultyList.map(f => 
      `${f.facultyName}: ${f.status}${f.submittedAt ? ` (${new Date(f.submittedAt).toLocaleDateString()})` : ''}`
    ).join('\n')}`;

    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Report Generated', message);
    }
  };

  // Handle rate submission (for secretary rating faculty submissions)
  const handleRateSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setQualityRating(submission.qualityRating?.toString() || '');
    
    // Calculate automatic timeliness rating based on deadline
    let autoTimelinessRating = 5; // Default to 5 (on time)
    if (requirement.deadline && submission.submittedAt) {
      const deadlineDate = new Date(requirement.deadline);
      const submittedDate = new Date(submission.submittedAt);
      
      // If deadline is a string like "May 2026", try to parse it
      if (isNaN(deadlineDate.getTime())) {
        // For unparseable dates, default to 5
        autoTimelinessRating = 5;
      } else if (submittedDate > deadlineDate) {
        // Late submission
        const daysLate = Math.floor((submittedDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLate > 30) autoTimelinessRating = 1;
        else if (daysLate > 14) autoTimelinessRating = 2;
        else if (daysLate > 7) autoTimelinessRating = 3;
        else autoTimelinessRating = 4;
      }
    }
    
    setTimelinessRating(autoTimelinessRating.toString());
    setRemarks(submission.remarks || '');
    setRatingModalVisible(true);
  };

  const handleSaveRating = () => {
    if (!selectedSubmission) return;

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <SvgIcon name="arrowLeft" size={24} color={colors.text} style={{}} />
        </TouchableOpacity>
        <View style={styles.topbarTitle}>
          <Text style={styles.topbarTitleText}>{requirement.requirement}</Text>
          <Text style={styles.topbarBreadcrumb}>Requirement #{requirement.no}</Text>
        </View>
      </View>

      <WebScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Faculty View - Simple folder view */}
        {isFaculty && (
          <>
            {/* Requirement Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Requirement Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Template:</Text>
                <Text style={styles.detailValue}>{requirement.template || 'N/A'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Copies:</Text>
                <Text style={styles.detailValue}>{requirement.copies}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Deadline:</Text>
                <Text style={[styles.detailValue, { color: colors.orange, fontWeight: '600' }]}>
                  {requirement.deadline || 'TBA'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remarks:</Text>
                <Text style={styles.detailValue}>{requirement.remarks}</Text>
              </View>
            </View>

            {/* Template File */}
            <View style={styles.templateCard}>
              <Text style={styles.sectionTitle}>Template File</Text>
              {requirement.templateFileUrl ? (
                <View style={styles.templateInfo}>
                  <SvgIcon name="fileText" size={24} color={colors.accent} style={{}} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.templateName}>Template Available</Text>
                    <Text style={styles.templateUrl}>{requirement.templateFileUrl}</Text>
                  </View>
                  <TouchableOpacity>
                    <Text style={styles.replaceButton}>Download</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.templateUrl}>No template file available</Text>
              )}
            </View>

            {/* My Submission */}
            <View style={styles.submissionsCard}>
              <Text style={styles.sectionTitle}>My Submission</Text>
              
              {getFacultySubmission(requirementId, user?.id) ? (
                <View style={styles.submissionBox}>
                  <View style={styles.submissionHeader}>
                    <SvgIcon name="checkCircle" size={20} color={colors.green} style={{}} />
                    <Text style={[styles.submissionStatus, { color: colors.green }]}>Submitted</Text>
                  </View>
                  <Text style={styles.submissionDate}>
                    {new Date(getFacultySubmission(requirementId, user?.id)?.submittedAt || '').toLocaleDateString()}
                  </Text>
                  
                  {/* File Preview */}
                  {getFacultySubmission(requirementId, user?.id)?.fileName && (
                    <View style={styles.filePreviewBox}>
                      <SvgIcon name="fileText" size={20} color={colors.accent} style={{}} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.fileName}>{getFacultySubmission(requirementId, user?.id)?.fileName}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.previewButton}
                        onPress={() => {
                          setPreviewDocument(getFacultySubmission(requirementId, user?.id));
                          setPreviewModalVisible(true);
                        }}
                      >
                        <Text style={styles.previewButtonText}>Preview</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Rating Display or Rate Button */}
                  {getFacultySubmission(requirementId, user?.id)?.qualityRating && getFacultySubmission(requirementId, user?.id)?.timelinessRating ? (
                    <View>
                      <View style={styles.ratingDisplayRow}>
                        <View style={styles.ratingDisplayBox}>
                          <Text style={styles.ratingDisplayLabel}>Quality:</Text>
                          <Text style={styles.ratingDisplayStars}>
                            {'⭐'.repeat(getFacultySubmission(requirementId, user?.id)?.qualityRating || 0)}
                          </Text>
                          <Text style={styles.ratingDisplayValue}>
                            {getFacultySubmission(requirementId, user?.id)?.qualityRating}/5
                          </Text>
                        </View>
                        <View style={styles.ratingDisplayBox}>
                          <Text style={styles.ratingDisplayLabel}>Timeliness:</Text>
                          <Text style={styles.ratingDisplayStars}>
                            {'⭐'.repeat(getFacultySubmission(requirementId, user?.id)?.timelinessRating || 0)}
                          </Text>
                          <Text style={styles.ratingDisplayValue}>
                            {getFacultySubmission(requirementId, user?.id)?.timelinessRating}/5
                          </Text>
                        </View>
                      </View>
                      {/* Average Rating */}
                      <View style={styles.averageRatingBox}>
                        <Text style={styles.averageLabel}>Average Rating:</Text>
                        <Text style={styles.averageStars}>
                          {'⭐'.repeat(Math.round(((getFacultySubmission(requirementId, user?.id)?.qualityRating || 0) + (getFacultySubmission(requirementId, user?.id)?.timelinessRating || 0)) / 2))}
                        </Text>
                        <Text style={styles.averageValue}>
                          {(((getFacultySubmission(requirementId, user?.id)?.qualityRating || 0) + (getFacultySubmission(requirementId, user?.id)?.timelinessRating || 0)) / 2).toFixed(1)}/5
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.selfRateButton}
                      onPress={() => {
                        setSelectedSubmission(getFacultySubmission(requirementId, user?.id));
                        setQualityRating('');
                        setTimelinessRating('');
                        setRemarks('');
                        setRatingModalVisible(true);
                      }}
                    >
                      <SvgIcon name="star" size={18} color="#fff" style={{}} />
                      <Text style={styles.selfRateButtonText}>Rate My Submission</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.submissionBox}>
                  <View style={styles.submissionHeader}>
                    <SvgIcon name="alertCircle" size={20} color={colors.orange} style={{}} />
                    <Text style={[styles.submissionStatus, { color: colors.orange }]}>Not Submitted</Text>
                  </View>
                  <TouchableOpacity style={styles.uploadButton} onPress={handleFacultyUpload}>
                    <SvgIcon name="upload" size={18} color="#fff" style={{}} />
                    <Text style={styles.uploadButtonText}>Upload Submission</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* Secretary View - Full dashboard */}
        {isSecretary && (
          <>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Submission Summary</Text>
            <View style={[styles.badge, { backgroundColor: `${colors.accent}20` }]}>
              <Text style={[styles.badgeText, { color: colors.accent }]}>
                {submissionRate}% Complete
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{submittedCount}</Text>
              <Text style={styles.statLabel}>Submitted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.orange }]}>{notSubmittedCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCount}</Text>
              <Text style={styles.statLabel}>Total Faculty</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${submissionRate}%`, backgroundColor: colors.accent }]} />
          </View>
        </View>

        {/* Requirement Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Requirement Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Template:</Text>
            <Text style={styles.detailValue}>{requirement.template || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Copies:</Text>
            <Text style={styles.detailValue}>{requirement.copies}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deadline:</Text>
            <Text style={[styles.detailValue, { color: colors.orange, fontWeight: '600' }]}>
              {requirement.deadline || 'TBA'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned to:</Text>
            <Text style={styles.detailValue}>{requirement.staff}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Remarks:</Text>
            <Text style={styles.detailValue}>{requirement.remarks}</Text>
          </View>
        </View>

        {/* Template Section (Secretary only) */}
        {isSecretary && (
          <View style={styles.templateCard}>
            <Text style={styles.sectionTitle}>Template File</Text>
            
            {requirement.templateFileUrl ? (
              <View style={styles.templateInfo}>
                <SvgIcon name="fileText" size={24} color={colors.accent} style={{}} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.templateName}>Template uploaded</Text>
                  <Text style={styles.templateUrl}>{requirement.templateFileUrl}</Text>
                </View>
                <TouchableOpacity onPress={handleUploadTemplate}>
                  <Text style={styles.replaceButton}>Replace</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={handleUploadTemplate}>
                <SvgIcon name="upload" size={20} color="#fff" style={{}} />
                <Text style={styles.uploadButtonText}>Upload Template</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Secretary Actions */}
        {isSecretary && (
          <View style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={handleSendReminder}
                disabled={notSubmittedCount === 0}
              >
                <SvgIcon name="bell" size={18} color="#fff" style={{}} />
                <Text style={styles.actionButtonText}>
                  Send Reminder ({notSubmittedCount})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.teal }]}
                onPress={() => handleGenerateReport('SUMMARY')}
              >
                <SvgIcon name="fileText" size={18} color="#fff" style={{}} />
                <Text style={styles.actionButtonText}>Generate Report</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.green, flex: 1 }]}
                onPress={() => handleGenerateReport('SUBMITTED')}
              >
                <Text style={styles.actionButtonText}>Submitted List</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.orange, flex: 1 }]}
                onPress={() => handleGenerateReport('NOT_SUBMITTED')}
              >
                <Text style={styles.actionButtonText}>Pending List</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

          {/* Submissions List */}
          <View style={styles.submissionsCard}>
            <Text style={styles.sectionTitle}>Faculty Submissions</Text>
            
            {allFaculty.map((faculty: any) => {
            const submission = getFacultySubmission(requirementId, faculty.id);
            const hasSubmitted = !!submission;
            
            return (
              <View key={faculty.id} style={styles.facultyRow}>
                <View style={styles.facultyInfo}>
                  <View style={[
                    styles.facultyAvatar,
                    { backgroundColor: hasSubmitted ? colors.green : colors.text3 }
                  ]}>
                    <Text style={styles.facultyInitial}>
                      {faculty.firstName?.[0] || faculty.name[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.facultyName}>{faculty.name}</Text>
                    {hasSubmitted && submission ? (
                      <Text style={styles.submissionDate}>
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </Text>
                    ) : (
                      <Text style={[styles.submissionDate, { color: colors.orange }]}>
                        Not submitted
                      </Text>
                    )}
                  </View>
                </View>
                
                {hasSubmitted && submission && (
                  <View style={styles.submissionActions}>
                    {submission.qualityRating && submission.timelinessRating ? (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>
                          Q: {submission.qualityRating} | T: {submission.timelinessRating}
                        </Text>
                      </View>
                    ) : isSecretary ? (
                      <TouchableOpacity
                        style={styles.rateButton}
                        onPress={() => handleRateSubmission(submission)}
                      >
                        <Text style={styles.rateButtonText}>Rate</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        </>
        )}
        {/* End Secretary View */}
      </WebScrollView>

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

            {selectedSubmission && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>{selectedSubmission.facultyName}</Text>
                
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

                {/* Timeliness Rating - Automatic */}
                <View style={styles.inputGroup}>
                  <View style={styles.ratingLabelRow}>
                    <Text style={styles.inputLabel}>Timeliness Rating (1-5) - Automatic</Text>
                    {timelinessRating && (
                      <View style={styles.ratingIndicator}>
                        <Text style={styles.ratingStars}>
                          {'⭐'.repeat(Math.min(parseInt(timelinessRating) || 0, 5))}
                        </Text>
                        <Text style={styles.ratingNumber}>{timelinessRating}/5</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.input, { backgroundColor: colors.bg3, borderColor: colors.border, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>
                      {timelinessRating}/5 (Auto-calculated based on deadline)
                    </Text>
                  </View>
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

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg2 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {uploadType === 'faculty' ? 'Upload Submission' : 'Upload Template'}
              </Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <SvgIcon name="close" size={24} color={colors.text} style={{}} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {uploadType === 'faculty' 
                  ? 'Select a file to submit for this requirement'
                  : 'Select a template file for this requirement'}
              </Text>

              <View style={styles.uploadInfo}>
                <SvgIcon name="info" size={20} color={colors.accent} style={{}} />
                <Text style={styles.uploadInfoText}>
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.bg3 }]}
                  onPress={() => setUploadModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    if (uploadType === 'faculty') {
                      performFacultyUpload();
                    } else {
                      performTemplateUpload();
                    }
                  }}
                >
                  <SvgIcon name="upload" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Choose File</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.previewModalContent, { backgroundColor: colors.bg2 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Document Preview</Text>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <SvgIcon name="close" size={24} color={colors.text} style={{}} />
              </TouchableOpacity>
            </View>

            {previewDocument && (
              <View style={styles.previewBody}>
                <View style={styles.previewFileInfo}>
                  <SvgIcon name="fileText" size={32} color={colors.accent} style={{}} />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.previewFileName}>{previewDocument.fileName}</Text>
                    <Text style={styles.previewFileSize}>
                      Submitted: {new Date(previewDocument.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.previewActions}>
                  <TouchableOpacity 
                    style={[styles.previewActionButton, { backgroundColor: colors.accent }]}
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        window.open(previewDocument.fileUrl, '_blank');
                      } else {
                        Alert.alert('Open Document', `Opening: ${previewDocument.fileName}`);
                      }
                    }}
                  >
                    <SvgIcon name="download" size={18} color="#fff" style={{}} />
                    <Text style={styles.previewActionText}>Open/Download</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.previewActionButton, { backgroundColor: colors.bg3 }]}
                    onPress={() => setPreviewModalVisible(false)}
                  >
                    <Text style={[styles.previewActionText, { color: colors.text }]}>Close</Text>
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

function createStyles(colors: any) {
  return StyleSheet.create({
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
    alignItems: 'center',
    gap: 16,
    paddingTop: 48,
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
    padding: 12,
  },
  summaryCard: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.bg3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailsCard: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    width: 90,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: colors.text2,
  },
  templateCard: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  templateUrl: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 4,
  },
  replaceButton: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionsCard: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  submissionsCard: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  facultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  facultyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  facultyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  facultyInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  facultyName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  submissionDate: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  submissionActions: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingBadge: {
    backgroundColor: `${colors.green}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.green,
  },
  rateButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rateButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  submissionBox: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  submissionStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  submissionDate: {
    fontSize: 12,
    color: colors.text3,
    marginBottom: 12,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text2,
  },
  ratingValue: {
    fontSize: 12,
    color: colors.text,
  },
  errorText: {
    fontSize: 16,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 100,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
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
    textAlignVertical: 'top',
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
  filePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  previewButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  previewModalContent: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 12,
    padding: 24,
  },
  previewBody: {
    gap: 20,
  },
  previewFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  previewFileSize: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 4,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  previewActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  uploadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.accent}20`,
    borderRadius: 8,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  uploadInfoText: {
    flex: 1,
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  // Self-rating styles
  ratingDisplayRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  ratingDisplayBox: {
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
  selfRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  selfRateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
});
}
