import React from 'react';
import { Text } from 'react-native';

// Web-compatible icon component using Unicode symbols
export const Icon = ({ name, size = 18, color = '#000' }) => {
  const iconMap = {
    // Navigation
    'menu': '☰',
    'arrow-back': '←',
    'notifications-outline': '🔔',
    
    // Actions
    'add': '+',
    'create': '✎',
    'ellipsis-vertical': '⋮',
    
    // Status
    'checkmark': '✓',
    'checkmark-circle': '✓',
    'star': '★',
    
    // Content
    'document-text': '📄',
    'folder': '📁',
    'people': '👥',
    'pulse': '📊',
    'megaphone': '📢',
    
    // UI
    'grid': '⊞',
    'time': '⏱',
    'chatbubble': '💬',
  };
  
  return (
    <Text style={{ fontSize: size, color, lineHeight: size }}>
      {iconMap[name] || '•'}
    </Text>
  );
};

export default Icon;
