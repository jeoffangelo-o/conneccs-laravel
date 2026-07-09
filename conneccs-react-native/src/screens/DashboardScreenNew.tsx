import React, { useState, useMemo, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import { IpcrCard } from '../../components/IpcrCard';
import usersData from '../../assets/data/users.json';
import { User } from '../../types';
import { WebScrollView } from '../components/WebScrollView';
import { getNextDeadline, getDaysUntilDeadline, getTotalFacultyCount } from '../../utils/businessRules';
import { calculateFinalRating } from '../../utils/calculations';

type FilterType = 'All' | 'Completed' | 'In Progress' | 'Revision Required';

export default function DashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { 
    ipcrs, 
    generateIPCRForFaculty,
    getSecretaryQueue,
    getDeanQueue,
    getCoordinatorQueue,
    getComplianceDashboard,
  } = useData();
  const styles = createStyles(colors);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Dashboard focused - refreshing data');
      setRefreshKey(prev => prev + 1);
    }, [])
  );

  // Auto-generate IPCR for faculty on first login
  useEffect(() => {
    const autoGenerateIPCR = async () => {
      if (user && (user.role === 'FACULTY' || user.role === 'CHAIR' || user.role === 'SECRETARY' || user.role === 'COORDINATOR')) {
        setIsGenerating(true);
        try {
          const generatedIPCR = await generateIPCRForFaculty(user.id);
          if (generatedIPCR) {
            console.log('IPCR auto-generated for', user.name);
          }
        } catch (error) {
          console.error('Error generating IPCR:', error);
        } finally {
          setIsGenerating(false);
        }
      }
    };

    autoGenerateIPCR();
  }, [user?.id]);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        await logout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              await logout();
            },
          },
        ]
      );
    }
  };

  const users = usersData as User[];

  // Get deadline info
  const deadlineInfo = useMemo(() => {
    const { date, period } = getNextDeadline();
    const daysUntil = getDaysUntilDeadline(date);
    return { date, period, daysUntil };
  }, []);

  // Role-specific data
  const roleData = useMemo(() => {
    if (!user) return null;

    switch (user.role) {
      case 'FACULTY':
      case 'CHAIR':
        // Faculty dashboard data
        const myIPCR = ipcrs.find(i => i.facultyId === user.id);
        const returnedTargets = myIPCR?.majorFunctions.flatMap(mf =>
          mf.targets.filter(t => t.status === 'RETURNED')
        ) || [];
        
        return {
          type: 'FACULTY',
          myIPCR,
          returnedTargets,
          deadline: deadlineInfo,
        };

      case 'SECRETARY':
        // Secretary dashboard data
        const secretaryQueue = getSecretaryQueue();
        const complianceData = getComplianceDashboard();
        const overdueCount = complianceData.filter(f => f.overdue > 0).length;
        
        return {
          type: 'SECRETARY',
          queueCount: secretaryQueue.length,
          totalFaculty: complianceData.length,
          submittedCount: complianceData.filter(f => f.submitted === f.totalTargets).length,
          overdueCount,
          deadline: deadlineInfo,
        };

      case 'DEAN':
        // Dean dashboard data
        const deanQueue = getDeanQueue();
        const approvedIPCRs = ipcrs.filter(i => 
          i.overallStatus === 'APPROVED' || i.overallStatus === 'FINAL'
        );
        const avgRating = approvedIPCRs.length > 0
          ? approvedIPCRs.reduce((sum, i) => sum + (i.finalRating || 0), 0) / approvedIPCRs.length
          : 0;
        
        // Rating distribution
        const distribution = {
          outstanding: approvedIPCRs.filter(i => (i.finalRating || 0) >= 4.5).length,
          verySatisfactory: approvedIPCRs.filter(i => (i.finalRating || 0) >= 3.5 && (i.finalRating || 0) < 4.5).length,
          satisfactory: approvedIPCRs.filter(i => (i.finalRating || 0) >= 2.5 && (i.finalRating || 0) < 3.5).length,
          unsatisfactory: approvedIPCRs.filter(i => (i.finalRating || 0) < 2.5).length,
        };
        
        return {
          type: 'DEAN',
          queueCount: deanQueue.length,
          avgRating,
          approvedCount: approvedIPCRs.length,
          totalFaculty: getTotalFacultyCount(usersData as any[]),
          distribution,
        };

      case 'COORDINATOR':
        // Coordinator dashboard data
        const coordinatorType = user.coordinatorType || 'RESEARCH';
        const coordinatorQueue = getCoordinatorQueue(coordinatorType);
        const endorsedCount = coordinatorQueue.filter(i => i.target.status === 'ENDORSED').length;
        
        return {
          type: 'COORDINATOR',
          coordinatorType,
          queueCount: coordinatorQueue.length,
          endorsedCount,
        };

      default:
        return null;
    }
  }, [user, ipcrs, deadlineInfo]);

  // Filter IPCRs based on user role
  const visibleIPCRs = useMemo(() => {
    let filtered = ipcrs;
    
    // Role-based filtering
    if (user?.role === 'FACULTY' || user?.role === 'SECRETARY') {
      filtered = filtered.filter(ipcr => ipcr.facultyId === user.id);
    }
    
    // Status filtering
    if (activeFilter !== 'All') {
      if (activeFilter === 'Completed') {
        filtered = filtered.filter(ipcr => ipcr.status === 'COMPLETED');
      } else if (activeFilter === 'In Progress') {
        filtered = filtered.filter(ipcr => ipcr.status === 'IN_PROGRESS');
      } else if (activeFilter === 'Revision Required') {
        filtered = filtered.filter(ipcr => ipcr.status === 'REVISION_REQUIRED');
      }
    }
    
    return filtered;
  }, [ipcrs, user, activeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = visibleIPCRs.length;
    const completed = visibleIPCRs.filter(i => i.status === 'COMPLETED').length;
    const inProgress = visibleIPCRs.filter(i => i.status === 'IN_PROGRESS').length;
    const avgRating = visibleIPCRs
      .filter(i => i.finalRating !== null)
      .reduce((sum, i) => sum + (i.finalRating || 0), 0) / 
      (visibleIPCRs.filter(i => i.finalRating !== null).length || 1);

    return {
      total,
      completed,
      inProgress,
      avgRating: avgRating.toFixed(1),
    };
  }, [visibleIPCRs]);

  // Calculate progress based on user role
  const progressData = useMemo(() => {
    console.log('=== DASHBOARD PROGRESS CALCULATION ===');
    console.log('User:', user?.name, 'Role:', user?.role);
    console.log('Total IPCRs:', ipcrs.length);
    
    if (user?.role === 'FACULTY' || user?.role === 'CHAIR' || user?.role === 'SECRETARY') {
      // For faculty: show their own IPCR progress
      const myIPCR = ipcrs.find(ipcr => ipcr.facultyId === user.id);
      console.log('My IPCR found:', !!myIPCR);
      
      if (!myIPCR || !myIPCR.majorFunctions) {
        console.log('No IPCR or major functions');
        return { totalTargets: 0, ratedTargets: 0, percentage: 0 };
      }
      
      const totalTargets = myIPCR.majorFunctions.reduce((sum, mf) => sum + (mf.targets?.length || 0), 0);
      const ratedTargets = myIPCR.majorFunctions.reduce(
        (sum, mf) => sum + (mf.targets?.filter(t => (t.a4Rating && t.a4Rating > 0) || (t.selfRatingAvg && t.selfRatingAvg > 0)).length || 0),
        0
      );
      const percentage = totalTargets > 0 ? Math.round((ratedTargets / totalTargets) * 100) : 0;
      
      console.log('Total targets:', totalTargets);
      console.log('Rated targets:', ratedTargets);
      console.log('Percentage:', percentage);
      
      return { totalTargets, ratedTargets, percentage };
    } else {
      // For secretary/dean/admin: show overall faculty progress
      let totalTargets = 0;
      let ratedTargets = 0;
      
      ipcrs.forEach(ipcr => {
        if (ipcr.majorFunctions) {
          totalTargets += ipcr.majorFunctions.reduce((sum, mf) => sum + (mf.targets?.length || 0), 0);
          ratedTargets += ipcr.majorFunctions.reduce(
            (sum, mf) => sum + (mf.targets?.filter(t => (t.a4Rating && t.a4Rating > 0) || (t.selfRatingAvg && t.selfRatingAvg > 0)).length || 0),
            0
          );
        }
      });
      
      const percentage = totalTargets > 0 ? Math.round((ratedTargets / totalTargets) * 100) : 0;
      
      console.log('Overall - Total targets:', totalTargets);
      console.log('Overall - Rated targets:', ratedTargets);
      console.log('Overall - Percentage:', percentage);
      
      return { totalTargets, ratedTargets, percentage };
    }
  }, [ipcrs, user, refreshKey]);

  const filters: FilterType[] = ['All', 'Completed', 'In Progress', 'Revision Required'];

  // Render Faculty Dashboard
  const renderFacultyDashboard = () => {
    if (!roleData || roleData.type !== 'FACULTY') return null;

    const { myIPCR, returnedTargets, deadline } = roleData;
    
    // Use the progressData from useMemo instead of recalculating
    const { totalTargets, ratedTargets: completedTargets, percentage } = progressData;

    return (
      <>
        {/* Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SvgIcon name="target" size={24} color={colors.accent} style={{}} />
            <Text style={styles.cardTitle}>My IPCR Progress</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {completedTargets} of {totalTargets} targets completed
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
          </View>
          <Text style={styles.progressPercentage}>{percentage}%</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => navigation.navigate('MyIPCR')}
          >
            <Text style={styles.cardButtonText}>View My IPCR</Text>
            <SvgIcon name="arrowForward" size={16} color={colors.accent} style={{}} />
          </TouchableOpacity>
        </View>

        {/* Deadline Card */}
        <View style={[styles.card, deadline.daysUntil < 7 && styles.cardWarning]}>
          <View style={styles.cardHeader}>
            <SvgIcon name="clock" size={24} color={deadline.daysUntil < 7 ? '#ef4444' : colors.accent} style={{}} />
            <Text style={styles.cardTitle}>Upcoming Deadline</Text>
          </View>
          <Text style={styles.deadlineText}>
            {deadline.period} Submission: {deadline.date.toLocaleDateString()}
          </Text>
          <Text style={[styles.daysUntilText, deadline.daysUntil < 7 && styles.daysUntilWarning]}>
            {deadline.daysUntil} days remaining
          </Text>
        </View>

        {/* Returned Targets */}
        {returnedTargets.length > 0 && (
          <View style={[styles.card, styles.cardDanger]}>
            <View style={styles.cardHeader}>
              <SvgIcon name="alertCircle" size={24} color="#ef4444" style={{}} />
              <Text style={styles.cardTitle}>Returned Targets</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {returnedTargets.length} target(s) need revision
            </Text>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() => navigation.navigate('MyIPCR')}
            >
              <Text style={styles.cardButtonText}>Review & Resubmit</Text>
              <SvgIcon name="arrowForward" size={16} color="#ef4444" style={{}} />
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  // Render Secretary Dashboard
  const renderSecretaryDashboard = () => {
    if (!roleData || roleData.type !== 'SECRETARY') return null;

    const { queueCount, totalFaculty, submittedCount, overdueCount, deadline } = roleData;

    return (
      <>
        {/* Compliance Overview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SvgIcon name="users" size={24} color={colors.accent} style={{}} />
            <Text style={styles.cardTitle}>Compliance Overview</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{submittedCount}/{totalFaculty}</Text>
              <Text style={styles.statLabel}>Submitted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statWarning]}>{overdueCount}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => navigation.navigate('ReviewQueue')}
          >
            <Text style={styles.cardButtonText}>View Compliance Dashboard</Text>
            <SvgIcon name="arrowForward" size={16} color={colors.accent} style={{}} />
          </TouchableOpacity>
        </View>

        {/* Rating Queue */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SvgIcon name="star" size={24} color={colors.accent} style={{}} />
            <Text style={styles.cardTitle}>Rating Queue</Text>
          </View>
          <Text style={styles.queueCount}>{queueCount}</Text>
          <Text style={styles.cardSubtitle}>targets awaiting rating</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => navigation.navigate('ReviewQueue')}
          >
            <Text style={styles.cardButtonText}>Start Rating</Text>
            <SvgIcon name="arrowForward" size={16} color={colors.accent} style={{}} />
          </TouchableOpacity>
        </View>

        {/* Deadline Clock */}
        <View style={[styles.card, deadline.daysUntil < 7 && styles.cardWarning]}>
          <View style={styles.cardHeader}>
            <SvgIcon name="clock" size={24} color={deadline.daysUntil < 7 ? '#ef4444' : colors.accent} style={{}} />
            <Text style={styles.cardTitle}>Deadline Clock</Text>
          </View>
          <Text style={styles.deadlineText}>
            {deadline.period}: {deadline.date.toLocaleDateString()}
          </Text>
          <Text style={[styles.daysUntilText, deadline.daysUntil < 7 && styles.daysUntilWarning]}>
            {deadline.daysUntil} days remaining
          </Text>
        </View>
      </>
    );
  };

  // Render Dean Dashboard
  const renderDeanDashboard = () => {
    if (!roleData || roleData.type !== 'DEAN') return null;

    const { queueCount, avgRating, approvedCount, totalFaculty, distribution } = roleData;

    return (
      <>
        {/* Approval Queue */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SvgIcon name="checkCircle" size={24} color={colors.accent} style={{}} />
            <Text style={styles.cardTitle}>Approval Queue</Text>
          </View>
          <Text style={styles.queueCount}>{queueCount}</Text>
          <Text style={styles.cardSubtitle}>IPCRs awaiting review</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => navigation.navigate('ReviewQueue')}
          >
            <Text style={styles.cardButtonText}>Review IPCRs</Text>
            <SvgIcon name="arrowForward" size={16} color={colors.accent} style={{}} />
          </TouchableOpacity>
        </View>

        {/* Department Rating */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SvgIcon name="star" size={24} color="#f59e0b" style={{}} />
            <Text style={styles.cardTitle}>Department Rating</Text>
          </View>
          <Text style={styles.ratingValue}>{avgRating.toFixed(2)}</Text>
          <Text style={styles.cardSubtitle}>
            Average from {approvedCount} approved IPCRs
          </Text>
        </View>

        {/* Rating Distribution */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SvgIcon name="barChart" size={24} color={colors.accent} style={{}} />
            <Text style={styles.cardTitle}>Rating Distribution</Text>
          </View>
          <View style={styles.distributionList}>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(distribution.outstanding / approvedCount) * 100}%`, backgroundColor: '#10b981' }]} />
              <Text style={styles.distributionLabel}>Outstanding: {distribution.outstanding}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(distribution.verySatisfactory / approvedCount) * 100}%`, backgroundColor: '#3b82f6' }]} />
              <Text style={styles.distributionLabel}>Very Satisfactory: {distribution.verySatisfactory}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(distribution.satisfactory / approvedCount) * 100}%`, backgroundColor: '#f59e0b' }]} />
              <Text style={styles.distributionLabel}>Satisfactory: {distribution.satisfactory}</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { width: `${(distribution.unsatisfactory / approvedCount) * 100}%`, backgroundColor: '#ef4444' }]} />
              <Text style={styles.distributionLabel}>Unsatisfactory: {distribution.unsatisfactory}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => navigation.navigate('DeanOPCRConsolidation')}
          >
            <Text style={styles.cardButtonText}>View OPCR Consolidation</Text>
            <SvgIcon name="arrowForward" size={16} color={colors.accent} style={{}} />
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // Render Coordinator Dashboard
  const renderCoordinatorDashboard = () => {
    if (!roleData || roleData.type !== 'COORDINATOR') return null;

    const { coordinatorType, queueCount, endorsedCount } = roleData;

    return (
      <>
        {/* Verification Queue */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SvgIcon name="clipboard" size={24} color={colors.accent} style={{}} />
            <Text style={styles.cardTitle}>
              {coordinatorType === 'RESEARCH' ? 'Research' : 'Extension'} Verification Queue
            </Text>
          </View>
          <Text style={styles.queueCount}>{queueCount}</Text>
          <Text style={styles.cardSubtitle}>
            {coordinatorType === 'RESEARCH' ? 'KRA 2' : 'KRA 3'} targets awaiting verification
          </Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => navigation.navigate('CoordinatorQueue')}
          >
            <Text style={styles.cardButtonText}>Start Verification</Text>
            <SvgIcon name="arrowForward" size={16} color={colors.accent} style={{}} />
          </TouchableOpacity>
        </View>

        {/* Endorsed Count */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SvgIcon name="checkCircle" size={24} color="#10b981" style={{}} />
            <Text style={styles.cardTitle}>Recently Endorsed</Text>
          </View>
          <Text style={styles.queueCount}>{endorsedCount}</Text>
          <Text style={styles.cardSubtitle}>targets endorsed this period</Text>
        </View>
      </>
    );
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
            <Text style={styles.topbarTitleText}>Dashboard</Text>
            <Text style={styles.topbarBreadcrumb}>Target Monitoring & Management System</Text>
          </View>
        </View>
        <View style={styles.topbarRight}>
          {(user?.role === 'FACULTY' || user?.role === 'SECRETARY') && (
            <TouchableOpacity 
              style={styles.btnPrimary}
              onPress={() => navigation.navigate('CreateIPCR')}
            >
              <SvgIcon name="plus" size={18} color="#fff" style={{}} />
              <Text style={styles.btnPrimaryText}>New IPCR</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.topbarIconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <SvgIcon name="bell" size={22} color={colors.text2} style={{}} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <SvgIcon name="logOut" size={20} color={colors.text2} style={{}} />
          </TouchableOpacity>
        </View>
      </View>

      <WebScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Role-Specific Dashboard */}
        {user?.role === 'FACULTY' || user?.role === 'CHAIR' ? renderFacultyDashboard() : null}
        {user?.role === 'SECRETARY' ? renderSecretaryDashboard() : null}
        {user?.role === 'DEAN' ? renderDeanDashboard() : null}
        {user?.role === 'COORDINATOR' ? renderCoordinatorDashboard() : null}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {(user?.role === 'FACULTY' || user?.role === 'CHAIR' || user?.role === 'COORDINATOR') && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('MyIPCR')}
              >
                <SvgIcon name="document" size={32} color={colors.accent} style={{}} />
                <Text style={styles.actionText}>My IPCR</Text>
              </TouchableOpacity>
            )}
            {user?.role === 'SECRETARY' && (
              <>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('ReviewQueue')}
                >
                  <SvgIcon name="star" size={32} color={colors.accent} style={{}} />
                  <Text style={styles.actionText}>Rating Queue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('SecretaryOPCRUpload')}
                >
                  <SvgIcon name="upload" size={32} color={colors.accent} style={{}} />
                  <Text style={styles.actionText}>Upload OPCR</Text>
                </TouchableOpacity>
              </>
            )}
            {user?.role === 'DEAN' && (
              <>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('ReviewQueue')}
                >
                  <SvgIcon name="checkCircle" size={32} color={colors.accent} style={{}} />
                  <Text style={styles.actionText}>Approval Queue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('DeanOPCRConsolidation')}
                >
                  <SvgIcon name="barChart" size={32} color={colors.accent} style={{}} />
                  <Text style={styles.actionText}>OPCR Report</Text>
                </TouchableOpacity>
              </>
            )}
            {user?.role === 'COORDINATOR' && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('CoordinatorQueue')}
              >
                <SvgIcon name="clipboard" size={32} color={colors.accent} style={{}} />
                <Text style={styles.actionText}>Verification Queue</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Calendar')}
            >
              <SvgIcon name="calendar" size={32} color={colors.accent} style={{}} />
              <Text style={styles.actionText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Notifications')}
            >
              <SvgIcon name="bell" size={32} color={colors.accent} style={{}} />
              <Text style={styles.actionText}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      </WebScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
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
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  topbarIconBtn: {
    position: 'relative',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Dashboard Cards
  card: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  cardWarning: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  cardDanger: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.text3,
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'right',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  deadlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  daysUntilText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
  },
  daysUntilWarning: {
    color: '#ef4444',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statWarning: {
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text3,
  },
  queueCount: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#f59e0b',
    marginBottom: 8,
  },
  distributionList: {
    gap: 12,
    marginBottom: 12,
  },
  distributionItem: {
    position: 'relative',
  },
  distributionBar: {
    height: 24,
    borderRadius: 4,
    marginBottom: 4,
  },
  distributionLabel: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 4,
  },
  // Quick Actions
  quickActions: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
