import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SvgIcon } from '../components/SvgIcon';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function ReportFormScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [formData, setFormData] = useState({ type: '', title: '', description: '' });

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <SvgIcon name="arrowBack" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Submit Report</Text>
          <Text style={styles.topbarBreadcrumb}>Create New Report</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Report Details</Text>
          </View>
          <View style={styles.panelBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Report Type *</Text>
              <TextInput style={styles.input} placeholder="Accomplishment / Extension / Research" placeholderTextColor={colors.text3} value={formData.type} onChangeText={(text) => setFormData({...formData, type: text})} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput style={styles.input} placeholder="Enter report title" placeholderTextColor={colors.text3} value={formData.title} onChangeText={(text) => setFormData({...formData, title: text})} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput style={styles.textarea} placeholder="Describe your report" placeholderTextColor={colors.text3} value={formData.description} onChangeText={(text) => setFormData({...formData, description: text})} multiline numberOfLines={6} textAlignVertical="top" />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => { Alert.alert('Success', 'Report submitted!', [{ text: 'OK', onPress: () => navigation.goBack() }]); }}>
                <Text style={styles.btnPrimaryText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topbar: { backgroundColor: colors.bg2, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingVertical: 12, paddingTop: 48, flexDirection: 'row', alignItems: 'center' },
  topbarCenter: { flex: 1, marginHorizontal: 16 },
  topbarTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  topbarBreadcrumb: { fontSize: 11, color: colors.text3, marginTop: 2 },
  content: { flex: 1, padding: 16 },
  panel: { backgroundColor: colors.bg2, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  panelHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  panelTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  panelBody: { padding: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text2, marginBottom: 6 },
  input: { backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text },
  textarea: { backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text, minHeight: 120 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnPrimary: { flex: 1, backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary: { flex: 1, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnSecondaryText: { color: colors.text2, fontSize: 15, fontWeight: '500' },
});
