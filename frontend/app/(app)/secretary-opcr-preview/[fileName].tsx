import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.15:8000';

interface PageData {
  page: number;
  text: string;
  length: number;
  has_table: boolean;
  line_count: number;
}

interface PreviewData {
  file_name: string;
  metadata: any;
  raw_text: string;
  pages: PageData[];
  statistics: {
    total_pages: number;
    total_characters: number;
    pages_with_tables: number;
    total_lines: number;
  };
}

export default function OPCRPreviewScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { fileName } = useLocalSearchParams<{ fileName: string }>();
  const { user, token } = useAuth();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = createStyles(colors, isMobile);

  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [viewMode, setViewMode] = useState<'pages' | 'full'>('pages');

  useEffect(() => {
    fetchPreview();
  }, [fileName]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/opcr/preview/${fileName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setPreviewData(response.data.data);
        if (response.data.data.pages.length > 0) {
          setEditedText(response.data.data.pages[0].text);
        }
      }
    } catch (error: any) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (!previewData) return;
    if (page < 1 || page > previewData.pages.length) return;
    
    setCurrentPage(page);
    setEditedText(previewData.pages[page - 1].text);
    setEditMode(false);
  };

  const getCurrentPageData = (): PageData | null => {
    if (!previewData || !previewData.pages) return null;
    return previewData.pages[currentPage - 1] || null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading preview...</Text>
        </View>
      </View>
    );
  }

  if (!previewData) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <SvgIcon name="alertCircle" size={48} color={colors.red} />
          <Text style={styles.errorText}>Failed to load preview</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentPageData = getCurrentPageData();

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <SvgIcon name="arrowLeft" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>OPCR Preview</Text>
            <Text style={styles.topbarBreadcrumb}>{fileName}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Extraction Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <SvgIcon name="fileText" size={20} color={colors.accent} />
              <Text style={styles.statValue}>{previewData.statistics.total_pages}</Text>
              <Text style={styles.statLabel}>Pages</Text>
            </View>
            <View style={styles.statItem}>
              <SvgIcon name="type" size={20} color={colors.accent} />
              <Text style={styles.statValue}>{previewData.statistics.total_characters.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Characters</Text>
            </View>
            <View style={styles.statItem}>
              <SvgIcon name="grid" size={20} color={colors.accent} />
              <Text style={styles.statValue}>{previewData.statistics.pages_with_tables}</Text>
              <Text style={styles.statLabel}>Tables</Text>
            </View>
            <View style={styles.statItem}>
              <SvgIcon name="list" size={20} color={colors.accent} />
              <Text style={styles.statValue}>{previewData.statistics.total_lines.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Lines</Text>
            </View>
          </View>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'pages' && styles.toggleButtonActive]}
            onPress={() => setViewMode('pages')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'pages' && styles.toggleButtonTextActive]}>
              Page by Page
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'full' && styles.toggleButtonActive]}
            onPress={() => setViewMode('full')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'full' && styles.toggleButtonTextActive]}>
              Full Text
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'pages' ? (
          <>
            {/* Page Navigation */}
            <View style={styles.pageNav}>
              <TouchableOpacity
                style={[styles.navButton, currentPage === 1 && styles.navButtonDisabled]}
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <SvgIcon name="chevronLeft" size={20} color={currentPage === 1 ? colors.text3 : colors.text} />
              </TouchableOpacity>
              
              <View style={styles.pageInfo}>
                <Text style={styles.pageText}>
                  Page {currentPage} of {previewData.pages.length}
                </Text>
                {currentPageData?.has_table && (
                  <View style={styles.tableBadge}>
                    <SvgIcon name="grid" size={12} color={colors.accent} />
                    <Text style={styles.tableBadgeText}>Contains Table</Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={[styles.navButton, currentPage === previewData.pages.length && styles.navButtonDisabled]}
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === previewData.pages.length}
              >
                <SvgIcon name="chevronRight" size={20} color={currentPage === previewData.pages.length ? colors.text3 : colors.text} />
              </TouchableOpacity>
            </View>

            {/* Text Preview/Edit */}
            <View style={styles.textCard}>
              <View style={styles.textCardHeader}>
                <Text style={styles.textCardTitle}>Extracted Text</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditMode(!editMode)}
                >
                  <SvgIcon name={editMode ? 'check' : 'edit2'} size={18} color={colors.accent} />
                  <Text style={styles.editButtonText}>{editMode ? 'Save' : 'Edit'}</Text>
                </TouchableOpacity>
              </View>
              
              {editMode ? (
                <TextInput
                  style={styles.textInput}
                  value={editedText}
                  onChangeText={setEditedText}
                  multiline
                  textAlignVertical="top"
                />
              ) : (
                <ScrollView style={styles.textPreview} nestedScrollEnabled>
                  <Text style={styles.textContent}>{currentPageData?.text}</Text>
                </ScrollView>
              )}
              
              <View style={styles.textCardFooter}>
                <Text style={styles.textStats}>
                  {currentPageData?.length} characters • {currentPageData?.line_count} lines
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.textCard}>
            <View style={styles.textCardHeader}>
              <Text style={styles.textCardTitle}>Full Extracted Text</Text>
            </View>
            <ScrollView style={styles.textPreview} nestedScrollEnabled>
              <Text style={styles.textContent}>{previewData.raw_text}</Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isMobile: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topbar: {
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: isMobile ? 16 : 24,
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.text2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.accent,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: colors.bg2,
    margin: isMobile ? 16 : 24,
    padding: isMobile ? 16 : 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: isMobile ? '45%' : '22%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.bg3,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text2,
    marginTop: 4,
  },
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: isMobile ? 16 : 24,
    marginBottom: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.bg2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  toggleButtonText: {
    fontSize: 14,
    color: colors.text2,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: isMobile ? 16 : 24,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.bg2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  pageInfo: {
    flex: 1,
    alignItems: 'center',
  },
  pageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.accent + '20',
    borderRadius: 12,
  },
  tableBadgeText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '500',
  },
  textCard: {
    backgroundColor: colors.bg2,
    margin: isMobile ? 16 : 24,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 600,
  },
  textCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  textCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bg3,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
  textPreview: {
    flex: 1,
    padding: 16,
  },
  textContent: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  textCardFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textStats: {
    fontSize: 11,
    color: colors.text3,
    textAlign: 'center',
  },
});
