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
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.8:8000';

export default function SecretaryOPCRUploadScreen() {
  const { user, token } = useAuth();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [collegeName, setCollegeName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [period, setPeriod] = useState<'MIDYEAR' | 'YEAR_END'>('MIDYEAR');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      setLoadingFiles(true);
      const response = await axios.get(`${API_URL}/api/opcr/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUploadedFiles(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Check file size (max 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Auto-fill college name if empty
      if (!collegeName) {
        setCollegeName('College of Computer Studies');
      }
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

    if (!collegeName.trim()) {
      Alert.alert('Error', 'Please enter college name');
      return;
    }

    if (!year.trim()) {
      Alert.alert('Error', 'Please enter year');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      
      // Add file to FormData
      const fileToUpload: any = {
        uri: Platform.OS === 'ios' ? selectedFile.uri.replace('file://', '') : selectedFile.uri,
        type: 'application/pdf',
        name: selectedFile.name,
      };
      formData.append('file', fileToUpload);
      formData.append('college_name', collegeName);
      formData.append('year', year);
      formData.append('period', period);

      const response = await axios.post(
        `${API_URL}/api/opcr/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(progress);
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Success',
          `OPCR uploaded successfully!\n\n` +
          `Pages: ${response.data.data.extraction.total_pages}\n` +
          `Text extracted: ${response.data.data.extraction.text_length} characters`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setSelectedFile(null);
                setCollegeName('');
                setYear(new Date().getFullYear().toString());
                setPeriod('MIDYEAR');
                
                // Refresh file list
                fetchUploadedFiles();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload OPCR';
      Alert.alert('Error', errorMessage);
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
                Alert.alert('Success', 'File deleted successfully');
                fetchUploadedFiles();
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a73e8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload OPCR</Text>
      </View>

      {/* Upload Form */}
      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>Upload New OPCR PDF</Text>

        {/* File Picker */}
        <TouchableOpacity
          style={styles.filePickerButton}
          onPress={pickDocument}
          disabled={uploading}
        >
          <Ionicons name="document-attach" size={24} color="#1a73e8" />
          <Text style={styles.filePickerText}>
            {selectedFile ? selectedFile.name : 'Select PDF File'}
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.selectedFileInfo}>
            <Ionicons name="document-text" size={20} color="#666" />
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>
              {formatFileSize(selectedFile.size || 0)}
            </Text>
          </View>
        )}

        {/* College Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>College Name</Text>
          <View style={styles.input}>
            <Text style={styles.inputText}>{collegeName || 'Enter college name'}</Text>
          </View>
        </View>

        {/* Year Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Year</Text>
          <View style={styles.input}>
            <Text style={styles.inputText}>{year}</Text>
          </View>
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
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
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
              <Ionicons name="cloud-upload" size={20} color="#fff" />
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
            <ActivityIndicator size="large" color="#1a73e8" />
          </View>
        ) : uploadedFiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No OPCR files uploaded yet</Text>
          </View>
        ) : (
          uploadedFiles.map((file, index) => (
            <View key={index} style={styles.fileCard}>
              <View style={styles.fileCardHeader}>
                <Ionicons name="document-text" size={24} color="#1a73e8" />
                <View style={styles.fileCardInfo}>
                  <Text style={styles.fileCardName} numberOfLines={1}>
                    {file.file_name}
                  </Text>
                  <Text style={styles.fileCardMeta}>
                    {file.college_name} • {file.year} • {file.period}
                  </Text>
                  <Text style={styles.fileCardDate}>
                    {formatDate(file.uploaded_at)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteFile(file.file_name)}
                >
                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  uploadSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  filePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '500',
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  periodButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1a73e8',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  filesSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontSize: 16,
    color: '#999',
  },
  fileCard: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileCardMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  fileCardDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
});
