import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const MenuItem = ({ icon, label, route, iconLibrary = 'MaterialCommunityIcons' }: any) => {
    const isActive = props.state.routeNames[props.state.index] === route;
    const IconComponent = iconLibrary === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

    return (
      <TouchableOpacity
        style={[
          styles.menuItem,
          { backgroundColor: isActive ? colors.accent + '20' : 'transparent' },
        ]}
        onPress={() => router.push(`/${route}`)}
      >
        <IconComponent
          name={icon}
          size={22}
          color={isActive ? colors.accent : colors.text2}
          style={styles.menuIcon}
        />
        <Text style={[styles.menuLabel, { color: isActive ? colors.accent : colors.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg2 }]}>
      <View style={[styles.header, { backgroundColor: colors.accent, borderBottomColor: colors.border }]}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.userName, { color: colors.bg }]}>{user?.name}</Text>
        <Text style={[styles.userEmail, { color: colors.bg }]}>{user?.email}</Text>
        <Text style={[styles.userRole, { color: colors.bg }]}>{user?.role}</Text>
      </View>

      <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
        <MenuItem icon="view-dashboard" label="Dashboard" route="dashboard" />
        <MenuItem icon="file-document-multiple" label="My IPCR" route="my-ipcr" />
        <MenuItem icon="clipboard-text" label="OPCR" route="opcr" />
        <MenuItem icon="calendar" label="Calendar" route="calendar" iconLibrary="Ionicons" />
        
        {(user?.role === 'SECRETARY' || user?.role === 'DEAN') && (
          <MenuItem icon="clipboard-check" label="Review Queue" route="review-queue" />
        )}
        
        {(user?.role === 'COORDINATOR') && (
          <MenuItem icon="format-list-checks" label="Coordinator Queue" route="coordinator-queue" />
        )}
        
        <MenuItem icon="folder-multiple" label="Reportorial" route="reportorial-requirements" />
        <MenuItem icon="message-text" label="Messages" route="messages" iconLibrary="Ionicons" />
        <MenuItem icon="notifications" label="Notifications" route="notifications" iconLibrary="Ionicons" />
        <MenuItem icon="person" label="Profile" route="profile" iconLibrary="Ionicons" />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.themeToggle, { backgroundColor: colors.bg3 }]}
          onPress={toggleTheme}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={20}
            color={colors.text}
          />
          <Text style={[styles.themeText, { color: colors.text }]}>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.red }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    paddingTop: 48,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  menu: {
    flex: 1,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  themeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
