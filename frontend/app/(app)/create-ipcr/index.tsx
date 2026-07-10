import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';

type Period = 'Jan-Jun' | 'Jul-Dec' | 'Jan-Dec';

export default function CreateIPCRScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState<Period>('Jan-Jun');
  const [year, setYear] = useState(2026);
  const [selectedMajorFunctions, setSelectedMajorFunctions] = useState<number[]>([]);
  const [targetDescription, setTargetDescription] = useState('');
  const [targetMeasures, setTargetMeasures] = useState('');

  const periods = [
    { period: 'Jan-Jun' as Period, year: 2026 },
    { period: 'Jul-Dec' as Period, year: 2026 },
    { period: 'Jan-Dec' as Period, year: 2027 },
  ];

  const majorFunctions = [
    { id: 1, title: 'Strategic Functions', category: 'STRATEGIC', weight: 45 },
    { id: 2, title: 'Core Functions', category: 'CORE', weight: 45 },
    { id: 3, title: 'Support Functions', category: 'SUPPORT', weight: 10 },
  ];

  const toggleMajorFunction = (id: number) => {
    setSelectedMajorFunctions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (selectedMajorFunctions.length === 0) {
        Alert.alert('Error', 'Please select at least one major function');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!targetDescription || !targetMeasures) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      'Success',
      `IPCR created successfully for ${period} ${year}!`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ padding: 10 }}
        >
          <SvgIcon name="arrowBack" size={24} color={colors.text} style={{}} />
        </TouchableOpacity>
        <View style={styles.topbarTitle}>
          <Text style={styles.topbarTitleText}>Create New IPCR</Text>
          <Text style={styles.topbarBreadcrumb}>Step {step} of 4</Text>
        </View>
        <View style={{ width: 44 }} />
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
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Step 1: Select Period */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Select Rating Period</Text>
            <Text style={styles.stepSubtitle}>Choose the period for this IPCR</Text>

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
                  {period === p.period && year === p.year && (
                    <SvgIcon name="checkCircle" size={24} color={colors.accent} style={{ marginTop: 8 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Select Major Functions */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Select Major Functions</Text>
            <Text style={styles.stepSubtitle}>
              Select one or more major functions ({selectedMajorFunctions.length} selected)
            </Text>

            {majorFunctions.map((mf) => (
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
                      <SvgIcon name="check" size={16} color="#fff" style={{}} />
                    )}
                  </View>
                  <View style={styles.checkboxContent}>
                    <Text style={styles.selectTitle}>{mf.title}</Text>
                    <Text style={styles.selectSubtitle}>
                      {mf.category} • {mf.weight}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 3: Enter Target Details */}
        {step === 3 && (
          <View>
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
          <View>
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
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topbarTitle: {
    flex: 1,
    marginHorizontal: 12,
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
});
