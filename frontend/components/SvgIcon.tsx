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
    chevronDown: { library: 'Ionicons', name: 'chevron-down-outline' },
    star: { library: 'Ionicons', name: 'star-outline' },
    refresh: { library: 'Ionicons', name: 'refresh-outline' },
    arrowBack: { library: 'Ionicons', name: 'arrow-back-outline' },
    arrowForward: { library: 'Ionicons', name: 'arrow-forward-outline' },
    close: { library: 'Ionicons', name: 'close-outline' },
    send: { library: 'Ionicons', name: 'send-outline' },
    attach: { library: 'Ionicons', name: 'attach-outline' },
    image: { library: 'Ionicons', name: 'image-outline' },
    upload: { library: 'Ionicons', name: 'cloud-upload-outline' },
    download: { library: 'Ionicons', name: 'cloud-download-outline' },
    search: { library: 'Ionicons', name: 'search-outline' },
    filter: { library: 'Ionicons', name: 'filter-outline' },
    settings: { library: 'Ionicons', name: 'settings-outline' },
    help: { library: 'Ionicons', name: 'help-circle-outline' },
    check: { library: 'Ionicons', name: 'checkmark-outline' },
    add: { library: 'Ionicons', name: 'add-outline' },
    remove: { library: 'Ionicons', name: 'remove-outline' },
    eye: { library: 'Ionicons', name: 'eye-outline' },
    eyeOff: { library: 'Ionicons', name: 'eye-off-outline' },
    mail: { library: 'Ionicons', name: 'mail-outline' },
    trash: { library: 'Ionicons', name: 'trash-outline' },
    edit: { library: 'Ionicons', name: 'create-outline' },
    zap: { library: 'Ionicons', name: 'flash-outline' },
  };

  const iconInfo = iconMap[name] || iconMap.grid;

  if (iconInfo.library === 'Ionicons') {
    return <Ionicons name={iconInfo.name as any} size={size} color={color} style={style} />;
  } else {
    return <MaterialCommunityIcons name={iconInfo.name as any} size={size} color={color} style={style} />;
  }
};
