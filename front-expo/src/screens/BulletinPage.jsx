import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS, SHADOWS } from '../styles/theme';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

const fmtDate = (v) => { if (!v) return '-'; try { return new Date(v).toLocaleDateString('fr-FR', { dateStyle: 'long' }); } catch { return '-'; } };

export default function BulletinPage() {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/publications`).then(r => {
      const d = Array.isArray(r.data) ? r.data : [];
      setPubs(d);
      setFeatured(d.find(p => p.aLaUne) || d[0] || null);
    }).catch(() => setPubs([])).finally(() => setLoading(false));
  }, []);

  const others = pubs.filter(p => p.id !== featured?.id);

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.hero}>
          <Text style={s.kicker}>BULLETIN</Text>
          <Text style={s.heroTitle}>Actualités et conseils</Text>
          <Text style={s.heroSub}>Retrouvez nos dernières mises à jour, guides pratiques et analyses métier.</Text>
          <View style={s.statsRow}>
            <View style={s.stat}><Text style={s.statVal}>{String(pubs.length).padStart(2, '0')}</Text><Text style={s.statLabel}>Publications</Text></View>
            <View style={s.stat}><Text style={s.statVal}>{featured ? fmtDate(featured.datePublication) : '-'}</Text><Text style={s.statLabel}>Dernière MAJ</Text></View>
          </View>
        </View>

        {loading ? (
          <View style={s.card}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : featured ? (
          <View style={s.card}>
            <View style={s.featuredTopline}>
              <View style={s.pill}><Text style={s.pillText}>À la une</Text></View>
              <Text style={s.dateText}>{fmtDate(featured.datePublication)}</Text>
            </View>
            {featured.imageUrl ? <Image source={{ uri: featured.imageUrl }} style={s.featuredImg} /> : null}
            <Text style={s.featuredTitle}>{featured.titreFr || featured.titreEn || 'Publication'}</Text>
            <Text style={s.featuredDesc}>{featured.descriptionFr || featured.descriptionEn || ''}</Text>
            {(featured.categorieFr || featured.categorieEn) ? (
              <View style={s.chip}><Text style={s.chipText}>{featured.categorieFr || featured.categorieEn}</Text></View>
            ) : null}
          </View>
        ) : (
          <View style={s.card}><Text style={s.emptyText}>Aucune publication disponible.</Text></View>
        )}

        {others.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Publications récentes</Text>
            {others.map(item => (
              <Pressable key={item.id} style={s.card} onPress={() => setFeatured(item)}>
                {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={s.cardImg} /> : null}
                <View style={s.cardMeta}>
                  <Text style={s.chipSmall}>{item.categorieFr || item.categorieEn || 'Général'}</Text>
                  <Text style={s.dateSmall}>{fmtDate(item.datePublication)}</Text>
                </View>
                <Text style={s.cardTitle}>{item.titreFr || item.titreEn || 'Publication'}</Text>
                <Text style={s.cardDesc} numberOfLines={2}>{item.descriptionFr || item.descriptionEn || ''}</Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  hero: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 24, ...SHADOWS.md },
  kicker: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  heroSub: { color: '#a0b4d0', fontSize: 14, marginTop: 8, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 },
  statVal: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  statLabel: { color: '#a0b4d0', fontSize: 11, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  featuredTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pill: { backgroundColor: COLORS.secondary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  dateText: { color: COLORS.textSecondary, fontSize: 12 },
  featuredImg: { width: '100%', height: 180, borderRadius: 14, marginBottom: 12 },
  featuredTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  featuredDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  chip: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,204,204,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 },
  chipText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 8 },
  cardImg: { width: '100%', height: 140, borderRadius: 12, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  chipSmall: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  dateSmall: { color: COLORS.textSecondary, fontSize: 11 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', padding: 20 },
});