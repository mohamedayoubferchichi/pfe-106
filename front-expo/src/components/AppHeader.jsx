import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../styles/theme';
import { useDarkMode } from '../hooks/useDarkMode';
import BrandLogo from './BrandLogo';
import { useSideMenu } from '../navigation/AppNavigator';

export default function AppHeader({ navigation }) {
  const { t, i18n } = useTranslation();
  const { isDark, toggleDarkMode } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;
  const sideMenu = useSideMenu();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userRole, setUserRole] = useState(null);

  const normalizeRole = (role) => {
    if (!role) return null;
    const normalized = String(role).trim().toUpperCase();
    return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
  };

  const loadAuthState = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    const role = normalizeRole(await AsyncStorage.getItem('userRole'));
    const displayName = await AsyncStorage.getItem('userDisplayName');
    setIsAuthenticated(!!token);
    setUserRole(role);
    setUserDisplayName(displayName || '');
  }, []);

  useEffect(() => {
    loadAuthState();
    const unsubscribe = navigation?.addListener?.('focus', loadAuthState);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigation, loadAuthState]);

  const profileTarget = userRole === 'ADMIN' ? 'Admin' : userRole === 'AGENT' ? 'Agent' : 'Profile';
  const avatarLetter = (userDisplayName || 'U').trim().charAt(0).toUpperCase() || 'U';
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgSecondary }]}>
      <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
        <View style={styles.navWrap}>
          <Pressable onPress={() => navigation.navigate('Home')} style={styles.brand}>
            <BrandLogo compact />
          </Pressable>

          <View style={styles.actions}>
            {/* Theme Toggle matching web icon button style */}
            <TouchableOpacity onPress={toggleDarkMode} style={styles.iconBtn}>
               <Text style={styles.iconText}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            {/* Language Switcher matching web style */}
            <View style={styles.langSwitcher}>
              <Pressable 
                onPress={() => i18n.changeLanguage('fr')} 
                style={[styles.langBtn, i18n.language === 'fr' && styles.langBtnActive]}
              >
                <Text style={[styles.langText, i18n.language === 'fr' && styles.langTextActive]}>FR</Text>
              </Pressable>
              <Pressable 
                onPress={() => i18n.changeLanguage('en')} 
                style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]}
              >
                <Text style={[styles.langText, i18n.language === 'en' && styles.langTextActive]}>EN</Text>
              </Pressable>
            </View>

            {/* Profile / Login matching web topbar right side */}
            {isAuthenticated ? (
              <Pressable onPress={() => navigation.navigate(profileTarget)} style={styles.profileBtn}>
                <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
                   <Text style={styles.avatarText}>{avatarLetter}</Text>
                </View>
              </Pressable>
            ) : (
              <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginBtn}>
                <Text style={styles.loginBtnText}>{t('nav.login')}</Text>
              </Pressable>
            )}

            {/* Mobile Menu Trigger */}
            <TouchableOpacity onPress={() => sideMenu.open()} style={styles.menuBtn}>
               <View style={styles.menuIconWrap}>
                 <View style={styles.menuBar} />
                 <View style={[styles.menuBar, { width: 16 }]} />
                 <View style={styles.menuBar} />
               </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.bgSecondary,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  navWrap: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  iconText: {
    fontSize: 14,
  },
  langSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
  },
  langBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
  },
  langText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  langTextActive: {
    color: '#fff',
  },
  profileBtn: {
    marginLeft: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  menuBtn: {
    padding: 4,
  },
  menuIconWrap: {
    gap: 4,
    alignItems: 'flex-end',
  },
  menuBar: {
    height: 2.5,
    width: 24,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 2,
  }
});
