import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import * as DocumentPicker from 'expo-document-picker';
import { apiService } from '../../../services/api';

interface File {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export default function ReportorialFolderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);

  const folderName = (params.folderName as string) || 'Folder';
  const folderId = params.folderId;

  useEffect(() => {
    if (folderId) {
      loadFiles();
    }
  }, [folderId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/reportorial/folders/${folderId}`);
      if (response.data.success) {
        const filesData = response.data.data.files.map((file: any) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedBy: file.uploadedBy,
          uploadedAt: file.uploadedAt,
          url: file.url,
        }));
        setFiles(filesData);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setUploading(true);
        
        const formData = new FormData();
        formData.append('file', {
          uri: result.uri,
          type: result.mimeType || 'application/octet-stream',
          name: result.name,
        } as any);

        const response = await apiService.post(
          `/reportorial/folders/${folderId}/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.data.success) {
          Alert.alert('Success', 'File uploaded successfully!');
          await loadFiles();
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFilePress = (file: File) => {
    setSelectedFile(file);
    setShowFileModal(true);
  };

  const handleDownload = async (file: File) => {
    try {
      Alert.alert('Download', `Downloading ${file.name}...`);
      
      // For React Native, we'll use the file URL directly
      // The user can open it in their browser or use WebView
      const fileUrl = `${apiService.defaults.baseURL?.replace('/api', '')}/storage/${file.url?.replace('/storage/', '')}`;
      
      // On mobile, we could use expo-file-system or linking to open/download
      // For now, we'll just alert success
      Alert.alert('Download', `File URL: ${fileUrl}\n\nPlease use your browser to download the file.`);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const handleDelete = (file: File) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete ${file.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.delete(`/reportorial/files/${file.id}`);
              
              if (response.data.success) {
                Alert.alert('Success', 'File deleted successfully');
                await loadFiles();
              }
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return { name: 'fileText', color: colors.red };
      case 'doc':
      case 'docx':
        return { name: 'fileText', color: colors.blue };
      case 'xls':
      case 'xlsx':
        return { name: 'barChart', color: colors.green };
      case 'jpg':
      case 'jpeg':
      case 'png':
        return { name: 'image', color: colors.orange };
      default:
        return { name: 'file', color: colors.text3 };
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => router.push('/reportorial-requirements')}>
            <SvgIcon name="arrowLeft" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>{folderName}</Text>
            <Text style={styles.topbarBreadcrumb}>Reportorial Requirements • {folderName}</Text>
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

      {/* Search and Upload Bar */}
      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <SvgIcon name="search" size={20} color={colors.text3} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search files..."
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
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <SvgIcon name="upload" size={18} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        {/* File Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <SvgIcon name="fileText" size={20} color={colors.accent} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{files.length}</Text>
              <Text style={styles.statLabel}>Total Files</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <SvgIcon name="users" size={20} color={colors.blue} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{new Set(files.map(f => f.uploadedBy)).size}</Text>
              <Text style={styles.statLabel}>Contributors</Text>
            </View>
          </View>
        </View>

        {/* Files List/Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading files...</Text>
          </View>
        ) : filteredFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <SvgIcon name="folder" size={64} color={colors.text3} />
            <Text style={styles.emptyTitle}>No files yet</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No files match your search' : 'Upload files to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleUpload}>
                <SvgIcon name="upload" size={18} color="#fff" />
                <Text style={styles.emptyButtonText}>Upload File</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={viewMode === 'grid' ? styles.filesGrid : styles.filesList}>
            {filteredFiles.map((file) => {
              const fileIcon = getFileIcon(file.type);
              return (
                <TouchableOpacity
                  key={file.id}
                  style={viewMode === 'grid' ? styles.fileCardGrid : styles.fileCardList}
                  onPress={() => handleFilePress(file)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.fileIconContainer,
                    viewMode === 'list' && styles.fileIconSmall,
                    { backgroundColor: `${fileIcon.color}20` }
                  ]}>
                    <SvgIcon 
                      name={fileIcon.name as any} 
                      size={viewMode === 'grid' ? 32 : 24} 
                      color={fileIcon.color} 
                    />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text 
                      style={viewMode === 'grid' ? styles.fileName : styles.fileNameList}
                      numberOfLines={viewMode === 'grid' ? 2 : 1}
                    >
                      {file.name}
                    </Text>
                    <View style={styles.fileMeta}>
                      <Text style={styles.fileMetaText}>{file.size}</Text>
                      {viewMode === 'list' && (
                        <>
                          <Text style={styles.fileMetaDot}>•</Text>
                          <Text style={styles.fileMetaText}>{file.uploadedBy}</Text>
                          <Text style={styles.fileMetaDot}>•</Text>
                          <Text style={styles.fileMetaText}>
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  {viewMode === 'list' && (
                    <TouchableOpacity 
                      style={styles.moreButton}
                      onPress={() => handleFilePress(file)}
                    >
                      <SvgIcon name="moreVertical" size={20} color={colors.text3} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* File Detail Modal */}
      <Modal
        visible={showFileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>File Details</Text>
              <TouchableOpacity onPress={() => setShowFileModal(false)}>
                <SvgIcon name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedFile && (
              <>
                <View style={styles.modalBody}>
                  <View style={styles.modalFileIcon}>
                    <SvgIcon 
                      name={getFileIcon(selectedFile.type).name as any} 
                      size={48} 
                      color={getFileIcon(selectedFile.type).color} 
                    />
                  </View>
                  <Text style={styles.modalFileName}>{selectedFile.name}</Text>
                  
                  <View style={styles.modalDetail}>
                    <Text style={styles.modalDetailLabel}>Size:</Text>
                    <Text style={styles.modalDetailValue}>{selectedFile.size}</Text>
                  </View>
                  <View style={styles.modalDetail}>
                    <Text style={styles.modalDetailLabel}>Uploaded by:</Text>
                    <Text style={styles.modalDetailValue}>{selectedFile.uploadedBy}</Text>
                  </View>
                  <View style={styles.modalDetail}>
                    <Text style={styles.modalDetailLabel}>Date:</Text>
                    <Text style={styles.modalDetailValue}>
                      {new Date(selectedFile.uploadedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.modalButton}
                    onPress={() => {
                      handleDownload(selectedFile);
                      setShowFileModal(false);
                    }}
                  >
                    <SvgIcon name="download" size={18} color={colors.accent} />
                    <Text style={[styles.modalButtonText, { color: colors.accent }]}>Download</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonDanger]}
                    onPress={() => {
                      setShowFileModal(false);
                      handleDelete(selectedFile);
                    }}
                  >
                    <SvgIcon name="trash" size={18} color={colors.red} />
                    <Text style={[styles.modalButtonText, { color: colors.red }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topbarIconBtn: {
    position: 'relative',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: colors.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
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
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text3,
  },
  emptyState: {
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
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  filesList: {
    gap: 12,
  },
  fileCardGrid: {
    width: '48%',
    minWidth: 150,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  fileCardList: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  fileIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconSmall: {
    width: 48,
    height: 48,
  },
  fileInfo: {
    flex: 1,
    gap: 6,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  fileNameList: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  fileMetaText: {
    fontSize: 11,
    color: colors.text3,
  },
  fileMetaDot: {
    fontSize: 11,
    color: colors.text3,
  },
  moreButton: {
    padding: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    padding: 24,
    alignItems: 'center',
  },
  modalFileIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalFileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalDetail: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text3,
  },
  modalDetailValue: {
    fontSize: 14,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  modalButtonDanger: {
    borderColor: `${colors.red}40`,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
