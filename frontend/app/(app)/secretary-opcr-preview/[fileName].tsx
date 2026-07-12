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
  const [viewMode, setViewMode] = useState<'pages' | 'full' | 'parsed'>('pages');
  const [parsedData, setParsedData] = useState<any>(null);
  const [loadingParsed, setLoadingParsed] = useState(false);
  const [showAllTargets, setShowAllTargets] = useState(false);

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

  const fetchParsedData = async () => {
    try {
      setLoadingParsed(true);
      console.log('Fetching parsed data for:', fileName);
      
      const response = await axios.get(`${API_URL}/api/opcr/parse/${fileName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Parse response:', response.data);

      if (response.data.success) {
        setParsedData(response.data.data);
      } else {
        console.error('Parse failed:', response.data);
      }
    } catch (error: any) {
      console.error('Error fetching parsed data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setLoadingParsed(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'parsed' && !parsedData) {
      fetchParsedData();
    }
  }, [viewMode]);

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
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'parsed' && styles.toggleButtonActive]}
            onPress={() => setViewMode('parsed')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'parsed' && styles.toggleButtonTextActive]}>
              Parsed Data
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'parsed' ? (
          loadingParsed ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Parsing OPCR...</Text>
            </View>
          ) : parsedData ? (
            <View style={styles.parsedContainer}>
              {/* Debug Info */}
              {parsedData.debug && (
                <View style={styles.parsedCard}>
                  <Text style={styles.parsedCardTitle}>Debug Information</Text>
                  
                  {/* Parser Info */}
                  {parsedData.parser_used && (
                    <View style={[styles.parsedRow, { 
                      backgroundColor: parsedData.parser_used === 'ocr' ? colors.green + '20' : colors.orange + '20',
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 12
                    }]}>
                      <Text style={styles.parsedLabel}>Parser Used:</Text>
                      <Text style={[styles.parsedValue, {
                        color: parsedData.parser_used === 'ocr' ? colors.green : colors.orange,
                        fontWeight: '700'
                      }]}>
                        {parsedData.parser_name || parsedData.parser_used.toUpperCase()}
                        {parsedData.parser_used === 'ocr' ? ' ✓' : ' (Fallback)'}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.parsedRow}>
                    <Text style={styles.parsedLabel}>Raw Text Length:</Text>
                    <Text style={styles.parsedValue}>{parsedData.debug.raw_text_length}</Text>
                  </View>
                  <View style={styles.parsedRow}>
                    <Text style={styles.parsedLabel}>Total Pages:</Text>
                    <Text style={styles.parsedValue}>{parsedData.debug.total_pages}</Text>
                  </View>
                  {parsedData.debug.first_100_lines && (
                    <View style={styles.debugTextContainer}>
                      <Text style={styles.debugLabel}>First 100 Lines of Extracted Text:</Text>
                      <ScrollView style={styles.debugTextScroll} nestedScrollEnabled>
                        {parsedData.debug.first_100_lines.map((line: string, index: number) => (
                          <Text key={index} style={styles.debugLine}>
                            {index + 1}: {line}
                          </Text>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Period and College */}
              <View style={styles.parsedCard}>
                <Text style={styles.parsedCardTitle}>OPCR Information</Text>
                <View style={styles.parsedRow}>
                  <Text style={styles.parsedLabel}>Period:</Text>
                  <Text style={styles.parsedValue}>{parsedData.period}</Text>
                </View>
                <View style={styles.parsedRow}>
                  <Text style={styles.parsedLabel}>College:</Text>
                  <Text style={styles.parsedValue}>{parsedData.college}</Text>
                </View>
                <View style={styles.parsedRow}>
                  <Text style={styles.parsedLabel}>Total MFOs:</Text>
                  <Text style={styles.parsedValue}>{parsedData.statistics.total_mfos}</Text>
                </View>
                {parsedData.statistics.strategic_count !== undefined && (
                  <>
                    <View style={styles.parsedRow}>
                      <Text style={styles.parsedLabel}>• Strategic:</Text>
                      <Text style={styles.parsedValue}>{parsedData.statistics.strategic_count}</Text>
                    </View>
                    <View style={styles.parsedRow}>
                      <Text style={styles.parsedLabel}>• Core:</Text>
                      <Text style={styles.parsedValue}>{parsedData.statistics.core_count}</Text>
                    </View>
                    <View style={styles.parsedRow}>
                      <Text style={styles.parsedLabel}>• Support:</Text>
                      <Text style={styles.parsedValue}>{parsedData.statistics.support_count}</Text>
                    </View>
                  </>
                )}
                <View style={styles.parsedRow}>
                  <Text style={styles.parsedLabel}>Total Targets:</Text>
                  <Text style={styles.parsedValue}>{parsedData.statistics.total_targets}</Text>
                </View>
              </View>

              {/* MFOs/PAPs by Type */}
              {parsedData.mfos_by_type && (
                <>
                  {/* Strategic Functions */}
                  {parsedData.mfos_by_type.Strategic && parsedData.mfos_by_type.Strategic.length > 0 && (
                    <View style={styles.parsedCard}>
                      <View style={styles.functionTypeHeader}>
                        <Text style={[styles.parsedCardTitle, { color: colors.accent }]}>
                          A. STRATEGIC FUNCTIONS
                        </Text>
                        <Text style={styles.functionCount}>
                          {parsedData.mfos_by_type.Strategic.length} MFO(s)
                        </Text>
                      </View>
                      {parsedData.mfos_by_type.Strategic.map((mfo: any, index: number) => (
                        <View key={index} style={styles.mfoItem}>
                          <View style={styles.mfoHeader}>
                            <Text style={styles.mfoCode}>{mfo.code}</Text>
                            <Text style={styles.mfoDescription}>{mfo.mfo}</Text>
                          </View>
                          {mfo.target_count > 0 && (
                            <Text style={styles.mfoTargetCount}>
                              {mfo.target_count} target(s)
                            </Text>
                          )}
                          {mfo.targets && mfo.targets.length > 0 && (
                            <View style={styles.mfoTargets}>
                              {mfo.targets.slice(0, 3).map((target: any, tIndex: number) => (
                                <View key={tIndex} style={styles.miniTargetItem}>
                                  <Text style={styles.miniTargetCode}>{target.code}</Text>
                                  <Text style={styles.miniTargetText} numberOfLines={2}>
                                    {target.description}
                                  </Text>
                                </View>
                              ))}
                              {mfo.targets.length > 3 && (
                                <Text style={styles.moreTargetsText}>
                                  ... and {mfo.targets.length - 3} more
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Core Functions */}
                  {parsedData.mfos_by_type.Core && parsedData.mfos_by_type.Core.length > 0 && (
                    <View style={styles.parsedCard}>
                      <View style={styles.functionTypeHeader}>
                        <Text style={[styles.parsedCardTitle, { color: colors.green }]}>
                          B. CORE FUNCTIONS
                        </Text>
                        <Text style={styles.functionCount}>
                          {parsedData.mfos_by_type.Core.length} MFO(s)
                        </Text>
                      </View>
                      {parsedData.mfos_by_type.Core.map((mfo: any, index: number) => (
                        <View key={index} style={styles.mfoItem}>
                          <View style={styles.mfoHeader}>
                            <Text style={styles.mfoCode}>{mfo.code}</Text>
                            <Text style={styles.mfoDescription}>{mfo.mfo}</Text>
                          </View>
                          {mfo.target_count > 0 && (
                            <Text style={styles.mfoTargetCount}>
                              {mfo.target_count} target(s)
                            </Text>
                          )}
                          {mfo.targets && mfo.targets.length > 0 && (
                            <View style={styles.mfoTargets}>
                              {mfo.targets.slice(0, 3).map((target: any, tIndex: number) => (
                                <View key={tIndex} style={styles.miniTargetItem}>
                                  <Text style={styles.miniTargetCode}>{target.code}</Text>
                                  <Text style={styles.miniTargetText} numberOfLines={2}>
                                    {target.description}
                                  </Text>
                                </View>
                              ))}
                              {mfo.targets.length > 3 && (
                                <Text style={styles.moreTargetsText}>
                                  ... and {mfo.targets.length - 3} more
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Support Functions */}
                  {parsedData.mfos_by_type.Support && parsedData.mfos_by_type.Support.length > 0 && (
                    <View style={styles.parsedCard}>
                      <View style={styles.functionTypeHeader}>
                        <Text style={[styles.parsedCardTitle, { color: colors.blue }]}>
                          C. SUPPORT FUNCTIONS
                        </Text>
                        <Text style={styles.functionCount}>
                          {parsedData.mfos_by_type.Support.length} MFO(s)
                        </Text>
                      </View>
                      {parsedData.mfos_by_type.Support.map((mfo: any, index: number) => (
                        <View key={index} style={styles.mfoItem}>
                          <View style={styles.mfoHeader}>
                            <Text style={styles.mfoCode}>{mfo.code}</Text>
                            <Text style={styles.mfoDescription}>{mfo.mfo}</Text>
                          </View>
                          {mfo.target_count > 0 && (
                            <Text style={styles.mfoTargetCount}>
                              {mfo.target_count} target(s)
                            </Text>
                          )}
                          {mfo.targets && mfo.targets.length > 0 && (
                            <View style={styles.mfoTargets}>
                              {mfo.targets.slice(0, 3).map((target: any, tIndex: number) => (
                                <View key={tIndex} style={styles.miniTargetItem}>
                                  <Text style={styles.miniTargetCode}>{target.code}</Text>
                                  <Text style={styles.miniTargetText} numberOfLines={2}>
                                    {target.description}
                                  </Text>
                                </View>
                              ))}
                              {mfo.targets.length > 3 && (
                                <Text style={styles.moreTargetsText}>
                                  ... and {mfo.targets.length - 3} more
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* All Targets - Detailed View */}
              {parsedData.all_targets && parsedData.all_targets.length > 0 && (
                <View style={styles.parsedCard}>
                  <View style={styles.functionTypeHeader}>
                    <Text style={styles.parsedCardTitle}>
                      All Extracted Targets ({parsedData.all_targets.length})
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAllTargets(!showAllTargets)}
                      style={styles.toggleTargetsButton}
                    >
                      <Text style={styles.toggleTargetsText}>
                        {showAllTargets ? 'Show Less' : 'Show All'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {parsedData.statistics && (
                    <View style={styles.targetStats}>
                      <View style={styles.targetStatItem}>
                        <Text style={styles.targetStatLabel}>With Accountable:</Text>
                        <Text style={styles.targetStatValue}>
                          {parsedData.statistics.targets_with_accountable || 0}
                        </Text>
                      </View>
                      <View style={styles.targetStatItem}>
                        <Text style={styles.targetStatLabel}>With Ratings:</Text>
                        <Text style={styles.targetStatValue}>
                          {parsedData.statistics.targets_with_ratings || 0}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  <ScrollView style={styles.targetsScroll} nestedScrollEnabled>
                    {(showAllTargets ? parsedData.all_targets : parsedData.all_targets.slice(0, 20)).map((target: any, index: number) => (
                      <View key={index} style={styles.targetItem}>
                        <View style={styles.targetHeader}>
                          <Text style={styles.targetNumber}>#{index + 1}</Text>
                          <View style={styles.targetHeaderContent}>
                            {target.code && (
                              <Text style={styles.targetCode}>{target.code}</Text>
                            )}
                            {target.function_type && (
                              <View style={[
                                styles.functionTypeBadge,
                                target.function_type === 'Strategic' && { backgroundColor: colors.accent + '20' },
                                target.function_type === 'Core' && { backgroundColor: colors.green + '20' },
                                target.function_type === 'Support' && { backgroundColor: colors.blue + '20' },
                              ]}>
                                <Text style={[
                                  styles.functionTypeBadgeText,
                                  target.function_type === 'Strategic' && { color: colors.accent },
                                  target.function_type === 'Core' && { color: colors.green },
                                  target.function_type === 'Support' && { color: colors.blue },
                                ]}>
                                  {target.function_type}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={styles.targetDescription}>{target.description}</Text>
                        
                        <View style={styles.targetMetaRow}>
                          {target.mfo_code && (
                            <View style={styles.targetMeta}>
                              <Text style={styles.targetMetaLabel}>MFO:</Text>
                              <Text style={styles.targetMetaValue}>{target.mfo_code}</Text>
                            </View>
                          )}
                          {target.period && (
                            <View style={styles.targetMeta}>
                              <Text style={styles.targetMetaLabel}>Period:</Text>
                              <Text style={styles.targetMetaValue}>{target.period}</Text>
                            </View>
                          )}
                          <View style={styles.targetMeta}>
                            <Text style={styles.targetMetaLabel}>Page:</Text>
                            <Text style={styles.targetMetaValue}>{target.page}</Text>
                          </View>
                        </View>
                        
                        {target.accountable && target.accountable.length > 0 && (
                          <View style={styles.targetMeta}>
                            <Text style={styles.targetMetaLabel}>Accountable:</Text>
                            <Text style={styles.targetMetaValue}>
                              {target.accountable.join(', ')}
                            </Text>
                          </View>
                        )}
                        
                        {target.ratings && Object.values(target.ratings).some(v => v) && (
                          <View style={styles.targetRatings}>
                            <Text style={styles.targetMetaLabel}>Ratings:</Text>
                            <View style={styles.ratingBadges}>
                              {Object.entries(target.ratings).map(([key, value]: [string, any]) => (
                                value && (
                                  <View key={key} style={styles.ratingBadge}>
                                    <Text style={styles.ratingBadgeText}>{key}</Text>
                                  </View>
                                )
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                    {!showAllTargets && parsedData.all_targets.length > 20 && (
                      <TouchableOpacity
                        style={styles.showMoreButton}
                        onPress={() => setShowAllTargets(true)}
                      >
                        <Text style={styles.showMoreText}>
                          Show {parsedData.all_targets.length - 20} more targets
                        </Text>
                        <SvgIcon name="chevronDown" size={16} color={colors.accent} />
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to parse OPCR data</Text>
            </View>
          )
        ) : viewMode === 'pages' ? (
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
  parsedContainer: {
    margin: isMobile ? 16 : 24,
  },
  debugTextContainer: {
    marginTop: 12,
  },
  debugLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  debugTextScroll: {
    maxHeight: 300,
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugLine: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.text2,
    lineHeight: 16,
    marginBottom: 2,
  },
  parsedCard: {
    backgroundColor: colors.bg2,
    padding: isMobile ? 16 : 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  parsedCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  functionTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  functionCount: {
    fontSize: 13,
    color: colors.text2,
    fontWeight: '500',
  },
  parsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  parsedLabel: {
    fontSize: 14,
    color: colors.text2,
  },
  parsedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  mfoItem: {
    padding: 12,
    backgroundColor: colors.bg3,
    borderRadius: 8,
    marginBottom: 8,
  },
  mfoHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  mfoCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    minWidth: 30,
  },
  mfoDescription: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  mfoTargetCount: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 6,
    fontStyle: 'italic',
  },
  mfoTargets: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  miniTargetItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 8,
  },
  miniTargetCode: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text2,
    minWidth: 50,
  },
  miniTargetText: {
    flex: 1,
    fontSize: 11,
    color: colors.text2,
    lineHeight: 16,
  },
  moreTargetsText: {
    fontSize: 11,
    color: colors.text3,
    fontStyle: 'italic',
    paddingLeft: 8,
    marginTop: 4,
  },
  targetsScroll: {
    maxHeight: 400,
  },
  targetStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  targetStatItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  targetStatLabel: {
    fontSize: 12,
    color: colors.text3,
  },
  targetStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  targetItem: {
    padding: 12,
    backgroundColor: colors.bg3,
    borderRadius: 8,
    marginBottom: 8,
  },
  targetHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  targetNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    minWidth: 30,
  },
  targetHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  targetCode: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text2,
    backgroundColor: colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  functionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  functionTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  targetDescription: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  targetMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  targetMeta: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  targetMetaLabel: {
    fontSize: 12,
    color: colors.text3,
  },
  targetMetaValue: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  targetRatings: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  ratingBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },
  toggleTargetsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  toggleTargetsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.bg3,
    borderRadius: 8,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  moreText: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.text3,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
