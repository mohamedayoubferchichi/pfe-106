import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { authStorage } from '../hooks/useAuthStorage';
import { COLORS, SHADOWS } from '../styles/theme';
import ContractRequiredPage from '../screens/ContractRequiredPage';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

export default function ProductPageTemplate({ navigation, config }) {
  const { title, kicker, typeCode, guarantees, services, steps, stats, declareLabel } = config;
  const [accessState, setAccessState] = useState({ loading: true, allowed: false });

  const normalizeRole = (role) => {
    if (!role) return null;
    const normalized = String(role).trim().toUpperCase();
    return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
  };

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
        const r = await axios.get(`${API}/api/utilisateurs/me`, { headers: { Authorization: `Bearer ${token}` } });
        const contracts = r.data?.contrats || [];
        const aliases = Array.isArray(config.contractAliases) ? config.contractAliases : [];
        const hasContract = aliases.length === 0
          ? true
          : contracts.some(c => {
              const t = (c.typeContrat || '').toLowerCase();
              return aliases.some(a => t.includes(a));
            });
        if (!cancelled) setAccessState({ loading: false, allowed: hasContract });
      } catch {
        if (!cancelled) setAccessState({ loading: false, allowed: false });
      }
    };

    resolveAccess();
    return () => { cancelled = true; };
  }, [config.contractAliases]);

  if (accessState.loading) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!accessState.allowed) {
    return <ContractRequiredPage navigation={navigation} />;
  }

  const goDeclare = () => navigation.navigate('DeclarationSinistre', { type: typeCode });

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.kicker}>{kicker}</Text>
          <Text style={s.heroTitle}>{title}</Text>
          <View style={s.actions}>
            <Pressable style={s.btn} onPress={goDeclare}><Text style={s.btnText}>{declareLabel || 'Déclarer un sinistre'}</Text></Pressable>
            <Pressable style={s.btnOutline} onPress={() => navigation.navigate('Contact')}><Text style={s.btnOutlineText}>Nous contacter</Text></Pressable>
          </View>
          <View style={s.metricsRow}>
            {(stats || []).slice(0, 3).map(st => (
              <View key={st.label} style={s.metric}><Text style={s.metricVal}>{st.value}</Text><Text style={s.metricLabel}>{st.label}</Text></View>
            ))}
          </View>
        </View>

        {/* Guarantees */}
        {guarantees?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionKicker}>Nos garanties</Text>
            <Text style={s.sectionTitle}>Une couverture sur-mesure</Text>
            {guarantees.map(g => (
              <View key={g.title} style={s.guarCard}>
                <Text style={s.guarIcon}>{g.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.guarTitle}>{g.title}</Text>
                  <Text style={s.guarDesc}>{g.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Services */}
        {services?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionKicker}>Services</Text>
            <Text style={s.sectionTitle}>Pensés pour vous</Text>
            {services.map(sv => (
              <View key={sv.title} style={s.serviceCard}>
                {sv.img ? <Image source={{ uri: sv.img }} style={s.serviceImg} /> : null}
                <Text style={s.serviceTitle}>{sv.title}</Text>
                <Text style={s.serviceDesc}>{sv.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Steps */}
        {steps?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionKicker}>Parcours sinistre</Text>
            <Text style={s.sectionTitle}>Comment traiter votre dossier</Text>
            {steps.map(st => (
              <View key={st.step} style={s.stepCard}>
                <View style={s.stepNum}><Text style={s.stepNumText}>{st.step}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{st.title}</Text>
                  <Text style={s.stepDesc}>{st.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <View style={s.ctaCard}>
          <Text style={s.ctaTitle}>{declareLabel || 'Déclarer un sinistre'}</Text>
          <Text style={s.ctaDesc}>Déclarez en ligne puis suivez chaque étape en temps réel.</Text>
          <Pressable style={s.btn} onPress={goDeclare}><Text style={s.btnText}>{declareLabel || 'Déclarer'}</Text></Pressable>
          <View style={s.statsGrid}>
            {(stats || []).map(st => (
              <View key={st.label} style={s.statCard}><Text style={s.statVal}>{st.value}</Text><Text style={s.statLabel}>{st.label}</Text></View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  hero: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 24, ...SHADOWS.md },
  kicker: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  btnText: { color: COLORS.secondary, fontSize: 14, fontWeight: '800' },
  btnOutline: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  btnOutlineText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  metric: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, alignItems: 'center' },
  metricVal: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  metricLabel: { color: '#a0b4d0', fontSize: 10, marginTop: 2, textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  sectionKicker: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  guarCard: { flexDirection: 'row', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  guarIcon: { fontSize: 24 },
  guarTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  guarDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  serviceCard: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 14 },
  serviceImg: { width: '100%', height: 140, borderRadius: 12, marginBottom: 10 },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  serviceDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  stepCard: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  stepDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  ctaCard: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 24, ...SHADOWS.md },
  ctaTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  ctaDesc: { color: '#a0b4d0', fontSize: 13, marginBottom: 14, lineHeight: 18 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  statCard: { flex: 1, minWidth: '40%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statVal: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#a0b4d0', fontSize: 11, marginTop: 2, textAlign: 'center' },
});
