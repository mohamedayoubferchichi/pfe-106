import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AdminPage from '../screens/AdminPage';
import AgentPage from '../screens/AgentPage';
import AgencesPage from '../screens/AgencesPage';
import AssistancePage from '../screens/AssistancePage';
import BulletinPage from '../screens/BulletinPage';
import ChatPage from '../screens/ChatPage';
import ContactPage from '../screens/ContactPage';
import ContractRequiredPage from '../screens/ContractRequiredPage';
import DeclarationSinistrePage from '../screens/DeclarationSinistrePage';
import HomePage from '../screens/HomePage';
import LoginPage from '../screens/LoginPage';
import MaPrevoyancePage from '../screens/MaPrevoyancePage';
import MaVoiturePage from '../screens/MaVoiturePage';
import MonHabitationPage from '../screens/MonHabitationPage';
import MonVoyagePage from '../screens/MonVoyagePage';
import ProfilePage from '../screens/ProfilePage';
import RegisterPage from '../screens/RegisterPage';
import SinistreTypePage from '../screens/SinistreTypePage';

import SideMenu from '../components/SideMenu';
import AppHeader from '../components/AppHeader';

// Context to control the side menu from anywhere
export const SideMenuContext = createContext({ open: () => {}, close: () => {} });
export const useSideMenu = () => useContext(SideMenuContext);

const Stack = createNativeStackNavigator();

// Inner component that has access to navigation
function SideMenuModal({ visible, onClose }) {
  const navigation = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (visible) {
      (async () => {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('userRole');
        setIsAuthenticated(!!token);
        setUserRole(role);
      })();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.menuPanel}>
          <SideMenu
            navigation={navigation}
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            onClose={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function AppNavigator() {
  const [menuVisible, setMenuVisible] = useState(false);

  const sideMenuApi = {
    open: () => setMenuVisible(true),
    close: () => setMenuVisible(false),
  };

  return (
    <SideMenuContext.Provider value={sideMenuApi}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          header: (props) => <AppHeader {...props} />,
          headerShown: true,
        }}
      >
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Register" component={RegisterPage} />
        <Stack.Screen name="Profile" component={ProfilePage} />
        <Stack.Screen name="Admin" component={AdminPage} />
        <Stack.Screen name="Agent" component={AgentPage} />
        <Stack.Screen name="Assistance" component={AssistancePage} />
        <Stack.Screen name="Agences" component={AgencesPage} />
        <Stack.Screen name="Contact" component={ContactPage} />
        <Stack.Screen name="Bulletin" component={BulletinPage} />
        <Stack.Screen name="Chat" component={ChatPage} />
        <Stack.Screen name="SinistreType" component={SinistreTypePage} />
        <Stack.Screen name="DeclarationSinistre" component={DeclarationSinistrePage} />
        <Stack.Screen name="MaVoiture" component={MaVoiturePage} />
        <Stack.Screen name="MonHabitation" component={MonHabitationPage} />
        <Stack.Screen name="MonVoyage" component={MonVoyagePage} />
        <Stack.Screen name="MaPrevoyance" component={MaPrevoyancePage} />
        <Stack.Screen name="ContractRequired" component={ContractRequiredPage} />
      </Stack.Navigator>

      <SideMenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SideMenuContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 0.15, backgroundColor: 'rgba(0,0,0,0.4)' },
  menuPanel: { flex: 0.85, backgroundColor: '#fff' },
});
