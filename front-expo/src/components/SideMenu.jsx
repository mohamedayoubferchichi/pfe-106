import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS } from '../styles/theme';
import {
  DEFAULT_SINISTRE_TYPES,
  getSinistreDisplayLabel,
  matchContractToSinistreType,
  normalizeSinistreTypes,
  normalizeTypeCode
} from '../utils/sinistreTypeMeta';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

export default function SideMenu({ navigation, isAuthenticated, userRole, onClose }) {
  const { t, i18n } = useTranslation();
  const [userContracts, setUserContracts] = useState([]);
  const [sinistreTypes, setSinistreTypes] = useState(DEFAULT_SINISTRE_TYPES);

  const normalizeRole = (role) => {
    if (!role) return null;
    const normalized = String(role).trim().toUpperCase();
    return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
  };

  const normalizedRole = normalizeRole(userRole);
  const isAdmin = normalizedRole === 'ADMIN';
  const isAgent = normalizedRole === 'AGENT';

  useEffect(() => {
    let cancelled = false;
    const fetchTypes = async () => {
      try {
        const response = await fetch(`${API}/api/sinistre-types`);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setSinistreTypes(normalizeSinistreTypes(data));
        }
      } catch (err) {
        if (!cancelled) {
          setSinistreTypes(DEFAULT_SINISTRE_TYPES);
        }
      }
    };
    fetchTypes();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isAdmin || isAgent) {
      setUserContracts([]);
      return;
    }

    let cancelled = false;
    const fetchContracts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${API}/api/utilisateurs/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            setUserContracts(data?.contrats || []);
          }
        }
      } catch (err) {
        console.log('Error fetching contracts for side menu', err);
      }
    };
    fetchContracts();
    return () => { cancelled = true; };
  }, [isAuthenticated, isAdmin, isAgent]);

  const publicLinks = [
    { key: 'nav.home', to: 'Home', icon: '🏠' },
    { key: 'nav.assistance', to: 'Assistance', icon: '🆘' },
    { key: 'nav.agences', to: 'Agences', icon: '📍' },
    { key: 'nav.contact', to: 'Contact', icon: '✉️' },
    { key: 'nav.bulletin', to: 'Bulletin', icon: '📰' }
  ];

  const sinistreTypeLinks = useMemo(() => (
    sinistreTypes.map((item) => ({
      code: normalizeTypeCode(item.code),
      label: getSinistreDisplayLabel(item, i18n.language),
      icon: '🛡️',
      typeItem: item
    }))
  ), [sinistreTypes, i18n.language]);

  const hasContractFor = (typeItem) => {
    if (!typeItem) return false;
    return userContracts.some(c => matchContractToSinistreType(c?.typeContrat, typeItem));
  };

  const handleNavigate = (to, params = {}) => {
    navigation.navigate(to, params);
    onClose();
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    onClose();
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <View style={styles.logoDot} />
          <Text style={styles.title}>AssurGo</Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('footer.discover') || 'DÉCOUVRIR'}</Text>
          {publicLinks.map((link) => (
            <Pressable key={link.key} style={styles.link} onPress={() => handleNavigate(link.to)}>
              <Text style={styles.linkIcon}>{link.icon}</Text>
              <Text style={styles.linkText}>{t(link.key)}</Text>
            </Pressable>
          ))}
        </View>

        {isAuthenticated && (isAdmin || isAgent) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('nav.profile') || 'MON ESPACE'}</Text>
            {isAdmin && (
              <Pressable style={styles.link} onPress={() => handleNavigate('Admin')}>
                <Text style={styles.linkIcon}>🛠️</Text>
                <Text style={styles.linkText}>{t('nav.admin') || 'Espace Admin'}</Text>
              </Pressable>
            )}
            {isAgent && (
              <Pressable style={styles.link} onPress={() => handleNavigate('Agent')}>
                <Text style={styles.linkIcon}>🧭</Text>
                <Text style={styles.linkText}>{t('nav.agent') || 'Espace Agent'}</Text>
              </Pressable>
            )}
            <Pressable style={styles.link} onPress={() => handleNavigate('Chat')}>
              <Text style={styles.linkIcon}>💬</Text>
              <Text style={styles.linkText}>{t('nav.messagerie')}</Text>
            </Pressable>
            <Pressable style={styles.link} onPress={handleLogout}>
              <Text style={styles.linkIcon}>🚪</Text>
              <Text style={styles.linkText}>{t('nav.logout') || t('common.logout') || 'Déconnexion'}</Text>
            </Pressable>
          </View>
        )}

        {isAuthenticated && !isAdmin && !isAgent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('nav.profile') || 'MON ESPACE'}</Text>
            {sinistreTypeLinks.map((type) => {
              if (!hasContractFor(type.typeItem)) return null;
              return (
                <Pressable key={type.code} style={styles.link} onPress={() => handleNavigate('SinistreType', { code: type.code })}>
                  <Text style={styles.linkIcon}>{type.icon}</Text>
                  <Text style={styles.linkText}>{type.label}</Text>
                </Pressable>
              );
            })}

            <Pressable style={styles.link} onPress={() => handleNavigate('DeclarationSinistre')}>
              <Text style={styles.linkIcon}>📝</Text>
              <Text style={styles.linkText}>{t('nav.declarationSinistre')}</Text>
            </Pressable>
            
            <Pressable style={styles.link} onPress={() => handleNavigate('Chat')}>
              <Text style={styles.linkIcon}>💬</Text>
              <Text style={styles.linkText}>{t('nav.messagerie')}</Text>
            </Pressable>

            <Pressable style={styles.link} onPress={() => handleNavigate('Profile')}>
              <Text style={styles.linkIcon}>👤</Text>
              <Text style={styles.linkText}>{t('profile.title')}</Text>
            </Pressable>

            <Pressable style={styles.link} onPress={handleLogout}>
              <Text style={styles.linkIcon}>🚪</Text>
              <Text style={styles.linkText}>{t('nav.logout') || t('common.logout') || 'Déconnexion'}</Text>
            </Pressable>
          </View>
        )}

        {!isAuthenticated && (
          <View style={styles.authSection}>
            <Pressable style={styles.primaryLink} onPress={() => handleNavigate('Login')}>
              <Text style={styles.primaryLinkText}>{t('nav.login')}</Text>
            </Pressable>
            <Pressable style={styles.secondaryLink} onPress={() => handleNavigate('Register')}>
              <Text style={styles.secondaryLinkText}>{t('nav.register')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 AssurGo Tunisia</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 14,
  },
  linkIcon: {
    fontSize: 18,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  authSection: {
    padding: 24,
    marginTop: 20,
    gap: 12,
  },
  primaryLink: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  primaryLinkText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryLink: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  }
});
