import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../styles/theme';
import ScreenScaffold from '../components/ScreenScaffold';
import { authStorage } from '../hooks/useAuthStorage';
import ContractRequiredPage from './ContractRequiredPage';
import {
  DEFAULT_SINISTRE_TYPES,
  getSinistreDisplayLabel,
  matchContractToSinistreType,
  normalizeSinistreTypes,
  normalizeTypeCode
} from '../utils/sinistreTypeMeta';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

const IMAGE_BY_CODE = {
  AUTO: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=80',
  HABITATION: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80',
  VOYAGE: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1000&q=80',
  PREVOYANCE: 'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?auto=format&fit=crop&w=1000&q=80'
};

export default function SinistreTypePage({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const { code } = route.params || { code: 'AUTO' };
  const normalizedCode = normalizeTypeCode(code || 'AUTO');
  const isEn = String(i18n.resolvedLanguage || i18n.language || 'fr').toLowerCase().startsWith('en');
  const [typeOptions, setTypeOptions] = useState(DEFAULT_SINISTRE_TYPES);
  const [accessState, setAccessState] = useState({ loading: true, allowed: false });

  const normalizeRole = (role) => {
    if (!role) return null;
    const normalized = String(role).trim().toUpperCase();
    return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
  };

  useEffect(() => {
    let cancelled = false;
    const fetchTypes = async () => {
      try {
        const res = await fetch(`${API}/api/sinistre-types`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setTypeOptions(normalizeSinistreTypes(data));
        }
      } catch {
        if (!cancelled) {
          setTypeOptions(DEFAULT_SINISTRE_TYPES);
        }
      }
    };
    fetchTypes();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const resolveAccess = async () => {
      const token = await authStorage.getToken();
      const role = normalizeRole(await authStorage.getRole());

      if (!token || role === 'ADMIN' || role === 'AGENT') {
        if (!cancelled) setAccessState({ loading: false, allowed: false });
        return;
      }

      try {
        const res = await fetch(`${API}/api/utilisateurs/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (!cancelled) setAccessState({ loading: false, allowed: false });
          return;
        }
        const data = await res.json();
        const contracts = Array.isArray(data?.contrats) ? data.contrats : [];
        const typeItem = typeOptions.find(ti => normalizeTypeCode(ti.code) === normalizedCode)
          || DEFAULT_SINISTRE_TYPES.find(ti => normalizeTypeCode(ti.code) === normalizedCode)
          || { code: normalizedCode };
        const allowed = contracts.some(c => matchContractToSinistreType(c?.typeContrat, typeItem));
        if (!cancelled) setAccessState({ loading: false, allowed });
      } catch {
        if (!cancelled) setAccessState({ loading: false, allowed: false });
      }
    };
    resolveAccess();
    return () => { cancelled = true; };
  }, [normalizedCode, typeOptions]);

  const typeItem = typeOptions.find(ti => normalizeTypeCode(ti.code) === normalizedCode)
    || DEFAULT_SINISTRE_TYPES.find(ti => normalizeTypeCode(ti.code) === normalizedCode)
    || { code: normalizedCode };

  const displayLabel = getSinistreDisplayLabel(typeItem, i18n.language);
  const heroImage = IMAGE_BY_CODE[normalizedCode] || IMAGE_BY_CODE.AUTO;

  const guarantees = [
    { icon: '🛡️', title: isEn ? 'Liability' : 'Responsabilité civile', desc: isEn ? 'Essential protection.' : 'Protection essentielle.' },
    { icon: '🚘', title: isEn ? 'Comprehensive' : 'Tous risques', desc: isEn ? 'Complete coverage.' : 'Couverture complète.' },
    { icon: '🛠️', title: isEn ? '24/7 Support' : 'Assistance 24/7', desc: isEn ? 'Quick roadside help.' : 'Aide rapide partout.' },
  ];

  if (accessState.loading) {
    return (
      <ScreenScaffold title={t('common.loading') || 'Chargement...'} subtitle="">
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenScaffold>
    );
  }

  if (!accessState.allowed) {
    return <ContractRequiredPage navigation={navigation} />;
  }

  return (
    <ScreenScaffold 
      title={isEn ? `Simple, fast ${displayLabel.toLowerCase()} insurance` : `Assurance ${displayLabel.toLowerCase()} simple et rapide`}
      subtitle={isEn ? 'Drive with peace of mind with AssurGo.' : 'Roulez en toute tranquillité avec AssurGo.'}
    >
      <View style={styles.container}>
        <Image source={{ uri: heroImage }} style={styles.heroImage} />
        
        <Pressable style={styles.declareBtn} onPress={() => navigation.navigate('DeclarationSinistre', { type: normalizedCode })}>
          <Text style={styles.declareBtnText}>{isEn ? 'Declare a claim' : 'Déclarer un sinistre'}</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isEn ? 'Our coverages' : 'Nos garanties'}</Text>
          <View style={styles.grid}>
            {guarantees.map((item) => (
              <View key={item.title} style={styles.card}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
           <Text style={styles.infoTitle}>{isEn ? 'Case Tracking' : 'Suivi du dossier'}</Text>
           <Text style={styles.infoDesc}>
             {isEn 
               ? 'Follow every processing step of your claim with clear visibility.' 
               : 'Suivez chaque étape du traitement de votre dossier avec une visibilité claire.'}
           </Text>
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
  },
  declareBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  declareBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  }
});
