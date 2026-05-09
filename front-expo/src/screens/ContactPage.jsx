import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { authStorage } from '../hooks/useAuthStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS } from '../styles/theme';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

const INFO_CARDS = [
  { icon: '📍', title: 'Siège social', lines: ['Rue du Lac Léman', 'Les Berges du Lac, 1053 Tunis'] },
  { icon: '📞', title: 'Téléphone', lines: ['Standard: 70 255 000', 'Support: 70 255 001'] },
  { icon: '📧', title: 'Email', lines: ['contact@assurgo.tn', 'support@assurgo.tn'] },
  { icon: '🕐', title: 'Horaires', lines: ['Lun – Ven : 08h00 – 18h00', 'Sam : 08h00 – 13h00'] },
];

export default function ContactPage({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agencies, setAgencies] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    (async () => {
      const t = await authStorage.getToken();
      setToken(t);
      if (!t) return;
      try {
        const r = await axios.get(`${API}/api/utilisateurs/me`, { headers: { Authorization: `Bearer ${t}` } });
        setProfile(r.data);
        setIsVerified(String(r.data?.statutCompte || '').toUpperCase() === 'VERIFIE');
        // Load agencies
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const role = String(await AsyncStorage.getItem('userRole') || 'UTILISATEUR').toUpperCase().replace('ROLE_', '');
          const chatRole = role === 'ASSURE' ? 'UTILISATEUR' : role;
          const agRes = await axios.get(`${API}/api/chat/interlocutors/${userId}/${chatRole}`, { headers: { Authorization: `Bearer ${t}` } });
          const ag = (Array.isArray(agRes.data) ? agRes.data : [])
            .filter(i => i?.role === 'AGENT' && i.id)
            .map(i => ({ id: String(i.id), name: String(i.name || '').trim() || 'Agence' }));
          const unique = ag.filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i);
          setAgencies(unique);
          if (unique.length > 0) setSelectedAgency(unique[0]);
        }
      } catch {}
    })();
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) { setError('Veuillez écrire un message.'); return; }
    if (!token) { setError('Connexion requise.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userName = profile?.nom || '';
      if (selectedAgency && userId) {
        const role = String(await AsyncStorage.getItem('userRole') || 'UTILISATEUR').toUpperCase().replace('ROLE_', '');
        const chatRole = role === 'ASSURE' ? 'UTILISATEUR' : role;
        await axios.post(`${API}/api/chat/send`, {
          senderId: userId, senderName: userName, senderRole: chatRole,
          receiverId: selectedAgency.id, receiverName: selectedAgency.name, receiverRole: 'AGENT',
          content: message,
        }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/api/contact-messages`, {
          nom: profile?.nom || '', email: profile?.email || '', sujet: 'Message depuis l\'app mobile', message,
        }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      }
      setSuccess('Message envoyé avec succès !');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.hero}>
          <Text style={s.kicker}>CONTACT</Text>
          <Text style={s.heroTitle}>Contactez-nous</Text>
          <Text style={s.heroSub}>Notre équipe répond à vos messages sous 2 heures.</Text>
          <View style={s.metricsRow}>
            <View style={s.metric}><Text style={s.metricVal}>24/7</Text><Text style={s.metricLabel}>Disponibilité</Text></View>
            <View style={s.metric}><Text style={s.metricVal}>{'< 2h'}</Text><Text style={s.metricLabel}>Réponse</Text></View>
            <View style={s.metric}><Text style={s.metricVal}>100%</Text><Text style={s.metricLabel}>Satisfaction</Text></View>
          </View>
        </View>

        {/* Info cards */}
        <View style={s.infoGrid}>
          {INFO_CARDS.map(c => (
            <View key={c.title} style={s.infoCard}>
              <Text style={s.infoIcon}>{c.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.infoTitle}>{c.title}</Text>
                {c.lines.map((l, i) => <Text key={i} style={s.infoLine}>{l}</Text>)}
              </View>
            </View>
          ))}
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Envoyer un message</Text>
          {!token ? (
            <View style={s.stateBox}>
              <Text style={{ fontSize: 32 }}>🔒</Text>
              <Text style={s.stateTitle}>Connexion requise</Text>
              <Pressable style={s.btn} onPress={() => navigation.navigate('Login')}>
                <Text style={s.btnText}>Se connecter</Text>
              </Pressable>
            </View>
          ) : !isVerified ? (
            <View style={s.stateBox}>
              <Text style={{ fontSize: 32 }}>📄</Text>
              <Text style={s.stateTitle}>Compte non vérifié</Text>
              <Text style={s.stateDesc}>Votre compte doit être vérifié pour envoyer des messages.</Text>
            </View>
          ) : (
            <>
              {agencies.length > 0 && (
                <>
                  <Text style={s.label}>Destinataire</Text>
                  <View style={s.chipRow}>
                    {agencies.map(a => (
                      <Pressable key={a.id} style={[s.agChip, selectedAgency?.id === a.id && s.agChipActive]}
                        onPress={() => setSelectedAgency(a)}>
                        <Text style={[s.agChipText, selectedAgency?.id === a.id && s.agChipTextActive]}>{a.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
              <Text style={s.label}>Message</Text>
              <TextInput style={s.textArea} multiline numberOfLines={5} value={message}
                onChangeText={setMessage} placeholder="Écrivez votre message..." placeholderTextColor="#999" textAlignVertical="top" />
              {!!error && <Text style={s.errorText}>{error}</Text>}
              {!!success && <Text style={s.successText}>{success}</Text>}
              <Pressable style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Envoyer</Text>}
              </Pressable>
            </>
          )}
        </View>

        {/* Map placeholder */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Notre siège</Text>
          <View style={s.mapBox}>
            <Text style={{ fontSize: 28 }}>📍</Text>
            <Text style={s.mapText}>Tunis, Tunisie</Text>
            <Text style={s.mapAddr}>Rue du Lac Léman, Les Berges du Lac</Text>
          </View>
          <Pressable style={s.btnOutline} onPress={() => navigation.navigate('Agences')}>
            <Text style={s.btnOutlineText}>Trouver une agence</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  hero: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 24, ...SHADOWS.md },
  kicker: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  heroSub: { color: '#a0b4d0', fontSize: 14, marginTop: 8, lineHeight: 20 },
  metricsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  metric: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, alignItems: 'center' },
  metricVal: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  metricLabel: { color: '#a0b4d0', fontSize: 10, marginTop: 2 },
  infoGrid: { gap: 10 },
  infoCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 12, ...SHADOWS.sm },
  infoIcon: { fontSize: 24 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  infoLine: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4, marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  agChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#f5f7fa' },
  agChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  agChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  agChipTextActive: { color: '#fff' },
  textArea: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fafbfc', minHeight: 100, color: COLORS.textPrimary },
  errorText: { color: '#b91c1c', fontSize: 13, fontWeight: '600', marginTop: 6 },
  successText: { color: '#16a34a', fontSize: 13, fontWeight: '600', marginTop: 6 },
  btn: { backgroundColor: COLORS.secondary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnOutline: { borderWidth: 1.5, borderColor: COLORS.secondary, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  btnOutlineText: { color: COLORS.secondary, fontSize: 14, fontWeight: '700' },
  stateBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  stateTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  stateDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  mapBox: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  mapText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  mapAddr: { fontSize: 13, color: COLORS.textSecondary },
});