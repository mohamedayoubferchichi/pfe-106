import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { authStorage } from '../hooks/useAuthStorage';
import { COLORS, SHADOWS } from '../styles/theme';
import {
  matchContractToSinistreType, normalizeTypeCode,
  getSinistreDisplayLabel, normalizeSinistreTypes
} from '../utils/sinistreTypeMeta';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';
const VISION_MODEL = 'LLAMA_3_2_11B_VISION';
const TYPE_OPTIONS = [
  { code: 'AUTO', label: 'Accident automobile', labelEn: 'Car accident' },
  { code: 'HABITATION', label: 'Sinistre habitation', labelEn: 'Home claim' },
  { code: 'VOYAGE', label: 'Sinistre voyage', labelEn: 'Travel claim' },
  { code: 'PREVOYANCE', label: 'Sinistre prévoyance', labelEn: 'Life claim' }
];

const extractAiJson = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch { return null; }
};

const parseDecision = (d) => ({
  AUTO_APPROVED: { label: 'Approuvé', color: '#22c55e' },
  AUTO_REJECTED: { label: 'Rejeté', color: '#ef4444' },
  MANUAL_REVIEW: { label: 'Révision manuelle', color: '#f59e0b' }
}[d] || { label: d || '…', color: '#6366f1' });

const fmtConf = (p) => {
  const v = p?.globalConfidenceScore;
  if (v == null || isNaN(Number(v))) return 'N/A';
  return `${Math.round(Number(v) * 100)}%`;
};

const fmtCov = (p) => {
  const v = p?.coveragePercentageApplied;
  if (v == null || isNaN(Number(v))) return null;
  return `${Math.round(Number(v) * 100)}%`;
};

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toUpperCase();
  return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
};

