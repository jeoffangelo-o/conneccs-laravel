import React from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface SvgIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export const SvgIcon: React.FC<SvgIconProps> = ({ name, size = 24, color = '#000', style }) => {
  const iconMap: { [key: string]: { library: 'Ionicons' | 'MaterialCommunity'; name: string } } = {
    grid: { library: 'Ionicons', name: 'grid-outline' },
    document: { library: 'Ionicons', name: 'document-text-outline' },
    fileText: { library: 'Ionicons', name: 'document-text-outline' },
    clock: { library: 'Ionicons', name: 'time-outline' },
    folder: { library: 'Ionicons', name: 'folder-outline' },
    users: { library: 'Ionicons', name: 'people-outline' },
    bell: { library: 'Ionicons', name: 'notifications-outline' },
    messageCircle: { library: 'Ionicons', name: 'chatbubble-outline' },
    sun: { library: 'Ionicons', name: 'sunny-outline' },
    moon: { library: 'Ionicons', name: 'moon-outline' },
    user: { library: 'Ionicons', name: 'person-outline' },
    clipboard: { library: 'Ionicons', name: 'clipboard-outline' },
    calendar: { library: 'Ionicons', name: 'calendar-outline' },
    menu: { library: 'Ionicons', name: 'menu-outline' },
    checkCircle: { library: 'Ionicons', name: 'checkmark-circle-outline' },
    alertCircle: { library: 'Ionicons', name: 'alert-circle-outline' },
    barChart: { library: 'Ionicons', name: 'bar-chart-outline' },
    pulse: { library: 'Ionicons', name: 'pulse-outline' },
    logOut: { library: 'Ionicons', name: 'log-out-outline' },
    chevronRight: { library: 'Ionicons', name: 'chevron-forward-outline' },
  };

  const iconInfo = iconMap[name] || iconMap.grid;

  if (iconInfo.library === 'Ionicons') {
    return <Ionicons name={iconInfo.name as any} size={size} color={color} style={style} />;
  } else {
    return <MaterialCommunityIcons name={iconInfo.name as any} size={size} color={color} style={style} />;
  }
};
