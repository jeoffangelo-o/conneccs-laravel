import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

type OPCRTarget = {
  id: string;
  kra: string;
  function: string;
  indicator: string;
  targetValue: string;
  weight: 'Strategic' | 'Core' | 'Support';
  period: string;
  accountable: string[];
  ratingDimensions: string[];
};

export default function SecretaryOPCRUploadScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [extractedTargets, setExtractedTargets] = useState<OPCRTarget[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);

  const availableYears = [2024, 2025, 2026, 2027, 2028];

  const handleFileSelect = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.xlsx,.xls';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          setUploadedFile({
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            type: file.type,
            file: file,
          });
          // In a real implementation, you would process the file here
          Alert.alert('File Selected', `Selected: ${file.name}`);
        }
      };
      input.click();
    }
  };

  const loadSampleData = () => {
    const sampleTargets: OPCRTarget[] = [
      {
        id: 'KRA1-SF1',
        kra: 'KRA 1: Strategic Direction and Leadership',
        function: 'Strategic Planning and Policy Development',
        indicator: 'Number of strategic plans developed and implemented',
        targetValue: '100% implementation',
        weight: 'Strategic',
        period: `Jan-Dec ${selectedYear}`,
        accountable: ['Dean Onesa', 'Chair Colle', 'Chair Benitez'],
        ratingDimensions: ['Q', 'E', 'T'],
      },
      {
        id: 'KRA2-CF1',
        kra: 'KRA 2: Instruction and Learning',
        function: 'Curriculum Development and Enhancement',
        indicator: 'Percentage of updated course syllabi aligned with industry standards',
        targetValue: '100% of courses',
        weight: 'Core',
        period: `Jan-Jun ${selectedYear}`,
        accountable: ['Chair Colle', 'Chair Pandes', 'Chair Mortel', 'Chair Prianes'],
        ratingDimensions: ['Q', 'E'],
      },
      {
        id: 'KRA3-CF3',
        kra: 'KRA 3: Research and Innovation',
        function: 'Research Output and Publication',
        indicator: 'Number of research papers published in indexed journals',
        targetValue: '5 publications',
        weight: 'Core',
        period: `Jan-Dec ${selectedYear}`,
        accountable: ['Benosa', 'Omorog', 'Onate', 'Serrano'],
        ratingDimensions: ['Q', 'E', 'T'],
      },
      {
        id: 'KRA5-SF1',
        kra: 'KRA 5: Resource Management',
        function: 'Laboratory and Facility Management',
        indicator: 'Percentage of functional laboratory equipment',
        targetValue: '95% operational',
        weight: 'Support',
        period: `Jan-Dec ${selectedYear}`,
        accountable: ['Bagaporo', 'Fortuno', 'Prades', 'Lipata'],
        ratingDimensions: ['Q', 'T'],
      },
    ];

    setExtractedTargets(sampleTargets);
    setUploadedFile({
      name: `OPCR_CCS_${selectedYear}_Sample.xlsx`,
      size: '0.15 MB',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      file: null,
    });

    Alert.alert('Sample Data Loaded', `Successfully loaded ${sampleTargets.length} sample OPCR targets for ${selectedYear}.`);
  };

  const handleSaveTargets = async () => {
    setIsSaving(true);
    
    try {
      // Prepare data for API
      const payload = {
        year: selectedYear,
        fileName: uploadedFile?.name || 'sample.xlsx',
        targets: extractedTargets.map(target => ({
          code: target.id,
          kra: target.kra,
          majorFunction: target.function,
          successIndicator: target.indicator,
          targetValue: target.targetValue,
          weight: target.weight,
          timeline: target.period,
          accountableUnits: target.accountable,
          requiredRatings: target.ratingDimensions,
        })),
      };

      // Call API to save OPCR targets
      await apiService.post('/opcr/upload', payload);

      setIsSaving(false);
      Alert.alert(
        'Save Successful', 
        `${extractedTargets.length} OPCR targets for ${selectedYear} have been saved. Faculty IPCRs will be auto-generated.`,
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      setIsSaving(false);
      console.error('Error saving OPCR targets:', error);
      Alert.alert('Error', 'Failed to save OPCR targets. Please try again.');
    }
  };

  const getWeightColor = (weight: string) => {
    switch (weight) {
      case 'Strategic': return colors.red;
      case 'Core': return colors.accent;
      case 'Support': return colors.teal;
      default: return colors.text3;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{ padding: 10 }}
          >
            <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>Upload OPCR</Text>
            <Text style={styles.topbarBreadcrumb}>Departmental Target Monitoring & Management</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Year Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Academic Year</Text>
          <Text style={styles.cardSubtitle}>Choose the year for this OPCR document</Text>
          <View style={styles.yearGrid}>
            {availableYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.yearCard, selectedYear === year && styles.yearCardActive]}
                onPress={() => setSelectedYear(year)}
              >
                <Text style={[styles.yearText, selectedYear === year && styles.yearTextActive]}>
                  {year}
                </Text>
                {selectedYear === year && (
                  <View style={styles.yearCheck}>
                    <SvgIcon name="checkCircle" size={20} color={colors.accent} style={{}} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Step 1: Upload OPCR Document</Text>
          <Text style={styles.cardSubtitle}>Upload PDF or Excel format</Text>
          
          <TouchableOpacity style={styles.uploadArea} onPress={handleFileSelect}>
            <SvgIcon name="document" size={48} color={colors.accent} style={{}} />
            <Text style={styles.uploadText}>
              {uploadedFile ? uploadedFile.name : 'Click to select OPCR file'}
            </Text>
            {uploadedFile && <Text style={styles.uploadSize}>{uploadedFile.size}</Text>}
            <Text style={styles.uploadHint}>Supported: PDF, Excel (.xlsx, .xls)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sampleBtn} onPress={loadSampleData}>
            <SvgIcon name="zap" size={18} color={colors.accent} style={{}} />
            <Text style={styles.sampleBtnText}>Load Sample Data (Demo)</Text>
          </TouchableOpacity>
        </View>

        {/* Extracted Targets */}
        {extractedTargets.length > 0 && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Step 2: Review Extracted Targets ({extractedTargets.length})</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                  onPress={handleSaveTargets}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <SvgIcon name="checkCircle" size={18} color="#fff" style={{}} />
                  )}
                  <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save to System'}</Text>
                </TouchableOpacity>
              </View>

              {/* Summary Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{extractedTargets.filter(t => t.weight === 'Strategic').length}</Text>
                  <Text style={styles.statLabel}>Strategic</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{extractedTargets.filter(t => t.weight === 'Core').length}</Text>
                  <Text style={styles.statLabel}>Core</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{extractedTargets.filter(t => t.weight === 'Support').length}</Text>
                  <Text style={styles.statLabel}>Support</Text>
                </View>
              </View>
            </View>

            {/* Target Cards */}
            {extractedTargets.map((target, index) => (
              <View key={index} style={styles.targetCard}>
                <View style={styles.targetHeader}>
                  <View style={styles.targetId}>
                    <Text style={styles.targetIdText}>{target.id}</Text>
                  </View>
                  <View style={[styles.weightBadge, { backgroundColor: `${getWeightColor(target.weight)}20` }]}>
                    <Text style={[styles.weightText, { color: getWeightColor(target.weight) }]}>
                      {target.weight}
                    </Text>
                  </View>
                </View>
                <Text style={styles.targetKRA}>{target.kra}</Text>
                <Text style={styles.targetFunction}>{target.function}</Text>
                <Text style={styles.targetIndicator}>{target.indicator}</Text>
                <View style={styles.targetMeta}>
                  <Text style={styles.metaText}>Target: {target.targetValue}</Text>
                  <Text style={styles.metaText}>Period: {target.period}</Text>
                  <Text style={styles.metaText}>Ratings: {target.ratingDimensions.join(', ')}</Text>
                </View>
                <View style={styles.accountableSection}>
                  <Text style={styles.accountableLabel}>Accountable ({target.accountable.length}):</Text>
                  <View style={styles.accountableList}>
                    {target.accountable.map((person, idx) => (
                      <View key={idx} style={styles.accountableBadge}>
                        <Text style={styles.accountableName}>{person}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty State */}
        {extractedTargets.length === 0 && (
          <View style={styles.emptyState}>
            <SvgIcon name="document" size={64} color={colors.text3} style={{}} />
            <Text style={styles.emptyText}>No OPCR targets loaded</Text>
            <Text style={styles.emptyHint}>Upload a document or load sample data to get started</Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  card: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.text2,
    marginBottom: 16,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  yearCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: colors.bg3,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  yearCardActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}15`,
  },
  yearText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text2,
  },
  yearTextActive: {
    color: colors.accent,
  },
  yearCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.bg,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  uploadSize: {
    fontSize: 13,
    color: colors.text3,
    marginTop: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 8,
  },
  sampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  sampleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 4,
  },
  targetCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetId: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  targetIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  weightBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weightText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  targetKRA: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  targetFunction: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  targetIndicator: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
    marginBottom: 12,
  },
  targetMeta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.text3,
    marginBottom: 4,
  },
  accountableSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  accountableLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  accountableList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountableBadge: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accountableName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text2,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: colors.text3,
    marginTop: 8,
    textAlign: 'center',
  },
});
