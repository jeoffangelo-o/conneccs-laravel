import React from 'react';
import { Drawer } from 'expo-router/drawer';
import CustomDrawer from '../../components/CustomDrawer';

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 260,
        },
      }}
    >
      <Drawer.Screen name="dashboard" options={{ drawerLabel: 'Dashboard', title: 'Dashboard' }} />
      <Drawer.Screen name="my-ipcr" options={{ drawerLabel: 'My IPCR', title: 'My IPCR' }} />
      <Drawer.Screen name="opcr" options={{ drawerLabel: 'OPCR', title: 'OPCR' }} />
      <Drawer.Screen name="calendar" options={{ drawerLabel: 'Calendar', title: 'Calendar' }} />
      <Drawer.Screen name="review-queue" options={{ drawerLabel: 'Review Queue', title: 'Review Queue' }} />
      <Drawer.Screen name="coordinator-queue" options={{ drawerLabel: 'Coordinator Queue', title: 'Coordinator Queue' }} />
      <Drawer.Screen name="reportorial-requirements" options={{ drawerLabel: 'Reportorial Requirements', title: 'Reportorial Requirements' }} />
      <Drawer.Screen name="messages" options={{ drawerLabel: 'Messages', title: 'Messages' }} />
      <Drawer.Screen name="notifications" options={{ drawerLabel: 'Notifications', title: 'Notifications' }} />
      <Drawer.Screen name="profile" options={{ drawerLabel: 'Profile', title: 'Profile' }} />
      <Drawer.Screen name="ipcr-detail" options={{ drawerLabel: 'IPCR Detail', title: 'IPCR Detail', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="create-ipcr" options={{ drawerLabel: 'Create IPCR', title: 'Create IPCR', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="secretary-opcr-upload" options={{ drawerLabel: 'Secretary OPCR Upload', title: 'Secretary OPCR Upload', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="reportorial-folder" options={{ drawerLabel: 'Reportorial Folder', title: 'Reportorial Folder', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="dean-opcr-consolidation" options={{ drawerLabel: 'Dean OPCR Consolidation', title: 'Dean OPCR Consolidation', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
