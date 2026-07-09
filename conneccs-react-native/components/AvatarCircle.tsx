import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AvatarCircleProps {
  name?: string;
  initials?: string;
  color?: string;
  size?: number;
}

const getInitialsFromName = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return name.substring(0, 2).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#10b981', 
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const AvatarCircle: React.FC<AvatarCircleProps> = ({ 
  name,
  initials, 
  color, 
  size = 40 
}) => {
  const displayInitials = initials || (name ? getInitialsFromName(name) : '??');
  const displayColor = color || (name ? getColorFromName(name) : '#6b7280');

  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: displayColor,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {displayInitials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
});