export default function DeclarationSinistrePage({ route, navigation }) {
  const initialType = normalizeTypeCode(route?.params?.type) || 'AUTO';

  const [typeOptions, setTypeOptions] = useState(TYPE_OPTIONS);
  const [form, setForm] = useState({ typeSinistre: initialType, dateIncident: '', lieuIncident: '', description: '', numeroContrat: '' });
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [saved, setSaved] = useState(null);

  const ownedTypes = useMemo(() => {
    const contracts = Array.isArray(profile?.contrats) ? profile.contrats : [];
    const s = new Set();
    typeOptions.forEach(t => {
      if (contracts.some(c => matchContractToSinistreType(c?.typeContrat, t))) s.add(normalizeTypeCode(t.code));
    });
    return [...s];
  }, [profile, typeOptions]);

  const contractsForType = useMemo(() => {
    const contracts = Array.isArray(profile?.contrats) ? profile.contrats : [];
    const ti = typeOptions.find(t => normalizeTypeCode(t.code) === normalizeTypeCode(form.typeSinistre)) || { code: form.typeSinistre };
    return contracts.filter(c => matchContractToSinistreType(c?.typeContrat, ti) && String(c?.statut || '').toUpperCase() === 'ACTIF');
  }, [profile, typeOptions, form.typeSinistre]);

  useEffect(() => {
    if (!form.numeroContrat && contractsForType.length === 1) {
      setForm(p => ({ ...p, numeroContrat: contractsForType[0]?.numeroContrat || '' }));
    }
  }, [contractsForType]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/api/sinistre-types`);
        const n = normalizeSinistreTypes(res.data);
        if (n.length > 0) setTypeOptions(n);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await authStorage.getToken();
      if (!token) { navigation.replace('Login'); return; }
      const role = normalizeRole(await authStorage.getRole());
      if (role === 'ADMIN') { navigation.replace('Admin'); return; }
      if (role === 'AGENT') { navigation.replace('Agent'); return; }
      try {
        const res = await axios.get(`${API}/api/utilisateurs/me`, { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data);
        const contracts = Array.isArray(res.data?.contrats) ? res.data.contrats : [];
        const owned = typeOptions.filter(ti => contracts.some(c => matchContractToSinistreType(c?.typeContrat, ti))).map(ti => normalizeTypeCode(ti.code));
        const sel = owned.includes(initialType) ? initialType : (owned[0] || initialType);
        setForm(p => ({ ...p, typeSinistre: sel }));
      } catch { setError('Impossible de charger le profil.'); }
    })();
  }, []);

  const pickPhotos = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
    if (!r.canceled && r.assets?.length) setPhotos(r.assets);
  };

  const pickDocs = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true });
    if (!r.canceled && r.assets?.length) setDocuments(r.assets);
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) { setError('Veuillez décrire le sinistre.'); return; }
    if (!form.lieuIncident.trim()) { setError('Veuillez indiquer le lieu.'); return; }
    if (!form.dateIncident.trim()) { setError('Veuillez indiquer la date (AAAA-MM-JJ).'); return; }
    setLoading(true); setError(''); setAiResult(null); setSaved(null);

    const token = await authStorage.getToken();
    if (!token || !profile) { setError('Session expirée.'); setLoading(false); return; }
    if (ownedTypes.length > 0 && !ownedTypes.includes(normalizeTypeCode(form.typeSinistre))) {
      setError('Vous ne pouvez pas déclarer ce type.'); setLoading(false); return;
    }

    try {
      let preImageContent = null, preClaimContent = null;
      let preImageResponse = null, preClaimResponse = null;
      const primaryPhoto = photos.length > 0 ? photos[0] : null;

      // STEP 1: Image analysis
      if (primaryPhoto) {
        setStep('🖼️ Analyse photo...');
        const fd = new FormData();
        fd.append('image', { uri: primaryPhoto.uri, name: primaryPhoto.fileName || 'photo.jpg', type: primaryPhoto.mimeType || 'image/jpeg' });
        fd.append('model', VISION_MODEL);
        fd.append('prompt', `Analyse photo sinistre ${form.typeSinistre}. JSON structuré.`);
        const r = await axios.post(`${API}/api/assistant/v1/analyze-image`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
        preImageResponse = r?.data; preImageContent = preImageResponse?.content || null;
      }

      // STEP 2: Claim analysis (contenuContrat loaded from DB via numeroContrat)
      setStep('🧠 Pré-analyse avec contrat...');
      const desc = `Type: ${form.typeSinistre}\nLieu: ${form.lieuIncident}\nDate: ${form.dateIncident}\nDescription: ${form.description}`;
      const postClaim = async () => {
        const fd = new FormData();
        fd.append('claimDescription', desc);
        fd.append('claimType', form.typeSinistre);
        fd.append('numeroContrat', form.numeroContrat || '');
        fd.append('insuredId', profile.cin || 'unknown');
        if (primaryPhoto) fd.append('damageImage', { uri: primaryPhoto.uri, name: primaryPhoto.fileName || 'photo.jpg', type: primaryPhoto.mimeType || 'image/jpeg' });
        return axios.post(`${API}/api/assistant/v1/analyze-claim`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
      };
      try {
        const r = await postClaim(); preClaimResponse = r?.data; preClaimContent = preClaimResponse?.content || null;
      } catch {
        await new Promise(r => setTimeout(r, 500));
        const r2 = await postClaim(); preClaimResponse = r2?.data; preClaimContent = preClaimResponse?.content || null;
      }

      // STEP 3: Save + orchestrate
      setStep('💾 Enregistrement...');
      const fd = new FormData();
      fd.append('cin', profile.cin);
      fd.append('typeSinistre', form.typeSinistre);
      fd.append('description', form.description);
      fd.append('preClaimAnalysis', preClaimContent ?? '');
      fd.append('preImageAnalysis', preImageContent ?? '');
      fd.append('lieu', form.lieuIncident);
      fd.append('date', `${form.dateIncident}T00:00:00`);
      fd.append('numeroContrat', form.numeroContrat || '');
      photos.forEach((p, i) => {
        fd.append(i === 0 ? 'image' : 'images', { uri: p.uri, name: p.fileName || `photo${i}.jpg`, type: p.mimeType || 'image/jpeg' });
      });
      documents.forEach(d => {
        fd.append('documents', { uri: d.uri, name: d.name || 'doc.pdf', type: d.mimeType || 'application/pdf' });
      });

      const saveRes = await axios.post(`${API}/api/sinistres/declarer`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        timeout: 180000
      });
      const data = saveRes.data;
      setSaved(data);
      setStep('🤖 Lecture analyse IA...');
      const parsed = data.aiAnalysis ? extractAiJson(data.aiAnalysis) : null;
      setAiResult({ raw: data.aiAnalysis, parsed, preClaim: preClaimResponse, preImage: preImageResponse });
      setForm(p => ({ ...p, dateIncident: '', lieuIncident: '', description: '', numeroContrat: '' }));
      setPhotos([]); setDocuments([]);
    } catch (err) {
      console.error('Erreur déclaration:', err);
      setError(err.response?.data?.message || err.response?.data || 'Erreur lors de la déclaration.');
    } finally { setLoading(false); setStep(''); }
  };

  const decision = aiResult?.parsed?.finalDecision ? parseDecision(aiResult.parsed.finalDecision) : null;

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.kicker}>ASSURGO</Text>
          <Text style={s.heroTitle}>Déclaration sinistre</Text>
          <Text style={s.heroSub}>Chargez vos photos et justificatifs. Notre IA analyse votre dossier instantanément.</Text>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Formulaire — {getSinistreDisplayLabel(typeOptions.find(t => normalizeTypeCode(t.code) === normalizeTypeCode(form.typeSinistre)) || { code: form.typeSinistre })}</Text>

          <Text style={s.label}>Type de sinistre</Text>
          <View style={s.pickerRow}>
            {typeOptions.map(t => {
              const code = normalizeTypeCode(t.code);
              const active = code === normalizeTypeCode(form.typeSinistre);
              const disabled = ownedTypes.length > 0 && !ownedTypes.includes(code);
              return (
                <Pressable key={code} style={[s.chip, active && s.chipActive, disabled && s.chipDisabled]}
                  onPress={() => !disabled && setForm(p => ({ ...p, typeSinistre: code }))} disabled={disabled}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{getSinistreDisplayLabel(t)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.label}>Date incident (AAAA-MM-JJ)</Text>
          <TextInput style={s.input} value={form.dateIncident} onChangeText={v => setForm(p => ({ ...p, dateIncident: v }))}
            placeholder="2025-01-15" placeholderTextColor="#999" />

          <Text style={s.label}>Lieu</Text>
          <TextInput style={s.input} value={form.lieuIncident} onChangeText={v => setForm(p => ({ ...p, lieuIncident: v }))}
            placeholder="Ville, adresse..." placeholderTextColor="#999" />

          <Text style={s.label}>Numéro de contrat</Text>
          {contractsForType.length > 0 ? (
            <View style={s.pickerRow}>
              {contractsForType.map(c => {
                const val = c?.numeroContrat || '';
                const active = form.numeroContrat === val;
                return (
                  <Pressable key={val} style={[s.chip, active && s.chipActive]}
                    onPress={() => setForm(p => ({ ...p, numeroContrat: val }))}>
                    <Text style={[s.chipText, active && s.chipTextActive]}>{val}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <TextInput style={s.input} value={form.numeroContrat} onChangeText={v => setForm(p => ({ ...p, numeroContrat: v }))}
              placeholder="ex. ABC-12345" placeholderTextColor="#999" />
          )}

          <Text style={s.label}>Description du sinistre</Text>
          <TextInput style={[s.input, s.textArea]} multiline numberOfLines={5} value={form.description}
            onChangeText={v => setForm(p => ({ ...p, description: v }))}
            placeholder="Décrivez ce qui s'est passé..." placeholderTextColor="#999" textAlignVertical="top" />

          {/* Uploads */}
          <Text style={[s.label, { marginTop: 8 }]}>📷 Photos</Text>
          <Pressable style={s.uploadBtn} onPress={pickPhotos}>
            <Text style={s.uploadBtnText}>{photos.length > 0 ? `✅ ${photos.length} photo(s)` : 'Sélectionner des photos'}</Text>
          </Pressable>

          <Text style={s.label}>📄 Documents</Text>
          <Pressable style={s.uploadBtn} onPress={pickDocs}>
            <Text style={s.uploadBtnText}>{documents.length > 0 ? `✅ ${documents.length} document(s)` : 'Sélectionner des documents'}</Text>
          </Pressable>

          {/* Submit */}
          <Pressable style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={s.submitText}>{step || 'Analyse en cours...'}</Text>
              </View>
            ) : (
              <Text style={s.submitText}>🚀 Envoyer et analyser</Text>
            )}
          </Pressable>

          {!!error && <View style={s.errorBox}><Text style={s.errorText}>{typeof error === 'string' ? error : JSON.stringify(error)}</Text></View>}

          {saved && !aiResult && loading && (
            <View style={s.infoBox}><Text style={s.infoText}>✅ Sinistre enregistré — analyse IA en cours...</Text></View>
          )}
        </View>

        {/* AI Result */}
        {aiResult && (
          <View style={s.card}>
            <Text style={s.cardTitle}>⚡ Synthèse finale</Text>
            {saved && <Text style={{ color: '#16a34a', fontWeight: '700', marginBottom: 12 }}>✅ Statut: {saved.statut} · {saved.typeSinistre}</Text>}

            {aiResult.parsed ? (
              <>
                {aiResult.parsed.executiveSummary && (
                  <View style={s.summaryBox}><Text style={s.summaryLabel}>Synthèse</Text><Text style={s.summaryText}>{aiResult.parsed.executiveSummary}</Text></View>
                )}
                {decision && (
                  <View style={[s.badge, { backgroundColor: decision.color }]}><Text style={s.badgeText}>{decision.label}</Text></View>
                )}

                {/* Metrics */}
                <View style={s.metricsRow}>
                  <View style={[s.metricCard, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                    <Text style={[s.metricLabel, { color: '#1d4ed8' }]}>Confiance</Text>
                    <Text style={[s.metricValue, { color: '#1e3a8a' }]}>{fmtConf(aiResult.parsed)}</Text>
                  </View>
                  {aiResult.parsed.finalIndemnificationAmount != null && (
                    <View style={[s.metricCard, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                      <Text style={[s.metricLabel, { color: '#15803d' }]}>Indemnisation</Text>
                      <Text style={[s.metricValue, { color: '#14532d' }]}>{aiResult.parsed.finalIndemnificationAmount?.toLocaleString()} {aiResult.parsed.currency || 'TND'}</Text>
                    </View>
                  )}
                  {fmtCov(aiResult.parsed) && (
                    <View style={[s.metricCard, { backgroundColor: 'rgba(99,102,241,0.08)' }]}>
                      <Text style={[s.metricLabel, { color: '#4338ca' }]}>Couverture</Text>
                      <Text style={[s.metricValue, { color: '#312e81' }]}>{fmtCov(aiResult.parsed)}</Text>
                    </View>
                  )}
                </View>

                {aiResult.parsed.insuredNotification?.body && (
                  <View style={s.notifBox}><Text style={s.notifTitle}>📨 {aiResult.parsed.insuredNotification.subject}</Text><Text style={s.notifBody}>{aiResult.parsed.insuredNotification.body}</Text></View>
                )}
                {aiResult.parsed.finalDecision === 'MANUAL_REVIEW' && aiResult.parsed.internalAuditNote && (
                  <View style={s.auditBox}><Text style={s.auditTitle}>📋 Note de révision</Text><Text style={s.auditBody}>{aiResult.parsed.internalAuditNote}</Text></View>
                )}
              </>
            ) : (
              <Text style={{ fontSize: 13, color: '#666' }}>{aiResult.raw || 'Aucune analyse disponible.'}</Text>
            )}

            <View style={s.refBox}><Text style={s.refText}>Réf: {saved?.id?.slice(-8) || 'N/A'} · Un agent validera prochainement.</Text></View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  hero: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 24, ...SHADOWS.md },
  kicker: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  heroSub: { color: '#a0b4d0', fontSize: 14, marginTop: 8, lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fafbfc', color: COLORS.textPrimary },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#f5f7fa' },
  chipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  chipDisabled: { opacity: 0.4 },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  chipTextActive: { color: '#fff' },
  uploadBtn: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, borderStyle: 'dashed', paddingVertical: 14, alignItems: 'center', backgroundColor: '#fafbfc' },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  submitBtn: { backgroundColor: COLORS.secondary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 12, padding: 12, marginTop: 8 },
  errorText: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
  infoBox: { backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 12, padding: 12, marginTop: 8 },
  infoText: { color: '#4f46e5', fontSize: 13, fontWeight: '700' },
  summaryBox: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, marginBottom: 12 },
  summaryLabel: { fontWeight: '800', fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 },
  summaryText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, marginBottom: 14 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  metricCard: { flex: 1, minWidth: 100, padding: 12, borderRadius: 12 },
  metricLabel: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  notifBox: { backgroundColor: 'rgba(99,102,241,0.06)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', borderRadius: 14, padding: 14, marginBottom: 10 },
  notifTitle: { fontWeight: '800', color: '#3730a3', marginBottom: 6, fontSize: 14 },
  notifBody: { color: '#312e81', fontSize: 13, lineHeight: 19 },
  auditBox: { backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 14, padding: 14 },
  auditTitle: { fontWeight: '800', color: '#b45309', marginBottom: 6, fontSize: 14 },
  auditBody: { color: '#92400e', fontSize: 13, lineHeight: 19 },
  refBox: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center' },
  refText: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
});
