import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { SvgIcon } from './SvgIcon';

interface MenuItemData {
  name: string;
  icon: string;
  route: string;
  section: string;
  roles: string[];
  badge?: number | null;
}

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { unreadCount, getUnreadCount } = useData();
  const router = useRouter();

  // Fetch unread count on mount and periodically
  React.useEffect(() => {
    if (user) {
      getUnreadCount();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        getUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Define menu items with role-based visibility
  const menuItems: MenuItemData[] = [
    { 
      name: 'Dashboard', 
      icon: 'grid', 
      route: 'dashboard', 
      section: 'Main',
      roles: ['FACULTY', 'CHAIR', 'DEAN', 'ADMIN', 'SECRETARY', 'COORDINATOR']
    },
    { 
      name: 'My IPCR', 
      icon: 'document', 
      route: 'my-ipcr', 
      section: 'IPCR',
      roles: ['FACULTY', 'CHAIR', 'DEAN', 'SECRETARY', 'COORDINATOR']
    },
    { 
      name: 'OPCR', 
      icon: 'pulse', 
      route: 'opcr', 
      section: 'Main',
      roles: ['DEAN', 'ADMIN', 'SECRETARY']
    },
    { 
      name: 'Upload OPCR', 
      icon: 'document', 
      route: 'secretary-opcr-upload', 
      section: 'Secretary',
      roles: ['SECRETARY', 'ADMIN']
    },
    { 
      name: 'Rating Queue', 
      icon: 'clipboard', 
      route: 'review-queue', 
      section: 'Secretary',
      roles: ['SECRETARY', 'ADMIN']
    },
    { 
      name: 'Verification Queue', 
      icon: 'clipboard', 
      route: 'coordinator-queue', 
      section: 'Coordinator',
      roles: ['COORDINATOR', 'ADMIN']
    },
    { 
      name: 'Approval Queue', 
      icon: 'clipboard', 
      route: 'review-queue', 
      section: 'Dean',
      roles: ['DEAN']
    },
    { 
      name: 'OPCR Consolidation', 
      icon: 'pulse', 
      route: 'dean-opcr-consolidation', 
      section: 'Dean',
      roles: ['DEAN', 'ADMIN']
    },
    { 
      name: 'Calendar', 
      icon: 'calendar', 
      route: 'calendar', 
      section: 'IPCR',
      roles: ['FACULTY', 'CHAIR', 'DEAN', 'ADMIN', 'SECRETARY', 'COORDINATOR']
    },
    { 
      name: 'Reportorial Requirements', 
      icon: 'folder', 
      route: 'reportorial-requirements', 
      section: 'Documents',
      roles: ['FACULTY', 'CHAIR', 'DEAN', 'ADMIN', 'SECRETARY', 'COORDINATOR']
    },
    { 
      name: 'Messages', 
      icon: 'messageCircle', 
      route: 'messages', 
      section: 'Communication',
      roles: ['FACULTY', 'CHAIR', 'DEAN', 'ADMIN', 'SECRETARY', 'COORDINATOR']
    },
    { 
      name: 'Notifications', 
      icon: 'bell', 
      route: 'notifications', 
      section: 'Account',
      badge: unreadCount > 0 ? unreadCount : null,
      roles: ['FACULTY', 'CHAIR', 'DEAN', 'ADMIN', 'SECRETARY', 'COORDINATOR']
    },
    { 
      name: 'Profile', 
      icon: 'user', 
      route: 'profile', 
      section: 'Account',
      roles: ['FACULTY', 'CHAIR', 'DEAN', 'ADMIN', 'SECRETARY', 'COORDINATOR']
    },
  ];

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const renderSection = (section: string) => {
    const items = visibleMenuItems.filter(item => item.section === section);
    if (items.length === 0) return null;
    
    return (
      <View key={section}>
        <Text style={[styles.sectionLabel, { color: colors.text3 }]}>{section}</Text>
        {items.map((item) => {
          const isFocused = props.state.routes[props.state.index].name === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.navItem,
                isFocused && { ...styles.navItemActive, borderLeftColor: colors.yellow, backgroundColor: 'rgba(244,208,63,0.15)' }
              ]}
              onPress={() => router.push(`/${item.route}`)}
            >
              <SvgIcon
                name={item.icon}
                size={18}
                color={isFocused ? colors.yellow : colors.text3}
              />
              <Text style={[styles.navText, { color: colors.text3 }, isFocused && { color: colors.yellow, ...styles.navTextActive }]}>
                {item.name}
              </Text>
              {item.badge && (
                <View style={[styles.navBadge, { backgroundColor: colors.red }]}>
                  <Text style={styles.navBadgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const getUserInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg2 }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
          />
          <View>
            <Text style={[styles.brandName, { color: colors.text }]}>ConneCCS</Text>
            <Text style={[styles.brandTagline, { color: colors.text3 }]}>Target Monitoring</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.navContainer} showsVerticalScrollIndicator={false}>
        {renderSection('Main')}
        {renderSection('Secretary')}
        {renderSection('Coordinator')}
        {renderSection('Dean')}
        {renderSection('IPCR')}
        {renderSection('Documents')}
        {renderSection('Communication')}
        {renderSection('Account')}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.userInfo}>
          <View style={[styles.userAvatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.userAvatarText}>
              {getUserInitials(user?.name)}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Guest'}</Text>
            <Text style={[styles.userRole, { color: colors.text3 }]}>{user?.role?.toLowerCase() || 'guest'}</Text>
          </View>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity style={[styles.iconButton, { borderColor: colors.border }]} onPress={toggleTheme}>
            <SvgIcon
              name={isDark ? 'sun' : 'moon'}
              size={18}
              color={colors.text2}
            />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { borderColor: colors.border }]} onPress={handleLogout}>
            <SvgIcon
              name="logOut"
              size={18}
              color={colors.red}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 10,
    marginTop: 2,
  },
  navContainer: {
    flex: 1,
    padding: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
    position: 'relative',
    paddingLeft: 12,
  },
  navItemActive: {
    borderLeftWidth: 4,
    paddingLeft: 8,
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  navTextActive: {
    fontWeight: '600',
  },
  navBadge: {
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  navBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
  },
  userRole: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
