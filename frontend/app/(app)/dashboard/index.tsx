import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useData } from '../../../context/DataContext';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { fetchDashboardData } = useData();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIPCRs: 0,
    pendingIPCRs: 0,
    approvedIPCRs: 0,
    completionRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardData();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const StatCard = ({ icon, title, value, color, onPress }: any) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.bg2, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={32} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.text2 }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({ icon, title, onPress }: any) => (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: colors.bg2, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={colors.accent} />
      <Text style={[styles.actionText, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Welcome back, {user?.firstName}!
        </Text>
        <Text style={[styles.subtitle, { color: colors.text2 }]}>
          Here's your performance overview
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon="file-document-multiple"
          title="Total IPCRs"
          value={stats.totalIPCRs}
          color={colors.accent}
          onPress={() => router.push('/my-ipcr')}
        />
        <StatCard
          icon="clock-outline"
          title="Pending"
          value={stats.pendingIPCRs}
          color={colors.orange}
          onPress={() => router.push('/my-ipcr')}
        />
        <StatCard
          icon="check-circle"
          title="Approved"
          value={stats.approvedIPCRs}
          color={colors.green}
          onPress={() => router.push('/my-ipcr')}
        />
        <StatCard
          icon="chart-arc"
          title="Completion"
          value={`${stats.completionRate}%`}
          color={colors.teal}
          onPress={() => router.push('/my-ipcr')}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        <QuickAction
          icon="add-circle"
          title="Create IPCR"
          onPress={() => router.push('/create-ipcr')}
        />
        <QuickAction
          icon="document-text"
          title="View OPCR"
          onPress={() => router.push('/opcr')}
        />
        <QuickAction
          icon="calendar"
          title="Calendar"
          onPress={() => router.push('/calendar')}
        />
        <QuickAction
          icon="chatbubbles"
          title="Messages"
          onPress={() => router.push('/messages')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 48,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  statCard: {
    width: isWeb ? '23%' : '47%',
    margin: '1.5%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 100,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingBottom: 32,
  },
  actionCard: {
    width: isWeb ? '23%' : '47%',
    margin: '1.5%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
