import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TamaguiProvider } from 'tamagui';
import config from './tamagui.config';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ReportorialProvider } from './context/ReportorialContext';
import CustomDrawer from './src/components/CustomDrawer';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreenNew';
import IPCRDetailScreen from './src/screens/IPCRDetailScreen';
import OPCRScreen from './src/screens/OPCRScreen';
import CreateIPCRScreen from './src/screens/CreateIPCRScreen';
import MyIPCRScreen from './src/screens/MyIPCRScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReviewQueueScreen from './src/screens/ReviewQueueScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ReportorialRequirementsScreen from './src/screens/ReportorialRequirementsScreen';
import ReportorialFolderScreen from './src/screens/ReportorialFolderScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SecretaryOPCRUploadScreen from './src/screens/SecretaryOPCRUploadScreen';
import CoordinatorQueueScreen from './src/screens/CoordinatorQueueScreen';
import DeanOPCRConsolidationScreen from './src/screens/DeanOPCRConsolidationScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 260,
        },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="MyIPCR" component={MyIPCRScreen} />
      <Drawer.Screen name="OPCR" component={OPCRScreen} />
      <Drawer.Screen name="Calendar" component={CalendarScreen} />
      <Drawer.Screen name="ReviewQueue" component={ReviewQueueScreen} />
      <Drawer.Screen name="CoordinatorQueue" component={CoordinatorQueueScreen} />
      <Drawer.Screen name="ReportorialRequirements" component={ReportorialRequirementsScreen} />
      <Drawer.Screen name="Messages" component={MessagesScreen} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ReportorialProvider>
          <ThemeProvider>
            <TamaguiWrapper />
          </ThemeProvider>
        </ReportorialProvider>
      </DataProvider>
    </AuthProvider>
  );
}

function TamaguiWrapper() {
  const { isDark, colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <TamaguiProvider config={config} defaultTheme={isDark ? 'dark' : 'light'}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </TamaguiProvider>
    );
  }
  
  return (
    <TamaguiProvider config={config} defaultTheme={isDark ? 'dark' : 'light'}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={DrawerNavigator} />
              <Stack.Screen name="IPCRDetail" component={IPCRDetailScreen} />
              <Stack.Screen name="CreateIPCR" component={CreateIPCRScreen} />
              <Stack.Screen name="SecretaryOPCRUpload" component={SecretaryOPCRUploadScreen} />
              <Stack.Screen name="ReportorialFolder" component={ReportorialFolderScreen} />
              <Stack.Screen name="DeanOPCRConsolidation" component={DeanOPCRConsolidationScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </TamaguiProvider>
  );
}
