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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

// Define all reportorial requirement folders
const REPORTORIAL_FOLDERS = [
  { id: 1, name: 'LETTER OF INTENT', icon: 'fileText', color: '#f4c430' },
  { id: 2, name: 'PERMIT TO TEACH', icon: 'fileText', color: '#88a050' },
  { id: 3, name: 'WORKLOAD SCHEDULE OF FACULTY', icon: 'calendar', color: '#5b8fc7' },
  { id: 4, name: 'APPROVED SYLLABUS', icon: 'book', color: '#e89850' },
  { id: 5, name: 'CLASS MONITORING CHECKLIST', icon: 'checkSquare', color: '#58987f' },
  { id: 6, name: 'COMPUTATION OF MIDTERM GRADES', icon: 'barChart', color: '#f4d03f' },
  { id: 7, name: 'LIST OF DROPPED STUDENT', icon: 'userX', color: '#d05050' },
  { id: 8, name: 'CLASS OBSERVATION', icon: 'eye', color: '#6ba3d8' },
  { id: 9, name: 'APPROVED TOS W/ Test Question & KEY to correction', icon: 'clipboardCheck', color: '#a8c070' },
  { id: 10, name: 'APPROVED RUBRIC OF ASSESSMENT W/ ATTACHED PROBLEM/ SAMPLE OUTPUT', icon: 'award', color: '#e6b422' },
  { id: 11, name: 'SIAS GRADE SHEET', icon: 'fileText', color: '#78b8a0' },
  { id: 12, name: 'LIST OF TOP TEN', icon: 'trendingUp', color: '#f4c430' },
  { id: 13, name: 'DELIQUENCY REPORT', icon: 'alertCircle', color: '#e07070' },
  { id: 14, name: 'DEAN\'S & PRESIDENT LIST', icon: 'star', color: '#f4d03f' },
  { id: 15, name: 'APPROVED CLASS RECORD', icon: 'book', color: '#88a050' },
];

export default function ReportorialRequirementsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/reportorial/folders');
      console.log('Reportorial API Response:', response.data);
      
      if (response.data.success) {
        // Map backend data to frontend format
        const mappedFolders = response.data.data.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          icon: folder.icon,
          color: folder.color,
          filesCount: folder.filesCount || 0,
        }));
        console.log('Mapped folders:', mappedFolders);
        setFolders(mappedFolders);
      } else {
        console.error('API returned success: false', response.data);
        setFolders([]);
      }
    } catch (error: any) {
      console.error('Failed to load folders:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load folders');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFolders();
    setRefreshing(false);
  };

  const handleFolderPress = (folder: typeof REPORTORIAL_FOLDERS[0]) => {
    router.push({
      pathname: '/reportorial-folder',
      params: { 
        folderId: folder.id,
        folderName: folder.name,
      }
    });
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text2 }]}>Loading folders...</Text>
      </View>
    );
  }

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
            <Text style={styles.topbarTitleText}>Reportorial Requirements</Text>
            <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal • Reportorial Requirements</Text>
          </View>
        </View>
        <View style={styles.topbarRight}>
          <TouchableOpacity 
            style={styles.topbarIconBtn}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <SvgIcon name={viewMode === 'grid' ? 'list' : 'grid'} size={22} color={colors.text2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SvgIcon name="search" size={20} color={colors.text3} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search folders..."
          placeholderTextColor={colors.text3}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <SvgIcon name="x" size={20} color={colors.text3} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <View style={styles.infoCard}>
            <SvgIcon name="folder" size={24} color={colors.accent} />
            <View style={styles.infoContent}>
              <Text style={styles.infoValue}>{filteredFolders.length}</Text>
              <Text style={styles.infoLabel}>Total Folders</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <SvgIcon name="fileText" size={24} color={colors.blue} />
            <View style={styles.infoContent}>
              <Text style={styles.infoValue}>
                {folders.reduce((sum, folder) => sum + (folder.filesCount || 0), 0)}
              </Text>
              <Text style={styles.infoLabel}>Total Files</Text>
            </View>
          </View>
        </View>

        {/* Folders Grid/List */}
        <View style={viewMode === 'grid' ? styles.foldersGrid : styles.foldersList}>
          {filteredFolders.length === 0 ? (
            <View style={styles.emptyState}>
              <SvgIcon name="search" size={48} color={colors.text3} />
              <Text style={styles.emptyTitle}>No folders found</Text>
              <Text style={styles.emptyText}>Try a different search term</Text>
            </View>
          ) : (
            filteredFolders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={viewMode === 'grid' ? styles.folderCard : styles.folderListItem}
                onPress={() => handleFolderPress(folder)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.folderIconContainer,
                  viewMode === 'list' && styles.folderIconSmall,
                  { backgroundColor: `${folder.color}20` }
                ]}>
                  <SvgIcon 
                    name={folder.icon as any} 
                    size={viewMode === 'grid' ? 32 : 24} 
                    color={folder.color} 
                  />
                </View>
                <View style={styles.folderInfo}>
                  <Text 
                    style={viewMode === 'grid' ? styles.folderName : styles.folderNameList}
                    numberOfLines={viewMode === 'grid' ? 2 : 1}
                  >
                    {folder.name}
                  </Text>
                  <View style={styles.folderMeta}>
                    <SvgIcon name="fileText" size={12} color={colors.text3} />
                    <Text style={styles.folderMetaText}>
                      {folder.filesCount || 0} {folder.filesCount === 1 ? 'file' : 'files'}
                    </Text>
                  </View>
                </View>
                {viewMode === 'list' && (
                  <SvgIcon name="chevronRight" size={20} color={colors.text3} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpCard}>
          <SvgIcon name="info" size={20} color={colors.accent} />
          <Text style={styles.helpText}>
            Click on any folder to view, upload, or manage files. Each folder corresponds to a specific reportorial requirement.
          </Text>
        </View>
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
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topbarIconBtn: {
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 24,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  foldersList: {
    gap: 12,
  },
  folderCard: {
    width: '48%',
    minWidth: 150,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  folderListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  folderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderIconSmall: {
    width: 48,
    height: 48,
  },
  folderInfo: {
    flex: 1,
    gap: 8,
  },
  folderName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  folderNameList: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  folderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  folderMetaText: {
    fontSize: 11,
    color: colors.text3,
    fontWeight: '600',
  },
  emptyState: {
    width: '100%',
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text3,
    textAlign: 'center',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bg3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: colors.text2,
    lineHeight: 20,
  },
});
