import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

export default function MyIPCRScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ipcr, setIpcr] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [ratingInputs, setRatingInputs] = useState({ q: '', e: '', t: '', accomplishments: '' });

  useEffect(() => {
    loadIPCR();
  }, []);

  const loadIPCR = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/ipcrs/my');
      setIpcr(response.data);
    } catch (error) {
      console.error('Failed to load IPCR:', error);
      setIpcr(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIPCR();
    setRefreshing(false);
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleEditRating = (target: any) => {
    setEditingTarget(target.id);
    setRatingInputs({
      q: target.q1Rating?.toString() || '',
      e: target.e2Rating?.toString() || '',
      t: target.t3Rating?.toString() || '',
      accomplishments: target.actualAccomplishments || '',
    });
  };

  const handleSaveRating = async (targetId: string) => {
    const q = parseFloat(ratingInputs.q);
    const e = parseFloat(ratingInputs.e);
    const t = parseFloat(ratingInputs.t);

    if (isNaN(q) || q < 1 || q > 5 || isNaN(e) || e < 1 || e > 5 || isNaN(t) || t < 1 || t > 5) {
      alert('Ratings must be between 1 and 5');
      return;
    }

    try {
      await apiService.post(`/ipcrs/${ipcr.id}/targets/${targetId}/rate`, {
        q1Rating: q,
        e2Rating: e,
        t3Rating: t,
        actualAccomplishments: ratingInputs.accomplishments,
      });
      setEditingTarget(null);
      await loadIPCR();
      alert('Rating saved successfully!');
    } catch (error) {
      console.error('Failed to save rating:', error);
      alert('Failed to save rating');
    }
  };

  const handleSubmitIPCR = async () => {
    if (!ipcr) return;
    
    if (confirm('Are you sure you want to submit your IPCR for review?')) {
      try {
        await apiService.post(`/ipcrs/${ipcr.id}/submit`);
        await loadIPCR();
        alert('IPCR submitted successfully!');
      } catch (error) {
        console.error('Failed to submit IPCR:', error);
        alert('Failed to submit IPCR');
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text2 }]}>Loading your IPCR...</Text>
      </View>
    );
  }

  if (!ipcr) {
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
              <Text style={styles.topbarTitleText}>My IPCR</Text>
              <Text style={styles.topbarBreadcrumb}>Individual Performance Commitment Review</Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <SvgIcon name="fileText" size={48} color={colors.text3} />
          </View>
          <Text style={styles.emptyTitle}>No IPCR Found</Text>
          <Text style={styles.emptyText}>
            Your IPCR will be automatically generated when the secretary uploads the OPCR.
          </Text>
        </View>
      </View>
    );
  }

  const totalTargets = ipcr.majorFunctions?.reduce((sum: number, mf: any) => sum + (mf.targets?.length || 0), 0) || 0;
  const ratedTargets = ipcr.majorFunctions?.reduce(
    (sum: number, mf: any) => sum + (mf.targets?.filter((t: any) => t.a4Rating && t.a4Rating > 0).length || 0),
    0
  ) || 0;
  const completionPercent = totalTargets > 0 ? Math.round((ratedTargets / totalTargets) * 100) : 0;

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
            <Text style={styles.topbarTitleText}>My IPCR</Text>
            <Text style={styles.topbarBreadcrumb}>Individual Performance Commitment Review</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.topbarIconBtn}>
          <SvgIcon name="bell" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0] || user?.lastName?.[0] || '?'}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{ipcr.facultyName || user?.name}</Text>
              <Text style={styles.headerPeriod}>{ipcr.period}</Text>
              <View style={[styles.statusBadge, getStatusStyle(ipcr.status)]}>
                <Text style={styles.statusText}>{ipcr.status}</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Completion Progress</Text>
              <Text style={styles.progressValue}>{ratedTargets}/{totalTargets} targets</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{completionPercent}% Complete</Text>
          </View>
        </View>

        {/* Major Functions */}
        {ipcr.majorFunctions?.map((mf: any) => (
          <View key={mf.id} style={styles.functionCard}>
            <TouchableOpacity
              style={styles.functionHeader}
              onPress={() => toggleSection(mf.id)}
            >
              <View style={styles.functionTitleRow}>
                <View style={[styles.categoryBadge, getCategoryStyle(mf.category)]}>
                  <Text style={styles.categoryText}>{mf.category}</Text>
                </View>
                <Text style={styles.functionTitle}>{mf.title}</Text>
              </View>
              <SvgIcon
                name={expandedSections.includes(mf.id) ? 'chevronDown' : 'chevronRight'}
                size={20}
                color={colors.text3}
              />
            </TouchableOpacity>

            {expandedSections.includes(mf.id) && (
              <View style={styles.targetsContainer}>
                {mf.targets?.map((target: any) => (
                  <View key={target.id} style={styles.targetCard}>
                    <Text style={styles.targetDescription}>{target.description}</Text>
                    
                    {editingTarget === target.id ? (
                      <View style={styles.ratingForm}>
                        <View style={styles.ratingRow}>
                          <View style={styles.ratingInput}>
                            <Text style={styles.ratingLabel}>Quality (Q)</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={ratingInputs.q}
                              onChangeText={(text) => setRatingInputs({ ...ratingInputs, q: text })}
                              placeholder="1-5"
                              placeholderTextColor={colors.text3}
                            />
                          </View>
                          <View style={styles.ratingInput}>
                            <Text style={styles.ratingLabel}>Efficiency (E)</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={ratingInputs.e}
                              onChangeText={(text) => setRatingInputs({ ...ratingInputs, e: text })}
                              placeholder="1-5"
                              placeholderTextColor={colors.text3}
                            />
                          </View>
                          <View style={styles.ratingInput}>
                            <Text style={styles.ratingLabel}>Timeliness (T)</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={ratingInputs.t}
                              onChangeText={(text) => setRatingInputs({ ...ratingInputs, t: text })}
                              placeholder="1-5"
                              placeholderTextColor={colors.text3}
                            />
                          </View>
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={styles.ratingLabel}>Accomplishments</Text>
                          <TextInput
                            style={styles.textarea}
                            multiline
                            numberOfLines={4}
                            value={ratingInputs.accomplishments}
                            onChangeText={(text) => setRatingInputs({ ...ratingInputs, accomplishments: text })}
                            placeholder="Describe what you accomplished..."
                            placeholderTextColor={colors.text3}
                          />
                        </View>
                        <View style={styles.ratingActions}>
                          <TouchableOpacity
                            style={styles.btnCancel}
                            onPress={() => setEditingTarget(null)}
                          >
                            <Text style={styles.btnCancelText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnSave}
                            onPress={() => handleSaveRating(target.id)}
                          >
                            <SvgIcon name="checkCircle" size={18} color="#fff" />
                            <Text style={styles.btnSaveText}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.targetInfo}>
                        {target.a4Rating ? (
                          <View style={styles.ratingDisplay}>
                            <Text style={styles.ratingDisplayLabel}>Rating:</Text>
                            <Text style={styles.ratingDisplayValue}>
                              Q: {target.q1Rating || '-'} | E: {target.e2Rating || '-'} | T: {target.t3Rating || '-'} | Avg: {target.a4Rating?.toFixed(2)}
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.btnRate}
                            onPress={() => handleEditRating(target)}
                          >
                            <SvgIcon name="pulse" size={16} color={colors.accent} />
                            <Text style={styles.btnRateText}>Rate Target</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Submit Button */}
        {completionPercent === 100 && ipcr.status === 'IN_PROGRESS' && (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitIPCR}>
            <SvgIcon name="checkCircle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Submit IPCR for Review</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function getStatusStyle(status: string) {
  const statusStyles: any = {
    'IN_PROGRESS': { backgroundColor: 'rgba(234,179,8,0.15)' },
    'SUBMITTED': { backgroundColor: 'rgba(59,130,246,0.15)' },
    'APPROVED': { backgroundColor: 'rgba(34,197,94,0.15)' },
    'COMPLETED': { backgroundColor: 'rgba(34,197,94,0.15)' },
  };
  return statusStyles[status] || statusStyles['IN_PROGRESS'];
}

function getCategoryStyle(category: string) {
  const categoryStyles: any = {
    'STRATEGIC': { backgroundColor: 'rgba(244,63,94,0.15)' },
    'CORE': { backgroundColor: 'rgba(244,196,48,0.15)' },
    'SUPPORT': { backgroundColor: 'rgba(45,212,191,0.15)' },
  };
  return categoryStyles[category] || categoryStyles['CORE'];
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
  topbarIconBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.bg2,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text3,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerPeriod: {
    fontSize: 14,
    color: colors.text3,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  progressSection: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text3,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.accent,
  },
  progressPercent: {
    fontSize: 12,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 8,
  },
  functionCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  functionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  functionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'uppercase',
  },
  functionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  targetsContainer: {
    padding: 16,
  },
  targetCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  targetDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  targetInfo: {
    marginTop: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingDisplayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
  },
  ratingDisplayValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  btnRate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnRateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  ratingForm: {
    marginTop: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  ratingInput: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 12,
  },
  textarea: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ratingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
  },
  btnSave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.green,
    paddingVertical: 10,
    borderRadius: 6,
  },
  btnSaveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
