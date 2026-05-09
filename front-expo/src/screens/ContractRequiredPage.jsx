import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../styles/theme';

export default function ContractRequiredPage({ navigation, route }) {
  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <View style={s.container}>
        <View style={s.hero}>
          <Text style={s.kicker}>ACCÈS RESTREINT</Text>
          <Text style={s.heroTitle}>Un contrat actif est requis</Text>
          <Text style={s.heroSub}>Vous pouvez voir les services disponibles, mais un contrat correspondant est nécessaire pour accéder à cette fonctionnalité.</Text>
          <View style={s.actions}>
            <Pressable style={s.btn} onPress={() => navigation.navigate('Profile')}>
              <Text style={s.btnText}>Mon profil</Text>
            </Pressable>
            <Pressable style={s.btnOutline} onPress={() => navigation.navigate('Contact')}>
              <Text style={s.btnOutlineText}>Nous contacter</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  hero: { backgroundColor: COLORS.secondary, borderRadius: 20, padding: 28, ...SHADOWS.md },
  kicker: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', lineHeight: 28 },
  heroSub: { color: '#a0b4d0', fontSize: 14, marginTop: 10, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20, flexWrap: 'wrap' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  btnText: { color: COLORS.secondary, fontSize: 14, fontWeight: '800' },
  btnOutline: { borderWidth: 1.5, borderColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  btnOutlineText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
