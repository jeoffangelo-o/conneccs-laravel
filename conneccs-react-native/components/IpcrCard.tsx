import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IPCR, User } from '../types';
import { AvatarCircle } from './AvatarCircle';
import { StatusBadge } from './StatusBadge';
import { SvgIcon } from '../src/components/SvgIcon';
import { useTheme } from '../src/context/ThemeContext';

interface IpcrCardProps {
  ipcr: IPCR;
  faculty: User;
  onPress: () => void;
}

export const IpcrCard: React.FC<IpcrCardProps> = ({ ipcr, faculty, onPress }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <AvatarCircle
          initials={faculty.initials}
          color={faculty.avatarColor}
          size={40}
        />
        <View style={styles.info}>
          <Text style={styles.name}>
            {faculty.firstName} {faculty.lastName}
          </Text>
          <Text style={styles.period}>{ipcr.period}</Text>
        </View>
        {ipcr.finalRating && (
          <View style={styles.rating}>
            <SvgIcon name="star" size={16} color={colors.yellow} style={{}} />
            <Text style={styles.ratingText}>{ipcr.finalRating.toFixed(1)}</Text>
          </View>
        )}
        <StatusBadge status={ipcr.status} />
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  period: {
    fontSize: 13,
    color: colors.text3,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
