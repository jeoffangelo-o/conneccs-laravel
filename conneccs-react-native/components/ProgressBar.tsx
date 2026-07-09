import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percent, 
  color = '#3b82f6',
  height = 6 
}) => {
  return (
    <View style={[styles.container, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(100, Math.max(0, percent))}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
});
