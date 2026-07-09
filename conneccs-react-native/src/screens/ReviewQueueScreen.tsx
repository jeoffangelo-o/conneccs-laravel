import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import usersData from '../../assets/data/users.json';
import { User, IPCRTarget } from '../../types';
import { WebScrollView } from '../components/WebScrollView';
import { canSecretaryRateTarget } from '../../utils/businessRules';
import { calculateA4 } from '../../utils/calculations';

type TabType = 'compliance' | 'rating' | 'returned';

export default function ReviewQueueScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { 
    ipcrs, 
    getSecretaryQueue, 
    getComplianceDashboard,
    secretaryRateTarget,
    secretaryReturnTarget,
    addNotification,
    updateIPCR,
  } = useData();
  const styles = createStyles(colors);
  const [activeTab, setActiveTab] = useState<TabType>('compliance');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [ratingInputs, setRatingInputs] = useState({ q: '', e: '', t: '', note: '' });

  const users = usersData as User[];

  // Check if user is Secretary or Dean
  const isSecretary = user?.role === 'SECRETARY';
  const isDean = user?.role === 'DEAN';
  const isChair = user?.role === 'CHAIR';

  // Get Secretary queue (targets awaiting rating)
  const secretaryQueue = useMemo(() => {
    if (!isSecretary) return [];
    return getSecretaryQueue();
  }, [isSecretary, ipcrs]);

  // Get Compliance Dashboard data
  const complianceData = useMemo(() => {
    if (!isSecretary) return [];
    return getComplianceDashboard();
  }, [isSecretary, ipcrs]);

  // Get returned targets
  const returnedTargets = useMemo(() => {
    if (!isSecretary) return [];
    const returned: any[] = [];
    ipcrs.forEach(ipcr => {
      ipcr.majorFunctions.forEach(mf => {
        mf.targets.forEach(target => {
          if (target.status === 'INCOMPLETE' || (target.status === 'RETURNED' && target.returnedBy === 'SECRETARY')) {
            returned.push({ ipcr, target, majorFunction: mf });
          }
        });
      });
    });
    return returned;
  }, [isSecretary, ipcrs]);

  // Dean/Chair review queue (legacy support)
  const reviewIPCRs = useMemo(() => {
    if (isSecretary) return [];
    
    let filtered = ipcrs;

    if (isChair) {
      filtered = filtered.filter(ipcr => {
        const faculty = users.find(u => u.id === ipcr.facultyId);
        return faculty?.program === user.program;
      });
    } else if (isDean) {
      filtered = filtered.filter(ipcr => {
        const faculty = users.find(u => u.id === ipcr.facultyId);
        return faculty?.department === user.department;
      });
    }

    // Show IPCRs with RATED targets awaiting Dean approval
    filtered = filtered.filter(ipcr => 
      ipcr.majorFunctions.some(mf => 
        mf.targets.some(t => t.status === 'RATED')
      )
    );

    return filtered;
  }, [ipcrs, user, isSecretary, isDean, isChair, users]);

  const handleOpenRatingModal = (item: any) => {
    // Check if secretary can rate this target
    if (!canSecretaryRateTarget(user!, item.target, item.ipcr)) {
      Alert.alert('Cannot Rate', 'You cannot rate your own IPCR or the Dean\'s IPCR');
      return;
    }

    setSelectedItem(item);
    setRatingInputs({ q: '', e: '', t: '', note: '' });
    setRatingModalVisible(true);
  };

  const handleRateTarget = async () => {
    if (!selectedItem) return;

    const q = parseFloat(ratingInputs.q);
    const e = parseFloat(ratingInputs.e);
    const t = parseFloat(ratingInputs.t);

    // Validate ratings
    if (isNaN(q) || q < 1 || q > 5) {
      Alert.alert('Invalid Rating', 'Quality rating must be between 1 and 5');
      return;
    }
    if (isNaN(e) || e < 1 || e > 5) {
      Alert.alert('Invalid Rating', 'Efficiency rating must be between 1 and 5');
      return;
    }
    if (isNaN(t) || t < 1 || t > 5) {
      Alert.alert('Invalid Rating', 'Timeliness rating must be between 1 and 5');
      return;
    }

    try {
      await secretaryRateTarget(selectedItem.ipcr.id, selectedItem.target.id, q, e, t);
      Alert.alert('Success', 'Target rated successfully and forwarded to Dean');
      setRatingModalVisible(false);
      setSelectedItem(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to rate target');
    }
  };

  const handleMarkIncomplete = async () => {
    if (!selectedItem) return;

    if (!ratingInputs.note.trim()) {
      Alert.alert('Note Required', 'Please provide a reason for marking this incomplete');
      return;
    }

    Alert.alert(
      'Mark Incomplete',
      'This will return the target to the faculty for revision. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Incomplete',
          style: 'destructive',
          onPress: async () => {
            try {
              await secretaryReturnTarget(selectedItem.ipcr.id, selectedItem.target.id, ratingInputs.note);
              Alert.alert('Success', 'Target marked incomplete and returned to faculty');
              setRatingModalVisible(false);
              setSelectedItem(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to mark target incomplete');
            }
          },
        },
      ]
    );
  };

  const handleSendReminder = (facultyId: string, facultyName: string) => {
    addNotification(
      facultyId,
      'DEADLINE_REMINDER',
      'IPCR Submission Reminder',
      'Please complete and submit your pending IPCR targets'
    );
    Alert.alert('Reminder Sent', `Reminder sent to ${facultyName}`);
  };

  const handleFixTargetStatuses = () => {
    // Migration function to fix target statuses for submitted IPCRs
    let fixedCount = 0;
    
    ipcrs.forEach(ipcr => {
      if (ipcr.status === 'SUBMITTED' || ipcr.overallStatus === 'SUBMITTED') {
        // Check if any targets don't have SUBMITTED status
        const needsFix = ipcr.majorFunctions.some(mf =>
          mf.targets.some(t => t.status !== 'SUBMITTED' && t.status !== 'RATED' && t.status !== 'APPROVED')
        );
        
        if (needsFix) {
          const updatedIPCR = {
            ...ipcr,
            majorFunctions: ipcr.majorFunctions.map(mf => ({
              ...mf,
              targets: mf.targets.map(t => ({
                ...t,
                // Only set to SUBMITTED if not already rated or approved
                status: (t.status === 'RATED' || t.status === 'APPROVED' || t.status === 'APPROVED_OVERRIDE') 
                  ? t.status 
                  : 'SUBMITTED' as const,
              })),
            })),
          };
          
          updateIPCR(ipcr.id, updatedIPCR);
          fixedCount++;
        }
      }
    });
    
    Alert.alert('Success', `Fixed ${fixedCount} IPCR(s). Targets should now appear in Rating Queue.`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'FINAL':
        return '#10b981';
      case 'IN_PROGRESS':
      case 'SUBMITTED':
        return '#f59e0b';
      case 'DELINQUENT':
        return '#ef4444';
      default:
        return colors.text3;
    }
  };

  const renderComplianceTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Faculty Compliance Dashboard</Text>
      
      {/* Fix Button for Data Migration */}
      <TouchableOpacity
        style={styles.fixButton}
        onPress={handleFixTargetStatuses}
      >
        <SvgIcon name="checkCircle" size={16} color="#fff" style={{}} />
        <Text style={styles.fixButtonText}>Fix Target Statuses (Click if Rating Queue is empty)</Text>
      </TouchableOpacity>
      
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Faculty Name</Text>
          <Text style={styles.tableHeaderCell}>Total</Text>
          <Text style={styles.tableHeaderCell}>Submitted</Text>
          <Text style={styles.tableHeaderCell}>Pending</Text>
          <Text style={styles.tableHeaderCell}>Status</Text>
          <Text style={styles.tableHeaderCell}>Action</Text>
        </View>
        {complianceData.map(item => (
          <View key={item.facultyId} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.facultyName}</Text>
            <Text style={styles.tableCell}>{item.totalTargets}</Text>
            <Text style={[styles.tableCell, { color: '#10b981', fontWeight: '600' }]}>
              {item.submitted}
            </Text>
            <Text style={[styles.tableCell, { color: item.pending > 0 ? '#f59e0b' : colors.text3 }]}>
              {item.pending}
            </Text>
            <View style={styles.tableCell}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <View style={[styles.tableCell, { flexDirection: 'row', gap: 8 }]}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => {
                  // Navigate to Rating Queue tab to rate targets
                  setActiveTab('rating');
                }}
              >
                <SvgIcon name="star" size={14} color="#fff" style={{}} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reminderButton}
                onPress={() => handleSendReminder(item.facultyId, item.facultyName)}
              >
                <SvgIcon name="bell" size={14} color={colors.accent} style={{}} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRatingTab = () => {
    if (secretaryQueue.length === 0) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <SvgIcon name="checkCircle" size={48} color={colors.text3} style={{}} />
            <Text style={styles.emptyText}>No targets awaiting rating</Text>
          </View>
        </View>
      );
    }

    // Group targets by faculty
    type FacultyGroup = {
      facultyName: string;
      facultyId: string;
      targets: any[];
      ipcr: any;
    };

    const groupedByFaculty = secretaryQueue.reduce((acc, item) => {
      const facultyId = item.ipcr.facultyId;
      if (!acc[facultyId]) {
        acc[facultyId] = {
          facultyName: item.ipcr.facultyName || 'Unknown Faculty',
          facultyId: facultyId,
          targets: [],
          ipcr: item.ipcr,
        };
      }
      acc[facultyId].targets.push(item);
      return acc;
    }, {} as Record<string, FacultyGroup>);

    const facultyGroups = Object.values(groupedByFaculty);

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Faculty Awaiting Rating</Text>
        <Text style={styles.sectionSubtitle}>
          Click on a faculty member to review and rate their targets
        </Text>

        {facultyGroups.map((group: FacultyGroup) => (
          <TouchableOpacity
            key={group.facultyId}
            style={styles.facultyRatingCard}
            onPress={() => {
              // Navigate to IPCRDetail screen for secretary rating
              navigation.navigate('IPCRDetail', { 
                id: group.ipcr.id,
                mode: 'secretary_rating' 
              });
            }}
          >
            {/* Faculty Info */}
            <View style={styles.facultyRatingHeader}>
              <View style={styles.facultyRatingLeft}>
                <View style={styles.facultyAvatar}>
                  <SvgIcon name="users" size={24} color="#fff" style={{}} />
                </View>
                <View style={styles.facultyRatingInfo}>
                  <Text style={styles.facultyRatingName}>{group.facultyName}</Text>
                  <Text style={styles.facultyRatingPeriod}>{group.ipcr.period}</Text>
                </View>
              </View>
              <SvgIcon name="arrowForward" size={20} color={colors.text3} style={{}} />
            </View>

            {/* Stats */}
            <View style={styles.facultyRatingStats}>
              <View style={styles.facultyRatingStat}>
                <Text style={styles.facultyRatingStatValue}>{group.targets.length}</Text>
                <Text style={styles.facultyRatingStatLabel}>Targets to Rate</Text>
              </View>
              <View style={styles.facultyRatingDivider} />
              <View style={styles.facultyRatingStat}>
                <Text style={styles.facultyRatingStatValue}>
                  {group.targets.filter(t => t.target.movFileUrls?.length > 0).length}
                </Text>
                <Text style={styles.facultyRatingStatLabel}>With Documents</Text>
              </View>
              <View style={styles.facultyRatingDivider} />
              <View style={styles.facultyRatingStat}>
                <Text style={[styles.facultyRatingStatValue, { color: '#f59e0b' }]}>
                  {group.targets.filter(t => t.target.isLate).length}
                </Text>
                <Text style={styles.facultyRatingStatLabel}>Late Submissions</Text>
              </View>
            </View>

            {/* Action Hint */}
            <View style={styles.facultyRatingAction}>
              <SvgIcon name="star" size={16} color={colors.accent} style={{}} />
              <Text style={styles.facultyRatingActionText}>Click to review and rate targets</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReturnedTab = () => (
    <View style={styles.tabContent}>
      {returnedTargets.length === 0 ? (
        <View style={styles.emptyState}>
          <SvgIcon name="checkCircle" size={48} color={colors.text3} style={{}} />
          <Text style={styles.emptyText}>No returned targets</Text>
        </View>
      ) : (
        returnedTargets.map(item => (
          <View key={item.target.id} style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <View style={styles.targetHeaderLeft}>
                <Text style={styles.facultyName}>{item.ipcr.facultyName}</Text>
                <Text style={styles.kraType}>{item.target.kraType} - {item.majorFunction.title}</Text>
              </View>
              <View style={[styles.statusBadge, styles.badgeRETURNED]}>
                <Text style={styles.statusBadgeText}>{item.target.status}</Text>
              </View>
            </View>

            <Text style={styles.targetDescription}>{item.target.description}</Text>

            {item.target.incompleteNote && (
              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Incomplete Reason:</Text>
                <Text style={styles.noteText}>{item.target.incompleteNote}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  // If not Secretary, show legacy Dean/Chair review interface
  if (!isSecretary) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
            </TouchableOpacity>
            <View style={styles.topbarTitle}>
              <Text style={styles.topbarTitleText}>Approval Queue</Text>
              <Text style={styles.topbarBreadcrumb}>
                {reviewIPCRs.length} IPCR{reviewIPCRs.length !== 1 ? 's' : ''} awaiting approval
              </Text>
            </View>
          </View>
        </View>

        <WebScrollView contentContainerStyle={styles.content}>
          {reviewIPCRs.length === 0 ? (
            <View style={styles.emptyState}>
              <SvgIcon name="checkCircle" size={48} color={colors.text3} style={{}} />
              <Text style={styles.emptyText}>No IPCRs awaiting approval</Text>
            </View>
          ) : (
            reviewIPCRs.map(ipcr => {
              const faculty = users.find(u => u.id === ipcr.facultyId);
              if (!faculty) return null;

              return (
                <TouchableOpacity
                  key={ipcr.id}
                  style={styles.ipcrCard}
                  onPress={() => navigation.navigate('IPCRDetail', { id: ipcr.id })}
                >
                  <Text style={styles.ipcrFacultyName}>{faculty.name}</Text>
                  <Text style={styles.ipcrPeriod}>{ipcr.period}</Text>
                  <Text style={styles.ipcrStatus}>Awaiting your review</Text>
                </TouchableOpacity>
              );
            })
          )}
        </WebScrollView>
      </View>
    );
  }

  const tabs = [
    { key: 'compliance' as TabType, label: 'Compliance', count: complianceData.length },
    { key: 'rating' as TabType, label: 'Rating Queue', count: secretaryQueue.length },
    { key: 'returned' as TabType, label: 'Returned', count: returnedTargets.length },
  ];

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
            <Text style={styles.topbarTitleText}>Rating Queue</Text>
            <Text style={styles.topbarBreadcrumb}>Secretary Review Interface</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tab => (
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

      <WebScrollView contentContainerStyle={styles.content}>
        {activeTab === 'compliance' && renderComplianceTab()}
        {activeTab === 'rating' && renderRatingTab()}
        {activeTab === 'returned' && renderReturnedTab()}
      </WebScrollView>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Target</Text>

            {selectedItem && (
              <View style={styles.modalTargetInfo}>
                <Text style={styles.modalTargetText}>{selectedItem.ipcr.facultyName}</Text>
                <Text style={styles.modalTargetDesc}>
                  {selectedItem.target.description.substring(0, 100)}...
                </Text>
                {selectedItem.target.selfRatingAvg && (
                  <Text style={styles.modalSelfRating}>
                    Faculty Self-Rating: {selectedItem.target.selfRatingAvg.toFixed(2)}
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
                  value={ratingInputs.q}
                  onChangeText={(text) => setRatingInputs(prev => ({ ...prev, q: text }))}
                  placeholder="5"
                />
              </View>
              <View style={styles.ratingInputGroup}>
                <Text style={styles.inputLabel}>Efficiency (E): 1-5</Text>
                <TextInput
                  style={styles.ratingInput}
                  keyboardType="numeric"
                  value={ratingInputs.e}
                  onChangeText={(text) => setRatingInputs(prev => ({ ...prev, e: text }))}
                  placeholder="5"
                />
              </View>
              <View style={styles.ratingInputGroup}>
                <Text style={styles.inputLabel}>Timeliness (T): 1-5</Text>
                <TextInput
                  style={styles.ratingInput}
                  keyboardType="numeric"
                  value={ratingInputs.t}
                  onChangeText={(text) => setRatingInputs(prev => ({ ...prev, t: text }))}
                  placeholder="5"
                />
              </View>
            </View>

            {ratingInputs.q && ratingInputs.e && ratingInputs.t && (
              <View style={styles.computedAvg}>
                <Text style={styles.computedAvgLabel}>Computed Average:</Text>
                <Text style={styles.computedAvgValue}>
                  {calculateA4(
                    parseFloat(ratingInputs.q) || 0,
                    parseFloat(ratingInputs.e) || 0,
                    parseFloat(ratingInputs.t) || 0
                  ).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.noteInputGroup}>
              <Text style={styles.inputLabel}>Note (for incomplete):</Text>
              <TextInput
                style={styles.noteInput}
                multiline
                numberOfLines={3}
                value={ratingInputs.note}
                onChangeText={(text) => setRatingInputs(prev => ({ ...prev, note: text }))}
                placeholder="Reason for marking incomplete..."
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.incompleteButton]}
                onPress={handleMarkIncomplete}
              >
                <Text style={styles.incompleteButtonText}>Mark Incomplete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.rateSubmitButton]}
                onPress={handleRateTarget}
              >
                <Text style={styles.rateSubmitButtonText}>Rate & Forward to Dean</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setRatingModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 32,
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
  badgeSUBMITTED: {
    backgroundColor: '#fef3c7',
  },
  badgeENDORSED: {
    backgroundColor: '#d1fae5',
  },
  badgeRETURNED: {
    backgroundColor: '#fee2e2',
  },
  badgeINCOMPLETE: {
    backgroundColor: '#fee2e2',
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
  viewButton: {
    padding: 8,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  fixButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.text3,
    marginBottom: 20,
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
  facultyGroup: {
    marginBottom: 24,
  },
  facultyGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  facultyGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  facultyGroupName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  facultyGroupBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  facultyGroupBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  targetNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  targetHeaderLeft: {
    flex: 1,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  kraType: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  targetDescription: {
    fontSize: 14,
    color: colors.text2,
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
  accomplishmentSection: {
    backgroundColor: colors.bg3,
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
  selfRatingSection: {
    marginBottom: 12,
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
    fontWeight: '700',
    color: colors.accent,
  },
  documentsSection: {
    marginBottom: 12,
  },
  rateButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noteSection: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: colors.text,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text3,
    marginTop: 16,
  },
  ipcrCard: {
    backgroundColor: colors.bg2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ipcrFacultyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  ipcrPeriod: {
    fontSize: 13,
    color: colors.text3,
    marginBottom: 8,
  },
  ipcrStatus: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
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
    padding: 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
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
  list: {
    gap: 16,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  btnApprove: {
    flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  btnApproveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnRevision: {
    flex: 1,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  btnRevisionText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '600',
  },
});
