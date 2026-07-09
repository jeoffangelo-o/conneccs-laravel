import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { ScrollView } from 'tamagui';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';

export default function CoordinatorQueueScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { getCoordinatorQueue, coordinatorEndorseTarget, coordinatorReturnTarget } = useData();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [activeTab, setActiveTab] = useState<'pending' | 'endorsed' | 'returned'>('pending');
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'endorse' | 'return'>('endorse');
  const [note, setNote] = useState('');

  if (!user || user.role !== 'COORDINATOR') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Coordinator role required.</Text>
      </View>
    );
  }

  const coordinatorType = user.coordinatorType || 'RESEARCH';
  const queue = getCoordinatorQueue(coordinatorType);

  // Filter by tab
  const filteredQueue = queue.filter(item => {
    if (activeTab === 'pending') return item.target.status === 'SUBMITTED';
    if (activeTab === 'endorsed') return item.target.status === 'ENDORSED';
    if (activeTab === 'returned') return item.target.status === 'RETURNED' && item.target.returnedBy === 'COORDINATOR';
    return false;
  });

  const handleEndorse = (item: any) => {
    setSelectedTarget(item);
    setActionType('endorse');
    setNote('');
    setModalVisible(true);
  };

  const handleReturn = (item: any) => {
    setSelectedTarget(item);
    setActionType('return');
    setNote('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!selectedTarget) return;

    if (actionType === 'return' && !note.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please provide a reason for returning this target');
      } else {
        Alert.alert('Error', 'Please provide a reason for returning this target');
      }
      return;
    }

    try {
      if (actionType === 'endorse') {
        await coordinatorEndorseTarget(
          selectedTarget.ipcr.id,
          selectedTarget.target.id,
          note || 'Verified and endorsed'
        );
        if (Platform.OS === 'web') {
          window.alert('Target endorsed successfully');
        } else {
          Alert.alert('Success', 'Target endorsed successfully');
        }
      } else {
        await coordinatorReturnTarget(
          selectedTarget.ipcr.id,
          selectedTarget.target.id,
          note
        );
        if (Platform.OS === 'web') {
          window.alert('Target returned to faculty');
        } else {
          Alert.alert('Success', 'Target returned to faculty');
        }
      }
      setModalVisible(false);
      setSelectedTarget(null);
      setNote('');
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to process target');
      } else {
        Alert.alert('Error', 'Failed to process target');
      }
    }
  };

  const renderTargetCard = (item: any) => {
    const { ipcr, target, majorFunction } = item;
    
    return (
      <View key={target.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.facultyName}>{ipcr.facultyName}</Text>
          <View style={[styles.badge, styles[`badge${target.status}`]]}>
            <Text style={styles.badgeText}>{target.status}</Text>
          </View>
        </View>

        <Text style={styles.kraType}>{target.kraType} - {majorFunction.title}</Text>
        <Text style={styles.targetDescription}>{target.description}</Text>
        
        <View style={styles.infoRow}>
          <SvgIcon name="calendar" size={16} color={colors.text3} style={{}} />
          <Text style={styles.infoText}>
            Submitted: {target.submittedAt ? new Date(target.submittedAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        {target.isLate && (
          <View style={styles.lateWarning}>
            <SvgIcon name="alertCircle" size={16} color={colors.red} style={{}} />
            <Text style={styles.lateText}>LATE SUBMISSION</Text>
          </View>
        )}

        <View style={styles.accomplishmentSection}>
          <Text style={styles.sectionTitle}>Accomplishment:</Text>
          <Text style={styles.accomplishmentText}>{target.actualAccomplishments || 'N/A'}</Text>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Self-Rating:</Text>
          <View style={styles.ratingRow}>
            {target.selfRatingQ && <Text style={styles.ratingItem}>Q: {target.selfRatingQ}</Text>}
            {target.selfRatingE && <Text style={styles.ratingItem}>E: {target.selfRatingE}</Text>}
            {target.selfRatingT && <Text style={styles.ratingItem}>T: {target.selfRatingT}</Text>}
            {target.selfRatingAvg && (
              <Text style={styles.ratingAvg}>Avg: {target.selfRatingAvg.toFixed(2)}</Text>
            )}
          </View>
        </View>

        {target.movFileUrls && target.movFileUrls.length > 0 && (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Documents: {target.movFileUrls.length} file(s)</Text>
          </View>
        )}

        {activeTab === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.endorseButton]}
              onPress={() => handleEndorse(item)}
            >
              <SvgIcon name="checkCircle" size={20} color="#fff" style={{}} />
              <Text style={styles.buttonText}>Endorse</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.returnButton]}
              onPress={() => handleReturn(item)}
            >
              <SvgIcon name="arrowBack" size={20} color="#fff" style={{}} />
              <Text style={styles.buttonText}>Return</Text>
            </TouchableOpacity>
          </View>
        )}

        {target.coordinatorNote && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Coordinator Note:</Text>
            <Text style={styles.noteText}>{target.coordinatorNote}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar with Menu */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>
              {coordinatorType === 'RESEARCH' ? 'Research' : 'Extension'} Verification Queue
            </Text>
            <Text style={styles.topbarBreadcrumb}>
              {coordinatorType === 'RESEARCH' ? 'KRA 2' : 'KRA 3'} Targets
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({queue.filter(i => i.target.status === 'SUBMITTED').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'endorsed' && styles.activeTab]}
          onPress={() => setActiveTab('endorsed')}
        >
          <Text style={[styles.tabText, activeTab === 'endorsed' && styles.activeTabText]}>
            Endorsed ({queue.filter(i => i.target.status === 'ENDORSED').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'returned' && styles.activeTab]}
          onPress={() => setActiveTab('returned')}
        >
          <Text style={[styles.tabText, activeTab === 'returned' && styles.activeTabText]}>
            Returned ({queue.filter(i => i.target.status === 'RETURNED' && i.target.returnedBy === 'COORDINATOR').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        flex={1}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredQueue.length === 0 ? (
          <View style={styles.emptyState}>
            <SvgIcon name="folder" size={64} color={colors.text3} style={{}} />
            <Text style={styles.emptyText}>No targets in this category</Text>
          </View>
        ) : (
          filteredQueue.map(renderTargetCard)
        )}
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg2 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'endorse' ? 'Endorse Target' : 'Return Target'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <SvgIcon name="close" size={24} color={colors.text} style={{}} />
              </TouchableOpacity>
            </View>

            {selectedTarget && (
              <View style={styles.modalTargetInfo}>
                <Text style={styles.modalTargetText}>
                  {selectedTarget.ipcr.facultyName}
                </Text>
                <Text style={styles.modalTargetDesc}>
                  {selectedTarget.target.description.substring(0, 100)}...
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>
              {actionType === 'endorse' ? 'Verification Note (Optional):' : 'Reason for Return:'}
            </Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={note}
              onChangeText={setNote}
              placeholder={
                actionType === 'endorse'
                  ? 'Add verification notes...'
                  : 'Explain why this target is being returned...'
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {actionType === 'endorse' ? 'Endorse' : 'Return'}
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 48,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    color: colors.text3,
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeSUBMITTED: {
    backgroundColor: `${colors.orange}20`,
  },
  badgeENDORSED: {
    backgroundColor: `${colors.green}20`,
  },
  badgeRETURNED: {
    backgroundColor: `${colors.red}20`,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  kraType: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: 8,
  },
  targetDescription: {
    fontSize: 14,
    color: colors.text2,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.text3,
    marginLeft: 6,
  },
  lateWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.red}20`,
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  lateText: {
    fontSize: 12,
    color: colors.red,
    fontWeight: '600',
    marginLeft: 6,
  },
  accomplishmentSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.bg3,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  accomplishmentText: {
    fontSize: 13,
    color: colors.text2,
  },
  ratingSection: {
    marginTop: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  ratingItem: {
    fontSize: 13,
    color: colors.text2,
  },
  ratingAvg: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  documentsSection: {
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 6,
  },
  endorseButton: {
    backgroundColor: colors.green,
  },
  returnButton: {
    backgroundColor: colors.red,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noteSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${colors.accent}15`,
    borderRadius: 4,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: colors.text2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text3,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.red,
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalTargetInfo: {
    backgroundColor: colors.bg3,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  modalTargetText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  modalTargetDesc: {
    fontSize: 12,
    color: colors.text2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg3,
    color: colors.text,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.accent,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
