import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

type TabType = 'pending' | 'endorsed' | 'returned';

export default function CoordinatorQueueScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [queue, setQueue] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [actionType, setActionType] = useState<'endorse' | 'return'>('endorse');
  const [note, setNote] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/coordinator-queue');
      setQueue(response.data || []);
    } catch (error) {
      console.error('Failed to load queue:', error);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

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
      alert('Please provide a reason for returning this target');
      return;
    }

    try {
      const endpoint = actionType === 'endorse' 
        ? `/coordinator-queue/${selectedTarget.id}/endorse`
        : `/coordinator-queue/${selectedTarget.id}/return`;
      
      await apiService.post(endpoint, { note: note.trim() });
      
      setModalVisible(false);
      setSelectedTarget(null);
      setNote('');
      await loadQueue();
      alert(`Target ${actionType === 'endorse' ? 'endorsed' : 'returned'} successfully`);
    } catch (error) {
      console.error(`Failed to ${actionType} target:`, error);
      alert(`Failed to ${actionType} target`);
    }
  };

  const filteredQueue = queue.filter(item => {
    if (activeTab === 'pending') return item.status === 'SUBMITTED';
    if (activeTab === 'endorsed') return item.status === 'ENDORSED';
    if (activeTab === 'returned') return item.status === 'RETURNED' && item.returnedBy === 'COORDINATOR';
    return false;
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text2 }]}>Loading queue...</Text>
      </View>
    );
  }

  const coordinatorType = user?.coordinatorType || 'RESEARCH';
  const tabs = [
    { key: 'pending' as TabType, label: 'Pending', count: queue.filter(i => i.status === 'SUBMITTED').length },
    { key: 'endorsed' as TabType, label: 'Endorsed', count: queue.filter(i => i.status === 'ENDORSED').length },
    { key: 'returned' as TabType, label: 'Returned', count: queue.filter(i => i.status === 'RETURNED' && i.returnedBy === 'COORDINATOR').length },
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
            <Text style={styles.topbarTitleText}>
              {coordinatorType === 'RESEARCH' ? 'Research' : 'Extension'} Verification Queue
            </Text>
            <Text style={styles.topbarBreadcrumb}>
              {coordinatorType === 'RESEARCH' ? 'KRA 2' : 'KRA 3'} Targets
            </Text>
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
        {filteredQueue.length === 0 ? (
          <View style={styles.emptyState}>
            <SvgIcon name="folder" size={64} color={colors.text3} />
            <Text style={styles.emptyText}>No targets in this category</Text>
          </View>
        ) : (
          filteredQueue.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.facultyName}>{item.facultyName}</Text>
                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.kraType}>{item.kraType} - {item.majorFunctionTitle}</Text>
              <Text style={styles.targetDescription}>{item.description}</Text>

              <View style={styles.infoRow}>
                <SvgIcon name="calendar" size={16} color={colors.text3} />
                <Text style={styles.infoText}>
                  Submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>

              {item.isLate && (
                <View style={styles.lateWarning}>
                  <SvgIcon name="alertCircle" size={16} color={colors.red} />
                  <Text style={styles.lateText}>LATE SUBMISSION</Text>
                </View>
              )}

              <View style={styles.accomplishmentSection}>
                <Text style={styles.sectionTitle}>Accomplishment:</Text>
                <Text style={styles.accomplishmentText}>{item.actualAccomplishments || 'N/A'}</Text>
              </View>

              <View style={styles.ratingSection}>
                <Text style={styles.sectionTitle}>Self-Rating:</Text>
                <View style={styles.ratingRow}>
                  {item.selfRatingQ && <Text style={styles.ratingItem}>Q: {item.selfRatingQ}</Text>}
                  {item.selfRatingE && <Text style={styles.ratingItem}>E: {item.selfRatingE}</Text>}
                  {item.selfRatingT && <Text style={styles.ratingItem}>T: {item.selfRatingT}</Text>}
                  {item.selfRatingAvg && (
                    <Text style={styles.ratingAvg}>Avg: {item.selfRatingAvg.toFixed(2)}</Text>
                  )}
                </View>
              </View>

              {item.movFileUrls && item.movFileUrls.length > 0 && (
                <View style={styles.documentsSection}>
                  <SvgIcon name="document" size={16} color={colors.text3} />
                  <Text style={styles.documentsText}>{item.movFileUrls.length} document(s) attached</Text>
                </View>
              )}

              {activeTab === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.endorseButton]}
                    onPress={() => handleEndorse(item)}
                  >
                    <SvgIcon name="checkCircle" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Endorse</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.returnButton]}
                    onPress={() => handleReturn(item)}
                  >
                    <SvgIcon name="arrowBack" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Return</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.coordinatorNote && (
                <View style={styles.noteSection}>
                  <Text style={styles.noteLabel}>Coordinator Note:</Text>
                  <Text style={styles.noteText}>{item.coordinatorNote}</Text>
                </View>
              )}
            </View>
          ))
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'endorse' ? 'Endorse Target' : 'Return Target'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <SvgIcon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedTarget && (
              <View style={styles.modalBody}>
                <Text style={styles.modalTargetText}>{selectedTarget.facultyName}</Text>
                <Text style={styles.modalTargetDesc} numberOfLines={2}>
                  {selectedTarget.description}
                </Text>

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
                  placeholderTextColor={colors.text3}
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
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStatusStyle(status: string) {
  const styles: any = {
    'SUBMITTED': { backgroundColor: 'rgba(234,179,8,0.15)' },
    'ENDORSED': { backgroundColor: 'rgba(34,197,94,0.15)' },
    'RETURNED': { backgroundColor: 'rgba(239,68,68,0.15)' },
  };
  return styles[status] || styles['SUBMITTED'];
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
  emptyState: {
    padding: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text3,
    marginTop: 16,
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
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'uppercase',
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
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.text3,
  },
  lateWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.red}20`,
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  lateText: {
    fontSize: 12,
    color: colors.red,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  documentsText: {
    fontSize: 12,
    color: colors.text3,
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
    gap: 6,
    paddingVertical: 12,
    borderRadius: 6,
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
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
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
    marginBottom: 16,
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
