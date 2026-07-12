import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  useWindowDimensions,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import axios from 'axios';

interface UploadedFile {
  file_name: string;
  storage_path: string;
  size: number;
  uploaded_at: number;
  college_name: string | null;
  year: string | null;
  period: string | null;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.15:8000';

// Generate years from 2020 to current year + 5
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2020; year <= currentYear + 5; year++) {
    years.push(year.toString());
  }
  return years.reverse();
};

export default function SecretaryOPCRUploadScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = createStyles(colors, isMobile);

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [period, setPeriod] = useState<'MIDYEAR' | 'YEAR_END'>('MIDYEAR');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  
  const years = generateYears();

  const testConnection = async () => {
    try {
      console.log('Testing connection...');
      const response = await axios.get(`${API_URL}/api/opcr/test`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Test response:', response.data);
      Alert.alert('Connection Test', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.error('Test error:', error);
      Alert.alert('Connection Error', error.message);
    }
  };

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      setLoadingFiles(true);
      console.log('Fetching uploaded files...');
      console.log('Token present:', !!token);
      
      const response = await axios.get(`${API_URL}/api/opcr/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Files response:', response.data);

      if (response.data.success) {
        setUploadedFiles(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching files:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoadingFiles(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUploadedFiles();
    setRefreshing(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('Document picker was canceled');
        return;
      }

      const file = result.assets[0];
      
      console.log('Selected file details:', {
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimeType: file.mimeType,
      });
      
      // Check file size (max 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Set preview URI for PDF
      setPreviewUri(file.uri);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadOPCR = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a PDF file');
      return;
    }

    if (!year.trim()) {
      Alert.alert('Error', 'Please select year');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication token not found. Please login again.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      console.log('Starting upload...');
      console.log('File info:', selectedFile);

      // Fetch the file as a blob
      console.log('Fetching file as blob...');
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      
      console.log('Blob created:', {
        size: blob.size,
        type: blob.type,
      });

      // Create FormData with the blob
      const formData = new FormData();
      formData.append('file', blob, selectedFile.name);
      formData.append('college_name', 'College of Computer Studies');
      formData.append('year', year);
      formData.append('period', period);

      console.log('FormData created, making request...');

      const xhr = new XMLHttpRequest();
      
      // Setup upload progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          console.log('Upload progress:', progress);
          setUploadProgress(progress);
        }
      });

      // Setup response handlers
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          console.log('Upload complete, status:', xhr.status);
          console.log('Response:', xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(errorResponse);
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          console.error('XHR error');
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('abort', () => {
          console.error('XHR aborted');
          reject(new Error('Upload was aborted'));
        });
      });

      // Open and send request
      xhr.open('POST', `${API_URL}/api/opcr/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'application/json');
      // Don't set Content-Type - let browser set it with boundary
      xhr.send(formData);

      const uploadResponse: any = await uploadPromise;

      console.log('Upload response:', uploadResponse);

      if (uploadResponse.success) {
        // Refresh file list immediately
        await fetchUploadedFiles();
        
        Alert.alert(
          'Success',
          `OPCR uploaded successfully!\n\n` +
          `Pages: ${uploadResponse.data.extraction.total_pages}\n` +
          `Text extracted: ${uploadResponse.data.extraction.text_length} characters`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setSelectedFile(null);
                setYear(new Date().getFullYear().toString());
                setPeriod('MIDYEAR');
              },
            },
          ]
        );
      } else {
        throw new Error(uploadResponse.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload OPCR';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join('\n');
      }
      
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (fileName: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this OPCR file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${API_URL}/api/opcr/files/${fileName}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.data.success) {
                // Refresh list immediately after deletion
                await fetchUploadedFiles();
                Alert.alert('Success', 'File deleted successfully');
              }
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const viewFile = (fileName: string) => {
    // For web, open the download URL with authorization
    const fileUrl = `${API_URL}/api/opcr/download/${fileName}`;
    
    if (Platform.OS === 'web') {
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      // Add auth header via fetch and create blob URL
      fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        })
        .catch(error => {
          console.error('Download error:', error);
          Alert.alert('Error', 'Failed to download file');
        });
    } else {
      // For mobile
      Alert.alert('View File', `Opening ${fileName}`, [
        {
          text: 'OK',
          onPress: () => {
            console.log('Open file:', fileUrl);
          },
        },
      ]);
    }
  };

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
            <Text style={styles.topbarTitleText}>Upload OPCR</Text>
            <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal • Upload OPCR</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Upload Form */}
        <View style={styles.uploadSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Upload New OPCR PDF</Text>
            <TouchableOpacity
              onPress={testConnection}
              style={{ padding: 8, backgroundColor: colors.bg3, borderRadius: 6 }}
            >
              <Text style={{ fontSize: 12, color: colors.text2 }}>Test Connection</Text>
            </TouchableOpacity>
          </View>

          {/* File Picker */}
          <TouchableOpacity
            style={styles.filePickerButton}
            onPress={pickDocument}
            disabled={uploading}
          >
            <SvgIcon name="upload" size={24} color={colors.accent} />
            <Text style={styles.filePickerText}>
              {selectedFile ? selectedFile.name : 'Select PDF File'}
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <View style={styles.selectedFileInfo}>
              <SvgIcon name="fileText" size={20} color={colors.text2} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(selectedFile.size || 0)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedFile(null);
                  setPreviewUri(null);
                }}
                style={{ padding: 4 }}
              >
                <SvgIcon name="x" size={18} color={colors.text3} />
              </TouchableOpacity>
            </View>
          )}

          {/* PDF Preview */}
          {previewUri && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>PDF Preview</Text>
              <View style={styles.previewBox}>
                <SvgIcon name="fileText" size={48} color={colors.accent} />
                <Text style={styles.previewText}>PDF file selected</Text>
                <Text style={styles.previewSubtext}>
                  Preview will be available after upload
                </Text>
              </View>
            </View>
          )}

          {/* Year Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowYearPicker(true)}
              disabled={uploading}
            >
              <Text style={styles.dropdownText}>{year}</Text>
              <SvgIcon name="chevronDown" size={20} color={colors.text2} />
            </TouchableOpacity>
          </View>

          {/* Period Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Period</Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === 'MIDYEAR' && styles.periodButtonActive,
                ]}
                onPress={() => setPeriod('MIDYEAR')}
                disabled={uploading}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    period === 'MIDYEAR' && styles.periodButtonTextActive,
                  ]}
                >
                  Midyear
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === 'YEAR_END' && styles.periodButtonActive,
                ]}
                onPress={() => setPeriod('YEAR_END')}
                disabled={uploading}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    period === 'YEAR_END' && styles.periodButtonTextActive,
                  ]}
                >
                  Year End
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Upload Progress */}
          {uploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={uploadOPCR}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <SvgIcon name="upload" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload OPCR</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Uploaded Files List */}
        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>Uploaded OPCR Files</Text>

          {loadingFiles ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : uploadedFiles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <SvgIcon name="folder" size={48} color={colors.text3} />
              <Text style={styles.emptyText}>No OPCR files uploaded yet</Text>
            </View>
          ) : (
            uploadedFiles.map((file, index) => (
              <View key={index} style={styles.fileCard}>
                <View style={styles.fileCardHeader}>
                  <SvgIcon name="fileText" size={24} color={colors.accent} />
                  <View style={styles.fileCardInfo}>
                    <Text style={styles.fileCardName} numberOfLines={1}>
                      {file.file_name}
                    </Text>
                    <Text style={styles.fileCardMeta}>
                      {file.college_name} • {file.year} • {file.period}
                    </Text>
                    <Text style={styles.fileCardDate}>
                      {formatDate(file.uploaded_at)} • {formatFileSize(file.size)}
                    </Text>
                  </View>
                  <View style={styles.fileActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => viewFile(file.file_name)}
                    >
                      <SvgIcon name="eye" size={20} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteFile(file.file_name)}
                    >
                      <SvgIcon name="trash" size={20} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <SvgIcon name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[
                    styles.yearOption,
                    year === y && styles.yearOptionActive,
                  ]}
                  onPress={() => {
                    setYear(y);
                    setShowYearPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.yearOptionText,
                      year === y && styles.yearOptionTextActive,
                    ]}
                  >
                    {y}
                  </Text>
                  {year === y && (
                    <SvgIcon name="check" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  uploadSection: {
    backgroundColor: colors.bg2,
    margin: isMobile ? 16 : 24,
    padding: isMobile ? 16 : 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  filePickerText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.bg3,
    borderRadius: 8,
    marginBottom: 16,
  },
  fileName: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: colors.text3,
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text2,
    marginBottom: 8,
  },
  previewBox: {
    padding: 32,
    backgroundColor: colors.bg3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  previewSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: colors.text3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text2,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.bg3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownText: {
    fontSize: 14,
    color: colors.text,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.bg3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.text2,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.bg3,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 13,
    color: colors.text2,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: colors.accent,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: colors.bg3,
  },
  uploadButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  filesSection: {
    backgroundColor: colors.bg2,
    margin: isMobile ? 16 : 24,
    marginTop: 0,
    padding: isMobile ? 16 : 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.text3,
  },
  fileCard: {
    padding: 12,
    backgroundColor: colors.bg3,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fileCardMeta: {
    fontSize: 12,
    color: colors.text2,
    marginBottom: 2,
  },
  fileCardDate: {
    fontSize: 11,
    color: colors.text3,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalScroll: {
    maxHeight: 300,
  },
  yearOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  yearOptionActive: {
    backgroundColor: colors.accent + '20',
  },
  yearOptionText: {
    fontSize: 15,
    color: colors.text,
  },
  yearOptionTextActive: {
    fontWeight: '600',
    color: colors.accent,
  },
});
