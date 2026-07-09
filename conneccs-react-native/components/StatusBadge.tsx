import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IPCRStatus } from '../types';

interface StatusBadgeProps {
  status: IPCRStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' };
      case 'PENDING_REVIEW':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' };
      case 'REVISION_REQUIRED':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' };
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PENDING_REVIEW':
        return 'Pending Review';
      case 'REVISION_REQUIRED':
        return 'Revision Required';
      default:
        return status;
    }
  };

  const style = getStatusStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{getStatusText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
