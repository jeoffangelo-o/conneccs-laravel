import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { ScrollView } from 'tamagui';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import { IPCR, IPCRMajorFunction, IPCRTarget } from '../../types';

type Period = 'Jan-Jun' | 'Jul-Dec' | 'Jan-Dec';

export default function CreateIPCRScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { opcr, ipcrs, addIPCR } = useData();
  const styles = createStyles(colors);
  
  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState<Period>('Jan-Jun');
  const [year, setYear] = useState(2026);
  const [selectedMajorFunctions, setSelectedMajorFunctions] = useState<string[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [targetDescription, setTargetDescription] = useState('');
  const [targetMeasures, setTargetMeasures] = useState('');

  const periods: { period: Period; year: number }[] = [
    { period: 'Jan-Jun', year: 2026 },
    { period: 'Jul-Dec', year: 2026 },
    { period: 'Jan-Dec', year: 2027 },
  ];

  // Toggle major function selection
  const toggleMajorFunction = (mfId: string) => {
    setSelectedMajorFunctions(prev => {
      if (prev.includes(mfId)) {
        // Remove if already selected
        return prev.filter(id => id !== mfId);
      } else {
        // Add if not selected
        return [...prev, mfId];
      }
    });
  };

  // Toggle indicator selection
  const toggleIndicator = (indicatorId: string) => {
    setSelectedIndicators(prev => {
      if (prev.includes(indicatorId)) {
        return prev.filter(id => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  };

  // Get all indicators from selected major functions
  const getAvailableIndicators = () => {
    const indicators: any[] = [];
    selectedMajorFunctions.forEach(mfId => {
      const mf = opcr.majorFunctions.find(m => m.id === mfId);
      if (mf) {
        mf.successIndicators.forEach(si => {
          indicators.push({ ...si, majorFunctionId: mfId, majorFunctionTitle: mf.title });
        });
      }
    });
    return indicators;
  };

  // Check for duplicate active IPCR
  const hasDuplicateIPCR = () => {
    return ipcrs.some(
      ipcr =>
        ipcr.facultyId === user?.id &&
        ipcr.period === `${period} ${year}` &&
        ipcr.status !== 'COMPLETED'
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (hasDuplicateIPCR()) {
        if (Platform.OS === 'web') {
          window.alert('You already have an active IPCR for this period.');
        } else {
          Alert.alert('Error', 'You already have an active IPCR for this period.');
        }
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedMajorFunctions.length === 0) {
        if (Platform.OS === 'web') {
          window.alert('Please select at least one major function');
        } else {
          Alert.alert('Error', 'Please select at least one major function');
        }
        return;
      }
      if (selectedIndicators.length === 0) {
        if (Platform.OS === 'web') {
          window.alert('Please select at least one success indicator');
        } else {
          Alert.alert('Error', 'Please select at least one success indicator');
        }
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!targetDescription || !targetMeasures) {
        if (Platform.OS === 'web') {
          window.alert('Please fill in all fields');
        } else {
          Alert.alert('Error', 'Please fill in all fields');
        }
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = () => {
    // Create targets for each selected indicator
    const majorFunctionsMap: { [key: string]: IPCRMajorFunction } = {};

    selectedIndicators.forEach(indicatorId => {
      // Find which major function this indicator belongs to
      let parentMF: any = null;
      let indicator: any = null;

      for (const mf of opcr.majorFunctions) {
        const si = mf.successIndicators.find(s => s.id === indicatorId);
        if (si) {
          parentMF = mf;
          indicator = si;
          break;
        }
      }

      if (!parentMF || !indicator) return;

      // Create target for this indicator
      const newTarget: IPCRTarget = {
        id: `it-${Date.now()}-${Math.random()}`,
        parentOpIndicatorId: indicatorId,
        description: targetDescription,
        measures: targetMeasures,
        q1Rating: null,
        e2Rating: null,
        t3Rating: null,
        a4Rating: null,
        actualAccomplishments: '',
        remarks: '',
        movFileUrls: [],
      };

      // Add to major function map
      if (!majorFunctionsMap[parentMF.id]) {
        majorFunctionsMap[parentMF.id] = {
          id: `imf-${Date.now()}-${parentMF.id}`,
          title: parentMF.title,
          category: parentMF.category,
          weight: parentMF.weight,
          targets: [],
        };
      }

      majorFunctionsMap[parentMF.id].targets.push(newTarget);
    });

    // Convert map to array
    const majorFunctions = Object.values(majorFunctionsMap);

    const newIPCR: IPCR = {
      id: `ipcr-${Date.now()}`,
      year: year,
      period: `${period} ${year}`,
      facultyId: user!.id,
      notedByChairId: null,
      verifiedByVpaa: null,
      approvedByDeanId: null,
      status: 'IN_PROGRESS',
      currentPhase: 'TARGET_SETTING',
      finalRating: null,
      adjectivalRating: null,
      majorFunctions: majorFunctions,
    };

    addIPCR(newIPCR);
    
    if (Platform.OS === 'web') {
      window.alert(`IPCR created successfully with ${selectedIndicators.length} target(s)!`);
      navigation.goBack();
    } else {
      Alert.alert('Success', `IPCR created successfully with ${selectedIndicators.length} target(s)!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <SvgIcon name="arrowBack" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topbarCenter}>
          <Text style={styles.topbarTitle}>Create New IPCR</Text>
          <Text style={styles.topbarBreadcrumb}>Step {step} of 4</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s <= step && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView 
        flex={1}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Select Period */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Rating Period</Text>
            <Text style={styles.stepSubtitle}>
              Choose the period for this IPCR
            </Text>

            <View style={styles.periodGrid}>
              {periods.map((p) => (
                <TouchableOpacity
                  key={`${p.period}-${p.year}`}
                  style={[
                    styles.periodCard,
                    period === p.period && year === p.year && styles.periodCardActive,
                  ]}
                  onPress={() => {
                    setPeriod(p.period);
                    setYear(p.year);
                  }}
                >
                  <Text
                    style={[
                      styles.periodText,
                      period === p.period && year === p.year && styles.periodTextActive,
                    ]}
                  >
                    {p.period} {p.year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Select OPCR Parent Targets */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select OPCR Parent Targets</Text>
            <Text style={styles.stepSubtitle}>
              Select one or more major functions and their indicators
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Major Functions ({selectedMajorFunctions.length} selected)
              </Text>
              {opcr.majorFunctions.map((mf) => (
                <TouchableOpacity
                  key={mf.id}
                  style={[
                    styles.checkboxCard,
                    selectedMajorFunctions.includes(mf.id) && styles.checkboxCardActive,
                  ]}
                  onPress={() => toggleMajorFunction(mf.id)}
                >
                  <View style={styles.checkboxRow}>
                    <View style={[
                      styles.checkbox,
                      selectedMajorFunctions.includes(mf.id) && styles.checkboxChecked,
                    ]}>
                      {selectedMajorFunctions.includes(mf.id) && (
                        <SvgIcon name="check" size={16} color="#fff" />
                      )}
                    </View>
                    <View style={styles.checkboxContent}>
                      <Text style={styles.selectTitle}>{mf.title}</Text>
                      <Text style={styles.selectSubtitle}>
                        {mf.category} • {(mf.weight * 100)}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {selectedMajorFunctions.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Success Indicators ({selectedIndicators.length} selected)
                </Text>
                {getAvailableIndicators().map((si) => (
                  <TouchableOpacity
                    key={si.id}
                    style={[
                      styles.checkboxCard,
                      selectedIndicators.includes(si.id) && styles.checkboxCardActive,
                    ]}
                    onPress={() => toggleIndicator(si.id)}
                  >
                    <View style={styles.checkboxRow}>
                      <View style={[
                        styles.checkbox,
                        selectedIndicators.includes(si.id) && styles.checkboxChecked,
                      ]}>
                        {selectedIndicators.includes(si.id) && (
                          <SvgIcon name="check" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={styles.checkboxContent}>
                        <Text style={styles.selectCode}>{si.code}</Text>
                        <Text style={styles.selectDescription}>{si.description}</Text>
                        <Text style={styles.indicatorMF}>from {si.majorFunctionTitle}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Step 3: Enter Target Details */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Enter Target Details</Text>
            <Text style={styles.stepSubtitle}>
              Describe your individual target and measures
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Target Description *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe what you will accomplish..."
                placeholderTextColor={colors.text3}
                value={targetDescription}
                onChangeText={setTargetDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Measures *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="How will success be measured..."
                placeholderTextColor={colors.text3}
                value={targetMeasures}
                onChangeText={setTargetMeasures}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepSubtitle}>
              Please review your IPCR details before submitting
            </Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Period:</Text>
                <Text style={styles.reviewValue}>{period} {year}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Major Functions Selected:</Text>
                <Text style={styles.reviewValue}>{selectedMajorFunctions.length}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Success Indicators Selected:</Text>
                <Text style={styles.reviewValue}>{selectedIndicators.length}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Total Targets to Create:</Text>
                <Text style={styles.reviewValue}>{selectedIndicators.length}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Target Description</Text>
                <Text style={styles.reviewText}>{targetDescription}</Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Measures</Text>
                <Text style={styles.reviewText}>{targetMeasures}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.btnSecondaryText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btnPrimary, step === 1 && { flex: 1 }]}
          onPress={step === 4 ? handleSubmit : handleNext}
        >
          <Text style={styles.btnPrimaryText}>
            {step === 4 ? 'Submit IPCR' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressDot: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: colors.accent,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.text3,
    marginBottom: 24,
  },
  periodGrid: {
    gap: 12,
  },
  periodCard: {
    backgroundColor: colors.bg2,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  periodCardActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}15`,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text2,
  },
  periodTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectCard: {
    backgroundColor: colors.bg2,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectCardActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}10`,
  },
  selectTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  selectSubtitle: {
    fontSize: 12,
    color: colors.text3,
  },
  selectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 6,
  },
  selectDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  reviewCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  reviewRow: {
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 14,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  reviewSection: {
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.bg2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  // Checkbox styles
  checkboxCard: {
    backgroundColor: colors.bg2,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  checkboxCardActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}10`,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxContent: {
    flex: 1,
  },
  indicatorMF: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
