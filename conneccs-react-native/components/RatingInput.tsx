import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { clampRating } from '../utils/calculations';

interface RatingInputProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const handleChange = (text: string) => {
    const num = parseFloat(text);
    if (!isNaN(num)) {
      onChange(clampRating(num));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          disabled && styles.inputDisabled,
        ]}
        value={value !== null ? value.toString() : ''}
        onChangeText={handleChange}
        keyboardType="decimal-pad"
        placeholder="1.0-5.0"
        placeholderTextColor="#6b7280"
        editable={!disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  inputDisabled: {
    opacity: 0.4,
    backgroundColor: '#1a1a1a',
  },
});
