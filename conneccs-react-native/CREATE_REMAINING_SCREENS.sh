#!/bin/bash

# Script to create all remaining screen files for ConneCCS React Native
# Run this script to generate placeholder screens

echo "Creating remaining screen files..."

# Array of screen names
screens=(
  "FacultyDetailScreen"
  "AnnouncementsScreen"
  "AnnouncementFormScreen"
  "ReportsScreen"
  "ReportFormScreen"
  "IPCRScreen"
  "IPCRFormScreen"
  "WorkloadScreen"
  "DocumentsScreen"
  "FolderFormScreen"
  "MessagesScreen"
)

# Template for each screen
for screen in "${screens[@]}"; do
  filename="src/screens/${screen}.js"
  
  if [ ! -f "$filename" ]; then
    cat > "$filename" << 'EOF'
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function SCREEN_NAME({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>SCREEN_TITLE</Text>
          <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal › SCREEN_TITLE</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>SCREEN_TITLE Content</Text>
          </View>
          <View style={styles.panelBody}>
            <Text style={styles.text}>This screen is under development.</Text>
            <Text style={styles.subtext}>Refer to SCREEN_TEMPLATES.md for implementation details.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
  topbarCenter: { flex: 1, marginHorizontal: 16 },
  topbarTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  topbarBreadcrumb: { fontSize: 11, color: colors.text3, marginTop: 2 },
  content: { flex: 1, padding: 16 },
  panel: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  panelHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  panelBody: { padding: 20 },
  text: { fontSize: 14, color: colors.text, marginBottom: 8 },
  subtext: { fontSize: 13, color: colors.text3 },
});
EOF

    # Replace placeholders
    sed -i "s/SCREEN_NAME/${screen}/g" "$filename"
    sed -i "s/SCREEN_TITLE/${screen//Screen/}/g" "$filename"
    
    echo "Created $filename"
  else
    echo "Skipped $filename (already exists)"
  fi
done

echo "Done! All screen files created."
echo "Run 'npm start' to launch the app."
