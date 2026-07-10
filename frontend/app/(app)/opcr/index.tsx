import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

export default function OPCRScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opcr, setOpcr] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'STRATEGIC' | 'CORE' | 'SUPPORT'>('ALL');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    loadOPCR();
  }, []);

  const loadOPCR = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/opcr');
      setOpcr(response.data);
    } catch (error) {
      console.error('Failed to load OPCR:', error);
      setOpcr(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOPCR();
    setRefreshing(false);
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'STRATEGIC':
        return colors.red;
      case 'CORE':
        return colors.yellow;
      case 'SUPPORT':
        return colors.teal;
      default:
        return colors.text3;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text2 }]}>Loading OPCR...</Text>
      </View>
    );
  }

  if (!opcr) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <SvgIcon name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.topbarTitle}>
              <Text style={styles.topbarTitleText}>OPCR</Text>
              <Text style={styles.topbarBreadcrumb}>Office Performance Commitment Review</Text>
            </View>
          </View>
        </View>

        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <SvgIcon name="clipboard" size={48} color={colors.text3} />
          </View>
          <Text style={styles.emptyTitle}>No OPCR Available</Text>
          <Text style={styles.emptyText}>
            The OPCR will be available once the secretary uploads it.
          </Text>
        </View>
      </View>
    );
  }

  const filteredFunctions = selectedCategory === 'ALL'
    ? opcr.majorFunctions
    : opcr.majorFunctions?.filter((mf: any) => mf.category === selectedCategory);

  const categories = ['ALL', 'STRATEGIC', 'CORE', 'SUPPORT'];

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
            <Text style={styles.topbarTitleText}>OPCR</Text>
            <Text style={styles.topbarBreadcrumb}>Office Performance Commitment Review</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.topbarIconBtn}>
          <SvgIcon name="bell" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterButton, selectedCategory === cat && styles.filterButtonActive]}
              onPress={() => setSelectedCategory(cat as any)}
            >
              <Text style={[styles.filterButtonText, selectedCategory === cat && styles.filterButtonTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* OPCR Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{opcr.title || 'CCS Office Performance Commitment Review'}</Text>
          <Text style={styles.headerPeriod}>{opcr.period || 'Academic Year 2026'}</Text>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{opcr.majorFunctions?.length || 0}</Text>
              <Text style={styles.statLabel}>Major Functions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {opcr.majorFunctions?.reduce((sum: number, mf: any) => sum + (mf.successIndicators?.length || 0), 0) || 0}
              </Text>
              <Text style={styles.statLabel}>Success Indicators</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{opcr.status || 'ACTIVE'}</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
        </View>

        {/* Major Functions */}
        {filteredFunctions?.map((mf: any) => (
          <View key={mf.id} style={styles.functionCard}>
            <TouchableOpacity
              style={styles.functionHeader}
              onPress={() => toggleSection(mf.id)}
            >
              <View style={styles.functionHeaderLeft}>
                <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(mf.category)}20` }]}>
                  <Text style={[styles.categoryText, { color: getCategoryColor(mf.category) }]}>
                    {mf.category}
                  </Text>
                </View>
                <View style={styles.functionTitleContainer}>
                  <Text style={styles.functionTitle}>{mf.title}</Text>
                  <Text style={styles.functionWeight}>Weight: {(mf.weight * 100)}%</Text>
                </View>
              </View>
              <SvgIcon
                name={expandedSections.includes(mf.id) ? 'chevronDown' : 'chevronRight'}
                size={20}
                color={colors.text3}
              />
            </TouchableOpacity>

            {expandedSections.includes(mf.id) && (
              <View style={styles.indicatorsContainer}>
                {mf.successIndicators?.map((si: any, index: number) => (
                  <View key={si.id || index} style={styles.indicatorCard}>
                    <View style={styles.indicatorHeader}>
                      <View style={styles.indicatorCode}>
                        <Text style={styles.indicatorCodeText}>{si.code || `SI-${index + 1}`}</Text>
                      </View>
                    </View>
                    <Text style={styles.indicatorDescription}>{si.description}</Text>
                    <View style={styles.indicatorMeta}>
                      <View style={styles.metaRow}>
                        <SvgIcon name="clipboard" size={14} color={colors.text3} />
                        <Text style={styles.metaText}>Target: {si.targetValue || 'N/A'}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <SvgIcon name="calendar" size={14} color={colors.text3} />
                        <Text style={styles.metaText}>{si.timeline || 'Ongoing'}</Text>
                      </View>
                    </View>
                    {si.accountableUnits && (
                      <View style={styles.accountableSection}>
                        <Text style={styles.accountableLabel}>Accountable:</Text>
                        <Text style={styles.accountableText}>{si.accountableUnits}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
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
  filterContainer: {
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
  },
  filterButtonTextActive: {
    color: '#fff',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  headerPeriod: {
    fontSize: 14,
    color: colors.text3,
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text3,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
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
  functionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  functionTitleContainer: {
    flex: 1,
  },
  functionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  functionWeight: {
    fontSize: 12,
    color: colors.text3,
  },
  indicatorsContainer: {
    padding: 16,
  },
  indicatorCard: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorCode: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  indicatorCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  indicatorDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  indicatorMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.text3,
  },
  accountableSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  accountableLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  accountableText: {
    fontSize: 12,
    color: colors.text2,
    lineHeight: 18,
  },
});
