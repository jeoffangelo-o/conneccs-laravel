import React, { useState, useMemo } from 'react';
import { TouchableOpacity, TextInput, StyleSheet, Modal, Alert, View, Text, Linking, Platform } from 'react-native';
import { ScrollView, YStack, XStack, Text as TamaguiText } from 'tamagui';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import { StatusBadge } from '../../components/StatusBadge';
import { RatingInput } from '../../components/RatingInput';
import { calculateA4, calculateFinalRating } from '../../utils/calculations';
import usersData from '../../assets/data/users.json';
import { User, IPCRTarget } from '../../types';

type TabType = 'Targets' | 'Accomplishments' | 'MOV' | 'Rating Summary';

export default function IPCRDetailScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { 
    ipcrs, 
    updateIPCR,
    deanApproveTarget,
    deanOverrideTarget,
    deanReturnTarget,
    computeIPCRFinalRating,
    secretaryRateTarget,
    secretaryReturnTarget,
  } = useData();
  const styles = createStyles(colors);
  const [activeTab, setActiveTab] = useState<TabType>('Targets');
  const [overrideModalVisible, setOverrideModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{ target: IPCRTarget; ipcrId: string } | null>(null);
  const [overrideInputs, setOverrideInputs] = useState({ q: '', e: '', t: '', remarks: '' });
  const [returnRemarks, setReturnRemarks] = useState('');
  
  // Secretary rating modal state
  const [secretaryRatingModalVisible, setSecretaryRatingModalVisible] = useState(false);
  const [secretaryRatingInputs, setSecretaryRatingInputs] = useState({ q: '', e: '', t: '', note: '' });
  
  // Document preview modal state
  const [documentPreviewVisible, setDocumentPreviewVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  
  const ipcrId = route.params?.id;
  const ipcr = ipcrs.find(i => i.id === ipcrId);
  const users = usersData as User[];
  const faculty = users.find(u => u.id === ipcr?.facultyId);

  const isDean = user?.role === 'DEAN';
  const isSecretary = user?.role === 'SECRETARY';

  if (!ipcr || !faculty) {
    return (
      <YStack f={1} bg="$bg" ai="center" jc="center">
        <TamaguiText color="$text3" fontSize={16}>IPCR not found</TamaguiText>
      </YStack>
    );
  }

  const tabs: TabType[] = ['Targets', 'Accomplishments', 'MOV', 'Rating Summary'];
  
  const isEditable = ipcr.currentPhase === 'MID_YEAR_REVIEW' || ipcr.currentPhase === 'TERMINAL_REVIEW';
  const isTargetSettingPhase = ipcr.currentPhase === 'TARGET_SETTING';

  const ratingCalc = useMemo(() => {
    return calculateFinalRating(ipcr);
  }, [ipcr]);

  // Check if all targets are approved
  const allTargetsApproved = useMemo(() => {
    return ipcr.majorFunctions.every(mf =>
      mf.targets.every(t => t.status === 'APPROVED' || t.status === 'APPROVED_OVERRIDE')
    );
  }, [ipcr]);

  // Check if any targets are rated (awaiting Dean review)
  const hasRatedTargets = useMemo(() => {
    return ipcr.majorFunctions.some(mf =>
      mf.targets.some(t => t.status === 'RATED')
    );
  }, [ipcr]);

  // Check if any targets are submitted (awaiting Secretary rating)
  const hasSubmittedTargets = useMemo(() => {
    return ipcr.majorFunctions.some(mf =>
      mf.targets.some(t => t.status === 'SUBMITTED' || t.status === 'ENDORSED')
    );
  }, [ipcr]);

  // Check if all targets are rated by secretary (ready to submit to Dean)
  const allTargetsRatedBySecretary = useMemo(() => {
    const submittedOrEndorsed = ipcr.majorFunctions.flatMap(mf =>
      mf.targets.filter(t => t.status === 'SUBMITTED' || t.status === 'ENDORSED')
    );
    
    if (submittedOrEndorsed.length === 0) return false;
    
    // Check if all submitted/endorsed targets now have secretary ratings
    return ipcr.majorFunctions.every(mf =>
      mf.targets
        .filter(t => t.status === 'SUBMITTED' || t.status === 'ENDORSED' || t.status === 'RATED')
        .every(t => t.status === 'RATED')
    );
  }, [ipcr]);

  const handleRatingChange = (targetId: string, field: 'q1Rating' | 'e2Rating' | 't3Rating', value: number) => {
    const updatedIPCR = { ...ipcr };
    updatedIPCR.majorFunctions = updatedIPCR.majorFunctions.map(mf => ({
      ...mf,
      targets: mf.targets.map(t => {
        if (t.id === targetId) {
          const updated = { ...t, [field]: value };
          if (updated.q1Rating && updated.e2Rating && updated.t3Rating) {
            updated.a4Rating = calculateA4(updated.q1Rating, updated.e2Rating, updated.t3Rating);
          }
          return updated;
        }
        return t;
      }),
    }));
    updateIPCR(ipcr.id, updatedIPCR);
  };

  // Dean Actions
  const handleApprove = async (target: IPCRTarget) => {
    Alert.alert(
      'Approve Target',
      'This will lock the secretary\'s rating as the official rating. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await deanApproveTarget(ipcr.id, target.id);
              Alert.alert('Success', 'Target approved successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to approve target');
            }
          },
        },
      ]
    );
  };

  const handleOpenOverrideModal = (target: IPCRTarget) => {
    setSelectedTarget({ target, ipcrId: ipcr.id });
    setOverrideInputs({
      q: target.secretaryQ?.toString() || '',
      e: target.secretaryE?.toString() || '',
      t: target.secretaryT?.toString() || '',
      remarks: '',
    });
    setOverrideModalVisible(true);
  };

  const handleSubmitOverride = async () => {
    if (!selectedTarget) return;

    const q = parseFloat(overrideInputs.q);
    const e = parseFloat(overrideInputs.e);
    const t = parseFloat(overrideInputs.t);

    if (isNaN(q) || q < 1 || q > 5 || isNaN(e) || e < 1 || e > 5 || isNaN(t) || t < 1 || t > 5) {
      Alert.alert('Invalid Rating', 'All ratings must be between 1 and 5');
      return;
    }

    if (!overrideInputs.remarks.trim()) {
      Alert.alert('Remarks Required', 'Please provide remarks for the override');
      return;
    }

    try {
      await deanOverrideTarget(selectedTarget.ipcrId, selectedTarget.target.id, q, e, t, overrideInputs.remarks);
      Alert.alert('Success', 'Rating overridden successfully');
      setOverrideModalVisible(false);
      setSelectedTarget(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to override rating');
    }
  };

  const handleOpenReturnModal = (target: IPCRTarget) => {
    setSelectedTarget({ target, ipcrId: ipcr.id });
    setReturnRemarks('');
    setReturnModalVisible(true);
  };

  const handleSubmitReturn = async () => {
    if (!selectedTarget) return;

    if (!returnRemarks.trim()) {
      Alert.alert('Remarks Required', 'Please provide a reason for returning this target');
      return;
    }

    Alert.alert(
      'Return Target',
      'This will return the target to the faculty for revision. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          style: 'destructive',
          onPress: async () => {
            try {
              await deanReturnTarget(selectedTarget.ipcrId, selectedTarget.target.id, returnRemarks);
              Alert.alert('Success', 'Target returned to faculty');
              setReturnModalVisible(false);
              setSelectedTarget(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to return target');
            }
          },
        },
      ]
    );
  };

  const handleApproveAll = async () => {
    const ratedTargets = ipcr.majorFunctions.flatMap(mf =>
      mf.targets.filter(t => t.status === 'RATED')
    );

    if (ratedTargets.length === 0) {
      Alert.alert('No Targets', 'No rated targets to approve');
      return;
    }

    Alert.alert(
      'Approve All Targets',
      `This will approve ${ratedTargets.length} rated target(s) and compute the final IPCR rating. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            try {
              // Approve all rated targets
              for (const target of ratedTargets) {
                await deanApproveTarget(ipcr.id, target.id);
              }
              
              // Compute final rating if all targets are now approved
              const allApproved = ipcr.majorFunctions.every(mf =>
                mf.targets.every(t => t.status === 'APPROVED' || t.status === 'APPROVED_OVERRIDE')
              );
              
              if (allApproved) {
                await computeIPCRFinalRating(ipcr.id);
                Alert.alert('Success', 'All targets approved and final rating computed');
              } else {
                Alert.alert('Success', `${ratedTargets.length} target(s) approved`);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to approve all targets');
            }
          },
        },
      ]
    );
  };

  const handleComputeFinalRating = async () => {
    if (!allTargetsApproved) {
      Alert.alert('Cannot Compute', 'All targets must be approved before computing final rating');
      return;
    }

    Alert.alert(
      'Compute Final Rating',
      'This will compute and lock the final IPCR rating. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Compute',
          onPress: async () => {
            try {
              await computeIPCRFinalRating(ipcr.id);
              Alert.alert('Success', 'Final IPCR rating computed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to compute final rating');
            }
          },
        },
      ]
    );
  };

  // Secretary Actions
  const handleOpenSecretaryRatingModal = (target: IPCRTarget) => {
    setSelectedTarget({ target, ipcrId: ipcr.id });
    setSecretaryRatingInputs({ q: '', e: '', t: '', note: '' });
    setSecretaryRatingModalVisible(true);
  };

  const handleSecretaryApproveTarget = async () => {
    if (!selectedTarget) return;

    const q = parseFloat(secretaryRatingInputs.q);
    const e = parseFloat(secretaryRatingInputs.e);
    const t = parseFloat(secretaryRatingInputs.t);

    // Validate ratings
    if (isNaN(q) || q < 1 || q > 5) {
      if (Platform.OS === 'web') {
        window.alert('Quality rating must be between 1 and 5');
      } else {
        Alert.alert('Invalid Rating', 'Quality rating must be between 1 and 5');
      }
      return;
    }
    if (isNaN(e) || e < 1 || e > 5) {
      if (Platform.OS === 'web') {
        window.alert('Efficiency rating must be between 1 and 5');
      } else {
        Alert.alert('Invalid Rating', 'Efficiency rating must be between 1 and 5');
      }
      return;
    }
    if (isNaN(t) || t < 1 || t > 5) {
      if (Platform.OS === 'web') {
        window.alert('Timeliness rating must be between 1 and 5');
      } else {
        Alert.alert('Invalid Rating', 'Timeliness rating must be between 1 and 5');
      }
      return;
    }

    try {
      await secretaryRateTarget(selectedTarget.ipcrId, selectedTarget.target.id, q, e, t);
      if (Platform.OS === 'web') {
        window.alert('Target approved with secretary rating');
      } else {
        Alert.alert('Success', 'Target approved with secretary rating');
      }
      setSecretaryRatingModalVisible(false);
      setSelectedTarget(null);
      setSecretaryRatingInputs({ q: '', e: '', t: '', note: '' });
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to approve target');
      } else {
        Alert.alert('Error', 'Failed to approve target');
      }
    }
  };

  const handleSecretaryMarkIncomplete = async () => {
    if (!selectedTarget) return;

    if (!secretaryRatingInputs.note.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please provide a reason for marking this incomplete');
      } else {
        Alert.alert('Note Required', 'Please provide a reason for marking this incomplete');
      }
      return;
    }

    const confirmed = Platform.OS === 'web' 
      ? window.confirm('This will return the target to the faculty for revision. Continue?')
      : await new Promise(resolve => {
          Alert.alert(
            'Mark Incomplete',
            'This will return the target to the faculty for revision. Continue?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Mark Incomplete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    try {
      await secretaryReturnTarget(selectedTarget.ipcrId, selectedTarget.target.id, secretaryRatingInputs.note);
      if (Platform.OS === 'web') {
        window.alert('Target marked incomplete and returned to faculty');
      } else {
        Alert.alert('Success', 'Target marked incomplete and returned to faculty');
      }
      setSecretaryRatingModalVisible(false);
      setSelectedTarget(null);
      setSecretaryRatingInputs({ q: '', e: '', t: '', note: '' });
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to mark target incomplete');
      } else {
        Alert.alert('Error', 'Failed to mark target incomplete');
      }
    }
  };

  // Document Preview Handler
  const handlePreviewDocument = (fileUrl: string) => {
    setSelectedDocument(fileUrl);
    setDocumentPreviewVisible(true);
  };

  const handleDownloadDocument = async (fileUrl: string) => {
    try {
      if (Platform.OS === 'web') {
        // For web, open in new tab
        window.open(fileUrl, '_blank');
      } else {
        // For mobile, use Linking
        const supported = await Linking.canOpenURL(fileUrl);
        if (supported) {
          await Linking.openURL(fileUrl);
        } else {
          Alert.alert('Error', 'Cannot open this file type');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'document';
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'document';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      default:
        return 'document';
    }
  };

  // Submit all rated targets to Dean
  const handleSubmitAllToDean = async () => {
    const ratedTargets = ipcr.majorFunctions.flatMap(mf =>
      mf.targets.filter(t => t.status === 'RATED')
    );

    if (ratedTargets.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('No rated targets to submit to Dean');
      } else {
        Alert.alert('No Targets', 'No rated targets to submit to Dean');
      }
      return;
    }

    const confirmed = Platform.OS === 'web'
      ? window.confirm(`This will submit ${ratedTargets.length} rated target(s) to the Dean for final approval. Continue?`)
      : await new Promise(resolve => {
          Alert.alert(
            'Submit to Dean',
            `This will submit ${ratedTargets.length} rated target(s) to the Dean for final approval. Continue?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Submit All', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    try {
      // Update IPCR status to indicate it's ready for Dean review
      const updatedIPCR = {
        ...ipcr,
        overallStatus: 'SUBMITTED' as any,
        secretarySubmittedAt: new Date().toISOString(),
      };
      updateIPCR(ipcr.id, updatedIPCR);
      
      if (Platform.OS === 'web') {
        window.alert(`${ratedTargets.length} target(s) submitted to Dean for approval`);
      } else {
        Alert.alert('Success', `${ratedTargets.length} target(s) submitted to Dean for approval`);
      }
      navigation.goBack();
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to submit targets to Dean');
      } else {
        Alert.alert('Error', 'Failed to submit targets to Dean');
      }
    }
  };

  const renderTargetsTab = () => {
    // Secretary Rating Interface
    if (isSecretary && hasSubmittedTargets) {
      return (
        <YStack>
          {ipcr.majorFunctions.map((mf) => (
            <YStack key={mf.id} style={styles.panel}>
              <TamaguiText style={styles.panelTitle}>{mf.title}</TamaguiText>
              <TamaguiText style={styles.categoryBadge}>{mf.category} ({(mf.weight * 100)}%)</TamaguiText>
              
              {mf.targets
                .filter(t => t.status === 'SUBMITTED' || t.status === 'ENDORSED' || t.status === 'RATED' || t.status === 'INCOMPLETE')
                .map((target, tIndex) => (
                  <YStack key={target.id} style={styles.secretaryTargetCard}>
                    <View style={styles.secretaryTargetHeader}>
                      <Text style={styles.targetLabel}>Target {tIndex + 1}</Text>
                      <View style={styles.statusBadgeContainer}>
                        {target.status === 'RATED' && (
                          <View style={[styles.statusBadge, styles.badgeApproved]}>
                            <SvgIcon name="checkCircle" size={12} color="#10b981" style={{}} />
                            <Text style={[styles.statusBadgeText, { color: '#10b981' }]}>APPROVED</Text>
                          </View>
                        )}
                        {target.status === 'INCOMPLETE' && (
                          <View style={[styles.statusBadge, styles.badgeIncomplete]}>
                            <SvgIcon name="alertCircle" size={12} color="#ef4444" style={{}} />
                            <Text style={[styles.statusBadgeText, { color: '#ef4444' }]}>INCOMPLETE</Text>
                          </View>
                        )}
                        {(target.status === 'SUBMITTED' || target.status === 'ENDORSED') && (
                          <View style={[styles.statusBadge, styles[`badge${target.status}`]]}>
                            <Text style={styles.statusBadgeText}>{target.status}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Read-only Description */}
                    <View style={styles.readOnlySection}>
                      <Text style={styles.readOnlyLabel}>Description:</Text>
                      <Text style={styles.readOnlyText}>{target.description}</Text>
                    </View>

                    {/* Read-only Measures */}
                    <View style={styles.readOnlySection}>
                      <Text style={styles.readOnlyLabel}>Measures:</Text>
                      <Text style={styles.readOnlyText}>{target.measures}</Text>
                    </View>

                    {target.isLate && (
                      <View style={styles.lateWarning}>
                        <SvgIcon name="alertCircle" size={16} color="#ef4444" style={{}} />
                        <Text style={styles.lateText}>LATE SUBMISSION</Text>
                      </View>
                    )}

                    {/* Faculty Self-Rating */}
                    <View style={styles.ratingSection}>
                      <Text style={styles.ratingSectionTitle}>Faculty Self-Rating:</Text>
                      <View style={styles.ratingRow}>
                        {target.selfRatingQ && <Text style={styles.ratingItem}>Q: {target.selfRatingQ}</Text>}
                        {target.selfRatingE && <Text style={styles.ratingItem}>E: {target.selfRatingE}</Text>}
                        {target.selfRatingT && <Text style={styles.ratingItem}>T: {target.selfRatingT}</Text>}
                        {target.selfRatingAvg && (
                          <Text style={styles.ratingAvg}>Avg: {target.selfRatingAvg.toFixed(2)}</Text>
                        )}
                      </View>
                    </View>

                    {/* Secretary Rating (if approved) */}
                    {target.status === 'RATED' && target.secretaryRatingAvg && (
                      <View style={[styles.ratingSection, styles.secretaryApprovedSection]}>
                        <Text style={styles.secretaryApprovedTitle}>Secretary Rating (Approved):</Text>
                        <View style={styles.ratingRow}>
                          {target.secretaryQ && <Text style={styles.ratingItem}>Q: {target.secretaryQ}</Text>}
                          {target.secretaryE && <Text style={styles.ratingItem}>E: {target.secretaryE}</Text>}
                          {target.secretaryT && <Text style={styles.ratingItem}>T: {target.secretaryT}</Text>}
                          <Text style={[styles.ratingAvg, styles.secretaryApprovedAvg]}>
                            Avg: {target.secretaryRatingAvg.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Incomplete Note */}
                    {target.status === 'INCOMPLETE' && target.incompleteNote && (
                      <View style={styles.incompleteNoteSection}>
                        <Text style={styles.incompleteNoteLabel}>Reason for Incomplete:</Text>
                        <Text style={styles.incompleteNoteText}>{target.incompleteNote}</Text>
                      </View>
                    )}

                    {/* Accomplishment */}
                    {target.actualAccomplishments && (
                      <View style={styles.accomplishmentSection}>
                        <Text style={styles.sectionLabel}>Accomplishment:</Text>
                        <Text style={styles.accomplishmentText}>{target.actualAccomplishments}</Text>
                      </View>
                    )}

                    {/* Documents */}
                    {target.movFileUrls && target.movFileUrls.length > 0 && (
                      <View style={styles.documentsSection}>
                        <Text style={styles.sectionLabel}>Documents: {target.movFileUrls.length} file(s)</Text>
                        <View style={styles.documentsList}>
                          {target.movFileUrls.map((fileUrl, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.documentItem}
                              onPress={() => handlePreviewDocument(fileUrl)}
                            >
                              <SvgIcon name={getFileIcon(fileUrl)} size={16} color={colors.accent} style={{}} />
                              <Text style={styles.documentName}>{fileUrl}</Text>
                              <SvgIcon name="eye" size={14} color={colors.text3} style={{}} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Approve Target Button - Only show for SUBMITTED/ENDORSED targets */}
                    {(target.status === 'SUBMITTED' || target.status === 'ENDORSED') && (
                      <TouchableOpacity
                        style={styles.rateTargetButton}
                        onPress={() => handleOpenSecretaryRatingModal(target)}
                      >
                        <SvgIcon name="checkCircle" size={18} color="#fff" style={{}} />
                        <Text style={styles.rateTargetButtonText}>Approve or Mark Incomplete</Text>
                      </TouchableOpacity>
                    )}

                    {/* Edit Button - For RATED targets */}
                    {target.status === 'RATED' && (
                      <TouchableOpacity
                        style={styles.editRatingButton}
                        onPress={() => handleOpenSecretaryRatingModal(target)}
                      >
                        <SvgIcon name="edit" size={16} color={colors.accent} style={{}} />
                        <Text style={styles.editRatingButtonText}>Edit Rating</Text>
                      </TouchableOpacity>
                    )}
                  </YStack>
                ))}
            </YStack>
          ))}

          {/* Submit All to Dean Button */}
          {allTargetsRatedBySecretary && (
            <TouchableOpacity style={styles.submitAllToDeanButton} onPress={handleSubmitAllToDean}>
              <SvgIcon name="checkCircle" size={20} color="#fff" style={{}} />
              <Text style={styles.submitAllToDeanButtonText}>Submit All Rated Targets to Dean</Text>
            </TouchableOpacity>
          )}
        </YStack>
      );
    }

    // Dean Review Interface
    if (isDean && hasRatedTargets) {
      return (
        <YStack>
          {ipcr.majorFunctions.map((mf) => (
            <YStack key={mf.id} style={styles.panel}>
              <TamaguiText style={styles.panelTitle}>{mf.title}</TamaguiText>
              <TamaguiText style={styles.categoryBadge}>{mf.category} ({(mf.weight * 100)}%)</TamaguiText>
              
              {mf.targets.map((target, tIndex) => (
                <YStack key={target.id} style={styles.deanTargetCard}>
                  <View style={styles.deanTargetHeader}>
                    <Text style={styles.targetLabel}>Target {tIndex + 1}</Text>
                    <View style={[styles.statusBadge, styles[`badge${target.status}`]]}>
                      <Text style={styles.statusBadgeText}>{target.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.targetDescription}>{target.description}</Text>

                  {target.isLate && (
                    <View style={styles.lateWarning}>
                      <SvgIcon name="alertCircle" size={16} color="#ef4444" style={{}} />
                      <Text style={styles.lateText}>LATE SUBMISSION</Text>
                    </View>
                  )}

                  {/* Faculty Self-Rating */}
                  <View style={styles.ratingSection}>
                    <Text style={styles.ratingSectionTitle}>Faculty Self-Rating:</Text>
                    <View style={styles.ratingRow}>
                      {target.selfRatingQ && <Text style={styles.ratingItem}>Q: {target.selfRatingQ}</Text>}
                      {target.selfRatingE && <Text style={styles.ratingItem}>E: {target.selfRatingE}</Text>}
                      {target.selfRatingT && <Text style={styles.ratingItem}>T: {target.selfRatingT}</Text>}
                      {target.selfRatingAvg && (
                        <Text style={styles.ratingAvg}>Avg: {target.selfRatingAvg.toFixed(2)}</Text>
                      )}
                    </View>
                  </View>

                  {/* Secretary Rating */}
                  {target.status === 'RATED' && (
                    <View style={styles.ratingSection}>
                      <Text style={styles.ratingSectionTitle}>Secretary Rating:</Text>
                      <View style={styles.ratingRow}>
                        {target.secretaryQ && <Text style={styles.ratingItem}>Q: {target.secretaryQ}</Text>}
                        {target.secretaryE && <Text style={styles.ratingItem}>E: {target.secretaryE}</Text>}
                        {target.secretaryT && <Text style={styles.ratingItem}>T: {target.secretaryT}</Text>}
                        {target.secretaryRatingAvg && (
                          <Text style={styles.ratingAvg}>Avg: {target.secretaryRatingAvg.toFixed(2)}</Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Official Rating (if approved) */}
                  {(target.status === 'APPROVED' || target.status === 'APPROVED_OVERRIDE') && (
                    <View style={[styles.ratingSection, styles.officialRatingSection]}>
                      <Text style={styles.officialRatingTitle}>Official Rating:</Text>
                      <View style={styles.ratingRow}>
                        {target.officialQ && <Text style={styles.ratingItem}>Q: {target.officialQ}</Text>}
                        {target.officialE && <Text style={styles.ratingItem}>E: {target.officialE}</Text>}
                        {target.officialT && <Text style={styles.ratingItem}>T: {target.officialT}</Text>}
                        {target.officialRatingAvg && (
                          <Text style={[styles.ratingAvg, styles.officialAvg]}>
                            Avg: {target.officialRatingAvg.toFixed(2)}
                          </Text>
                        )}
                      </View>
                      {target.status === 'APPROVED_OVERRIDE' && target.deanRemarks && (
                        <Text style={styles.overrideNote}>Override: {target.deanRemarks}</Text>
                      )}
                    </View>
                  )}

                  {/* Accomplishment */}
                  {target.actualAccomplishments && (
                    <View style={styles.accomplishmentSection}>
                      <Text style={styles.sectionLabel}>Accomplishment:</Text>
                      <Text style={styles.accomplishmentText}>{target.actualAccomplishments}</Text>
                    </View>
                  )}

                  {/* Documents */}
                  {target.movFileUrls && target.movFileUrls.length > 0 && (
                    <View style={styles.documentsSection}>
                      <Text style={styles.sectionLabel}>Documents: {target.movFileUrls.length} file(s)</Text>
                    </View>
                  )}

                  {/* Dean Action Buttons */}
                  {target.status === 'RATED' && (
                    <View style={styles.deanActions}>
                      <TouchableOpacity
                        style={[styles.deanButton, styles.approveButton]}
                        onPress={() => handleApprove(target)}
                      >
                        <SvgIcon name="checkCircle" size={18} color="#fff" style={{}} />
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deanButton, styles.overrideButton]}
                        onPress={() => handleOpenOverrideModal(target)}
                      >
                        <SvgIcon name="edit" size={18} color="#3b82f6" style={{}} />
                        <Text style={styles.overrideButtonText}>Override</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deanButton, styles.returnButton]}
                        onPress={() => handleOpenReturnModal(target)}
                      >
                        <SvgIcon name="arrowBack" size={18} color="#ef4444" style={{}} />
                        <Text style={styles.returnButtonText}>Return</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </YStack>
              ))}
            </YStack>
          ))}

          {/* Approve All Button */}
          {hasRatedTargets && (
            <TouchableOpacity style={styles.approveAllButton} onPress={handleApproveAll}>
              <SvgIcon name="checkCircle" size={20} color="#fff" style={{}} />
              <Text style={styles.approveAllButtonText}>Approve All Rated Targets</Text>
            </TouchableOpacity>
          )}

          {/* Compute Final Rating Button */}
          {allTargetsApproved && !ipcr.finalRating && (
            <TouchableOpacity style={styles.computeButton} onPress={handleComputeFinalRating}>
              <SvgIcon name="star" size={20} color="#fff" style={{}} />
              <Text style={styles.computeButtonText}>Compute Final IPCR Rating</Text>
            </TouchableOpacity>
          )}
        </YStack>
      );
    }

    // Default View (Faculty/Secretary)
    return (
      <YStack>
        {ipcr.majorFunctions.map((mf) => (
          <YStack key={mf.id} style={styles.panel}>
            <TamaguiText style={styles.panelTitle}>{mf.title}</TamaguiText>
            <TamaguiText style={styles.categoryBadge}>{mf.category} ({(mf.weight * 100)}%)</TamaguiText>
            
            {mf.targets.map((target, tIndex) => (
              <YStack key={target.id} style={styles.targetCard}>
                <TamaguiText style={styles.targetLabel}>Target {tIndex + 1}</TamaguiText>
                
                <YStack style={styles.formGroup}>
                  <TamaguiText style={styles.label}>Description</TamaguiText>
                  <TextInput
                    style={[styles.textArea, !isTargetSettingPhase && styles.inputDisabled]}
                    value={target.description}
                    editable={isTargetSettingPhase}
                    multiline
                  />
                </YStack>

                <YStack style={styles.formGroup}>
                  <TamaguiText style={styles.label}>Measures</TamaguiText>
                  <TextInput
                    style={[styles.textArea, !isTargetSettingPhase && styles.inputDisabled]}
                    value={target.measures}
                    editable={isTargetSettingPhase}
                    multiline
                  />
                </YStack>

                <TamaguiText style={styles.ratingsLabel}>Ratings</TamaguiText>
                <XStack gap="$3" mb="$3">
                  <RatingInput
                    label="Q1 - Quality"
                    value={target.q1Rating}
                    onChange={(val) => handleRatingChange(target.id, 'q1Rating', val)}
                    disabled={!isEditable}
                  />
                  <RatingInput
                    label="E2 - Efficiency"
                    value={target.e2Rating}
                    onChange={(val) => handleRatingChange(target.id, 'e2Rating', val)}
                    disabled={!isEditable}
                  />
                  <RatingInput
                    label="T3 - Timeliness"
                    value={target.t3Rating}
                    onChange={(val) => handleRatingChange(target.id, 't3Rating', val)}
                    disabled={!isEditable}
                  />
                </XStack>

                <YStack style={styles.a4Container}>
                  <TamaguiText style={styles.a4Label}>A4 - Average (Auto-calculated)</TamaguiText>
                  <YStack ai="center">
                    <TamaguiText style={styles.a4Text}>
                      {target.a4Rating !== null ? target.a4Rating.toFixed(2) : '--'}
                    </TamaguiText>
                  </YStack>
                </YStack>
              </YStack>
            ))}
          </YStack>
        ))}
      </YStack>
    );
  };

  const renderAccomplishmentsTab = () => (
    <YStack>
      {ipcr.majorFunctions.map((mf) => (
        <YStack key={mf.id} style={styles.panel}>
          <TamaguiText style={styles.panelTitle}>{mf.title}</TamaguiText>
          
          {mf.targets.map((target, tIndex) => (
            <YStack key={target.id} style={styles.targetCard}>
              <TamaguiText style={styles.targetLabel}>Target {tIndex + 1}: {target.description}</TamaguiText>
              
              <YStack style={styles.formGroup}>
                <TamaguiText style={styles.label}>Actual Accomplishments</TamaguiText>
                <TextInput
                  style={styles.textArea}
                  value={target.actualAccomplishments}
                  placeholder="Describe what was accomplished..."
                  placeholderTextColor={colors.text3}
                  multiline
                  numberOfLines={4}
                />
              </YStack>

              <YStack style={styles.formGroup}>
                <TamaguiText style={styles.label}>Remarks</TamaguiText>
                <TextInput
                  style={styles.textArea}
                  value={target.remarks}
                  placeholder="Additional remarks..."
                  placeholderTextColor={colors.text3}
                  multiline
                  numberOfLines={3}
                />
              </YStack>
            </YStack>
          ))}
        </YStack>
      ))}
    </YStack>
  );

  const renderMOVTab = () => (
    <YStack style={styles.panel}>
      <TamaguiText style={styles.panelTitle}>Means of Verification (MOV)</TamaguiText>
      <TamaguiText style={styles.infoText}>
        Upload supporting documents for your accomplishments
      </TamaguiText>

      {ipcr.majorFunctions.map((mf) =>
        mf.targets.map((target, tIndex) => (
          <YStack key={target.id} mb={20}>
            <TamaguiText style={styles.movTargetTitle}>
              {mf.title} - Target {tIndex + 1}
            </TamaguiText>
            
            <XStack flexWrap="wrap" gap="$3">
              {target.movFileUrls.map((file, fIndex) => (
                <YStack key={fIndex} style={styles.fileCard}>
                  <SvgIcon name="document" size={32} color={colors.accent} style={{}} />
                  <TamaguiText style={styles.fileName}>{file}</TamaguiText>
                </YStack>
              ))}
              
              <TouchableOpacity style={styles.uploadCard}>
                <SvgIcon name="plus" size={24} color={colors.text3} style={{}} />
                <TamaguiText style={styles.uploadText}>Upload MOV</TamaguiText>
              </TouchableOpacity>
            </XStack>
          </YStack>
        ))
      )}
    </YStack>
  );

  const renderRatingSummaryTab = () => (
    <YStack>
      <YStack style={styles.panel}>
        <TamaguiText style={styles.panelTitle}>Rating Breakdown</TamaguiText>
        
        <XStack jc="space-between" py="$2">
          <TamaguiText style={styles.summaryLabel}>Strategic Priority Average:</TamaguiText>
          <TamaguiText style={styles.summaryValue}>{ratingCalc.strategicAvg.toFixed(2)}</TamaguiText>
        </XStack>
        <XStack jc="space-between" py="$2">
          <TamaguiText style={styles.summaryLabel}>Strategic Weighted (45%):</TamaguiText>
          <TamaguiText style={styles.summaryValue}>{ratingCalc.strategicWeighted.toFixed(2)}</TamaguiText>
        </XStack>

        <YStack h={1} bg="$border" my="$3" />

        <XStack jc="space-between" py="$2">
          <TamaguiText style={styles.summaryLabel}>Core Functions Average:</TamaguiText>
          <TamaguiText style={styles.summaryValue}>{ratingCalc.coreAvg.toFixed(2)}</TamaguiText>
        </XStack>
        <XStack jc="space-between" py="$2">
          <TamaguiText style={styles.summaryLabel}>Core Weighted (45%):</TamaguiText>
          <TamaguiText style={styles.summaryValue}>{ratingCalc.coreWeighted.toFixed(2)}</TamaguiText>
        </XStack>

        <YStack h={1} bg="$border" my="$3" />

        <XStack jc="space-between" py="$2">
          <TamaguiText style={styles.summaryLabel}>Support Functions Average:</TamaguiText>
          <TamaguiText style={styles.summaryValue}>{ratingCalc.supportAvg.toFixed(2)}</TamaguiText>
        </XStack>
        <XStack jc="space-between" py="$2">
          <TamaguiText style={styles.summaryLabel}>Support Weighted (10%):</TamaguiText>
          <TamaguiText style={styles.summaryValue}>{ratingCalc.supportWeighted.toFixed(2)}</TamaguiText>
        </XStack>

        <YStack h={1} bg="$border" my="$3" />

        <YStack style={styles.finalRatingCard}>
          <TamaguiText style={styles.finalRatingLabel}>Final Average Rating</TamaguiText>
          <TamaguiText style={styles.finalRatingValue}>{ratingCalc.final.toFixed(2)}</TamaguiText>
          <TamaguiText style={styles.adjectivalRating}>{ratingCalc.adjectival}</TamaguiText>
        </YStack>
      </YStack>
    </YStack>
  );

  return (
    <YStack f={1} bg="$bg">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Fixed Topbar */}
      <XStack bg="$bg2" borderBottomWidth={1} borderBottomColor="$border" px="$4" py="$3" pt={48} ai="center">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <SvgIcon name="arrowBack" size={24} color={colors.text} style={{}} />
        </TouchableOpacity>
        <YStack f={1} mx="$4">
          <TamaguiText fontSize={17} fontWeight="700" color="$text">IPCR Detail</TamaguiText>
          <TamaguiText fontSize={11} color="$text3" mt={2}>
            {faculty.firstName} {faculty.lastName} • {ipcr.period}
          </TamaguiText>
        </YStack>
        <TouchableOpacity>
          <SvgIcon name="moreVertical" size={22} color={colors.text2} style={{}} />
        </TouchableOpacity>
      </XStack>

      {/* Fixed Header Card */}
      <YStack bg="$bg2" borderBottomWidth={1} borderBottomColor="$border" p="$4">
        <XStack jc="space-between" ai="flex-start" mb="$3">
          <YStack>
            <TamaguiText fontSize={18} fontWeight="700" color="$text">
              {faculty.firstName} {faculty.lastName}
            </TamaguiText>
            <TamaguiText fontSize={13} color="$text3" mt={2}>{ipcr.period}</TamaguiText>
          </YStack>
          <StatusBadge status={ipcr.status} />
        </XStack>
        {ipcr.finalRating && (
          <XStack ai="center" gap="$2">
            <SvgIcon name="star" size={20} color="#f59e0b" style={{}} />
            <TamaguiText fontSize={20} fontWeight="800" color="$text">{ipcr.finalRating.toFixed(1)}</TamaguiText>
            <TamaguiText fontSize={13} color="$text2">{ipcr.adjectivalRating}</TamaguiText>
          </XStack>
        )}
      </YStack>

      {/* Fixed Tabs */}
      <YStack bg="$bg2" borderBottomWidth={1} borderBottomColor="$border">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <TamaguiText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </TamaguiText>
              </TouchableOpacity>
            ))}
          </XStack>
        </ScrollView>
      </YStack>

      {/* Scrollable Content - Tamagui ScrollView with proper web support */}
      <ScrollView f={1}>
        <YStack p="$4" pb="$8">
          {activeTab === 'Targets' && renderTargetsTab()}
          {activeTab === 'Accomplishments' && renderAccomplishmentsTab()}
          {activeTab === 'MOV' && renderMOVTab()}
          {activeTab === 'Rating Summary' && renderRatingSummaryTab()}
        </YStack>
      </ScrollView>

      {/* Override Modal */}
      <Modal
        visible={overrideModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOverrideModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Override Secretary Rating</Text>

            {selectedTarget && (
              <View style={styles.modalTargetInfo}>
                <Text style={styles.modalTargetText}>
                  {selectedTarget.target.description.substring(0, 100)}...
                </Text>
                {selectedTarget.target.secretaryRatingAvg && (
                  <Text style={styles.modalSecretaryRating}>
                    Secretary Rating: {selectedTarget.target.secretaryRatingAvg.toFixed(2)}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.ratingInputs}>
              <View style={styles.ratingInputGroup}>
                <Text style={styles.inputLabel}>Quality (Q): 1-5</Text>
                <TextInput
                  style={styles.ratingInput}
                  keyboardType="numeric"
                  value={overrideInputs.q}
                  onChangeText={(text) => setOverrideInputs(prev => ({ ...prev, q: text }))}
                />
              </View>
              <View style={styles.ratingInputGroup}>
                <Text style={styles.inputLabel}>Efficiency (E): 1-5</Text>
                <TextInput
                  style={styles.ratingInput}
                  keyboardType="numeric"
                  value={overrideInputs.e}
                  onChangeText={(text) => setOverrideInputs(prev => ({ ...prev, e: text }))}
                />
              </View>
              <View style={styles.ratingInputGroup}>
                <Text style={styles.inputLabel}>Timeliness (T): 1-5</Text>
                <TextInput
                  style={styles.ratingInput}
                  keyboardType="numeric"
                  value={overrideInputs.t}
                  onChangeText={(text) => setOverrideInputs(prev => ({ ...prev, t: text }))}
                />
              </View>
            </View>

            {overrideInputs.q && overrideInputs.e && overrideInputs.t && (
              <View style={styles.computedAvg}>
                <Text style={styles.computedAvgLabel}>New Average:</Text>
                <Text style={styles.computedAvgValue}>
                  {calculateA4(
                    parseFloat(overrideInputs.q) || 0,
                    parseFloat(overrideInputs.e) || 0,
                    parseFloat(overrideInputs.t) || 0
                  ).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.remarksInputGroup}>
              <Text style={styles.inputLabel}>Remarks (Required):</Text>
              <TextInput
                style={styles.remarksInput}
                multiline
                numberOfLines={3}
                value={overrideInputs.remarks}
                onChangeText={(text) => setOverrideInputs(prev => ({ ...prev, remarks: text }))}
                placeholder="Explain why you are overriding the secretary's rating..."
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setOverrideModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitOverride}
              >
                <Text style={styles.submitButtonText}>Submit Override</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Return Modal */}
      <Modal
        visible={returnModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReturnModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Return Target to Faculty</Text>

            {selectedTarget && (
              <View style={styles.modalTargetInfo}>
                <Text style={styles.modalTargetText}>
                  {selectedTarget.target.description.substring(0, 100)}...
                </Text>
              </View>
            )}

            <View style={styles.remarksInputGroup}>
              <Text style={styles.inputLabel}>Reason for Return (Required):</Text>
              <TextInput
                style={styles.remarksInput}
                multiline
                numberOfLines={4}
                value={returnRemarks}
                onChangeText={setReturnRemarks}
                placeholder="Explain why this target is being returned..."
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setReturnModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.returnSubmitButton]}
                onPress={handleSubmitReturn}
              >
                <Text style={styles.returnSubmitButtonText}>Return to Faculty</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Secretary Rating Modal */}
      <Modal
        visible={secretaryRatingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSecretaryRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Target</Text>

            {selectedTarget && (
              <View style={styles.modalTargetInfo}>
                <Text style={styles.modalTargetText}>{ipcr.facultyName}</Text>
                <Text style={styles.modalTargetDesc}>
                  {selectedTarget.target.description.substring(0, 100)}...
                </Text>
                {selectedTarget.target.selfRatingAvg && (
                  <Text style={styles.modalSelfRating}>
                    Faculty Self-Rating: {selectedTarget.target.selfRatingAvg.toFixed(2)}
                  </Text>
                )}
                
                {/* Documents in Modal */}
                {selectedTarget.target.movFileUrls && selectedTarget.target.movFileUrls.length > 0 && (
                  <View style={styles.modalDocumentsSection}>
                    <Text style={styles.modalDocumentsLabel}>
                      📎 {selectedTarget.target.movFileUrls.length} Document(s) - Click to preview
                    </Text>
                    {selectedTarget.target.movFileUrls.map((fileUrl, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.modalDocumentItem}
                        onPress={() => handlePreviewDocument(fileUrl)}
                      >
                        <SvgIcon name={getFileIcon(fileUrl)} size={14} color={colors.accent} style={{}} />
                        <Text style={styles.modalDocumentName}>{fileUrl}</Text>
                        <SvgIcon name="eye" size={12} color={colors.accent} style={{}} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.ratingInputs}>
              <View style={styles.ratingInputGroup}>
                <Text style={styles.inputLabel}>Quality (Q): 1-5</Text>
                <TextInput
                  style={styles.ratingInput}
                  keyboardType="numeric"
                  value={secretaryRatingInputs.q}
                  onChangeText={(text) => setSecretaryRatingInputs(prev => ({ ...prev, q: text }))}
                  placeholder="5"
                />
              </View>
              <View style={styles.ratingInputGroup}>
                <Text style={styles.inputLabel}>Efficiency (E): 1-5</Text>
                <TextInput
                  style={styles.ratingInput}
                  keyboardType="numeric"
                  value={secretaryRatingInputs.e}
                  onChangeText={(text) => setSecretaryRatingInputs(prev => ({ ...prev, e: text }))}
                  placeholder="5"
                />
              </View>
              <View style={styles.ratingInputGroup}>
                <Text style={styles.inputLabel}>Timeliness (T): 1-5</Text>
                <TextInput
                  style={styles.ratingInput}
                  keyboardType="numeric"
                  value={secretaryRatingInputs.t}
                  onChangeText={(text) => setSecretaryRatingInputs(prev => ({ ...prev, t: text }))}
                  placeholder="5"
                />
              </View>
            </View>

            {secretaryRatingInputs.q && secretaryRatingInputs.e && secretaryRatingInputs.t && (
              <View style={styles.computedAvg}>
                <Text style={styles.computedAvgLabel}>Computed Average:</Text>
                <Text style={styles.computedAvgValue}>
                  {calculateA4(
                    parseFloat(secretaryRatingInputs.q) || 0,
                    parseFloat(secretaryRatingInputs.e) || 0,
                    parseFloat(secretaryRatingInputs.t) || 0
                  ).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.noteInputGroup}>
              <Text style={styles.inputLabel}>Note (optional):</Text>
              <TextInput
                style={styles.noteInput}
                multiline
                numberOfLines={3}
                value={secretaryRatingInputs.note}
                onChangeText={(text) => setSecretaryRatingInputs(prev => ({ ...prev, note: text }))}
                placeholder="Optional notes about this rating..."
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.incompleteButton]}
                onPress={handleSecretaryMarkIncomplete}
              >
                <Text style={styles.incompleteButtonText}>Mark Incomplete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.approveTargetButton]}
                onPress={handleSecretaryApproveTarget}
              >
                <Text style={styles.approveTargetButtonText}>Approve Target</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSecretaryRatingModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        visible={documentPreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDocumentPreviewVisible(false)}
      >
        <View style={styles.previewModalOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Document Preview</Text>
              <TouchableOpacity onPress={() => setDocumentPreviewVisible(false)}>
                <SvgIcon name="close" size={24} color={colors.text} style={{}} />
              </TouchableOpacity>
            </View>

            {selectedDocument && (
              <View style={styles.previewBody}>
                <View style={styles.documentPreviewCard}>
                  <SvgIcon name={getFileIcon(selectedDocument)} size={48} color={colors.accent} style={{}} />
                  <Text style={styles.documentPreviewName}>{selectedDocument}</Text>
                  
                  <Text style={styles.previewNote}>
                    Click "Open Document" to view the file in a new window
                  </Text>

                  <View style={styles.previewActions}>
                    <TouchableOpacity
                      style={styles.openDocButton}
                      onPress={() => handleDownloadDocument(selectedDocument)}
                    >
                      <SvgIcon name="eye" size={18} color="#fff" style={{}} />
                      <Text style={styles.openDocButtonText}>Open Document</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.previewCloseButton}
              onPress={() => setDocumentPreviewVisible(false)}
            >
              <Text style={styles.previewCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </YStack>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: 12,
    color: colors.text3,
    marginBottom: 16,
  },
  targetCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    opacity: 0.4,
  },
  ratingsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  a4Container: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  a4Label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 6,
  },
  a4Text: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
  },
  infoText: {
    fontSize: 13,
    color: colors.text3,
    marginBottom: 16,
  },
  movTargetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  fileCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: 100,
  },
  fileName: {
    fontSize: 11,
    color: colors.text2,
    marginTop: 8,
    textAlign: 'center',
  },
  uploadCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  uploadText: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 8,
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
  finalRatingCard: {
    backgroundColor: colors.bg3,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  finalRatingLabel: {
    fontSize: 13,
    color: colors.text3,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  finalRatingValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 4,
  },
  adjectivalRating: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 14,
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
  // Dean Review Styles
  deanTargetCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deanTargetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  lateWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  lateText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 6,
  },
  ratingSection: {
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  ratingSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingItem: {
    fontSize: 13,
    color: colors.text,
  },
  ratingAvg: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  officialRatingSection: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  officialRatingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 6,
  },
  officialAvg: {
    color: '#10b981',
  },
  overrideNote: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 8,
    fontStyle: 'italic',
  },
  accomplishmentSection: {
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 6,
  },
  accomplishmentText: {
    fontSize: 13,
    color: colors.text,
  },
  documentsSection: {
    marginBottom: 12,
  },
  deanActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  deanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  overrideButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  overrideButtonText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  returnButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  returnButtonText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  approveAllButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  approveAllButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  submitAllToDeanButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  submitAllToDeanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  computeButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  computeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeRATED: {
    backgroundColor: '#fef3c7',
  },
  badgeAPPROVED: {
    backgroundColor: '#d1fae5',
  },
  badgeAPPROVED_OVERRIDE: {
    backgroundColor: '#dbeafe',
  },
  badgeRETURNED: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 600,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  modalTargetInfo: {
    backgroundColor: colors.bg3,
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  modalTargetText: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
  },
  modalSecretaryRating: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  ratingInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ratingInputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  ratingInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
    textAlign: 'center',
  },
  computedAvg: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg3,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  computedAvgLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  computedAvgValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
  remarksInputGroup: {
    marginBottom: 20,
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.bg3,
  },
  cancelButtonText: {
    color: colors.text3,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  returnSubmitButton: {
    backgroundColor: '#ef4444',
  },
  returnSubmitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Secretary Rating Styles
  secretaryTargetCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secretaryTargetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeApproved: {
    backgroundColor: '#d1fae5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeIncomplete: {
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readOnlySection: {
    marginBottom: 12,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
  },
  readOnlyText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  documentsList: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.bg,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  documentName: {
    fontSize: 13,
    color: colors.text2,
    flex: 1,
  },
  rateTargetButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
    marginTop: 8,
  },
  rateTargetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editRatingButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
    marginTop: 8,
  },
  editRatingButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  secretaryApprovedSection: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  secretaryApprovedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 6,
  },
  secretaryApprovedAvg: {
    color: '#10b981',
  },
  incompleteNoteSection: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  incompleteNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  incompleteNoteText: {
    fontSize: 13,
    color: colors.text,
  },
  modalTargetDesc: {
    fontSize: 12,
    color: colors.text3,
    marginBottom: 8,
  },
  modalSelfRating: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  noteInputGroup: {
    marginBottom: 20,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  incompleteButton: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  incompleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  approveTargetButton: {
    backgroundColor: '#10b981',
  },
  approveTargetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rateSubmitButton: {
    backgroundColor: colors.accent,
  },
  rateSubmitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: colors.text3,
    fontSize: 14,
    fontWeight: '600',
  },
  badgeSUBMITTED: {
    backgroundColor: '#fef3c7',
  },
  badgeENDORSED: {
    backgroundColor: '#d1fae5',
  },
  // Modal Documents Section
  modalDocumentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalDocumentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 8,
  },
  modalDocumentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.bg,
    borderRadius: 4,
    marginBottom: 4,
  },
  modalDocumentName: {
    fontSize: 11,
    color: colors.text2,
    flex: 1,
  },
  // Document Preview Modal
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModalContent: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  previewBody: {
    marginBottom: 20,
  },
  documentPreviewCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  documentPreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  previewNote: {
    fontSize: 12,
    color: colors.text3,
    textAlign: 'center',
    marginBottom: 16,
  },
  previewActions: {
    width: '100%',
  },
  openDocButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  openDocButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  previewCloseButtonText: {
    color: colors.text3,
    fontSize: 14,
    fontWeight: '600',
  },
});
