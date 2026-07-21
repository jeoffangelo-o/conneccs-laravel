import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SvgIcon } from '@/components/SvgIcon';
import api from '@/utils/api';

export default function EditPictureScreen() {
  const { user, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload pictures!');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to take pictures!');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const filename = selectedImage.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('picture', {
        uri: selectedImage,
        name: filename || 'profile.jpg',
        type,
      } as any);

      const response = await api.post('/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update user in context
        if (updateUser) {
          updateUser({
            ...user,
            profilePicture: response.data.profilePicture,
          });
        }

        Alert.alert('Success', 'Profile picture updated successfully', [
          { text: 'OK', onPress: () => router.push('/profile') }
        ]);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload picture');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await api.delete('/profile/delete-picture');
              
              if (response.data.success) {
                if (updateUser) {
                  updateUser({
                    ...user,
                    profilePicture: null,
                  });
                }
                setSelectedImage(null);
                Alert.alert('Success', 'Profile picture deleted successfully');
              }
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete picture');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const displayImage = selectedImage || user?.profilePicture;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.backButton}>
          <SvgIcon name="arrowLeft" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Picture</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Current/Selected Image */}
        <View style={styles.imageContainer}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <SvgIcon name="user" size={80} color={colors.text3} />
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={pickImage}
            disabled={loading}
          >
            <SvgIcon name="image" size={24} color={colors.accent} />
            <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={takePhoto}
            disabled={loading}
          >
            <SvgIcon name="camera" size={24} color={colors.accent} />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>

          {(user?.profilePicture || selectedImage) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              disabled={loading}
            >
              <SvgIcon name="trash" size={24} color={colors.red} />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Delete Picture
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Upload Button */}
        {selectedImage && (
          <TouchableOpacity
            style={[styles.uploadButton, loading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <SvgIcon name="upload" size={20} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Upload Picture</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>Guidelines:</Text>
          <View style={styles.guideline}>
            <SvgIcon name="checkCircle" size={16} color={colors.green} />
            <Text style={styles.guidelineText}>Use a clear, professional photo</Text>
          </View>
          <View style={styles.guideline}>
            <SvgIcon name="checkCircle" size={16} color={colors.green} />
            <Text style={styles.guidelineText}>JPG or PNG format</Text>
          </View>
          <View style={styles.guideline}>
            <SvgIcon name="checkCircle" size={16} color={colors.green} />
            <Text style={styles.guidelineText}>Maximum file size: 2MB</Text>
          </View>
          <View style={styles.guideline}>
            <SvgIcon name="checkCircle" size={16} color={colors.green} />
            <Text style={styles.guidelineText}>Square aspect ratio (1:1) recommended</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: colors.border2,
  },
  imagePlaceholder: {
    backgroundColor: colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContainer: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  deleteButton: {
    borderColor: `${colors.red}40`,
  },
  deleteButtonText: {
    color: colors.red,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  guidelinesCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 14,
    color: colors.text2,
    marginLeft: 8,
  },
});
