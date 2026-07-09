import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SvgIcon } from '../components/SvgIcon';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function IPCRFormScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <SvgIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>New IPCR</Text>
          <Text style={styles.topbarBreadcrumb}>Individual Performance Commitment Review</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Faculty Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Faculty Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter faculty name"
              placeholderTextColor={colors.text3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Rating Period</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., January - June 2025"
              placeholderTextColor={colors.text3}
            />
          </View>

          <Text style={styles.sectionTitle}>Strategic Priority (10%)</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Output/Target</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe output"
              placeholderTextColor={colors.text3}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingCol}>
              <Text style={styles.label}>Quality</Text>
              <TextInput
                style={styles.input}
                placeholder="1-5"
                placeholderTextColor={colors.text3}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.ratingCol}>
              <Text style={styles.label}>Efficiency</Text>
              <TextInput
                style={styles.input}
                placeholder="1-5"
                placeholderTextColor={colors.text3}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.ratingCol}>
              <Text style={styles.label}>Timeliness</Text>
              <TextInput
                style={styles.input}
                placeholder="1-5"
                placeholderTextColor={colors.text3}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Core Functions (75%)</Text>
          <Text style={styles.subsectionTitle}>Instruction (45%)</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Teaching Load</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of units"
              placeholderTextColor={colors.text3}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.subsectionTitle}>Research (15%)</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Research Output</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe research activities"
              placeholderTextColor={colors.text3}
              multiline
              numberOfLines={3}
            />
          </View>

          <Text style={styles.subsectionTitle}>Extension (15%)</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Extension Activities</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe extension work"
              placeholderTextColor={colors.text3}
              multiline
              numberOfLines={3}
            />
          </View>

          <Text style={styles.sectionTitle}>Support Functions (15%)</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Administrative Tasks</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe support functions"
              placeholderTextColor={colors.text3}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnPrimaryText}>Submit IPCR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topbarCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  topbarTitle: {
    fontSize: 17,
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
    padding: 16,
  },
  panel: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text2,
    marginTop: 12,
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ratingCol: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
