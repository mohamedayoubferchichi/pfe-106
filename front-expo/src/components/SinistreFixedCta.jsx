import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export default function SinistreFixedCta() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('DeclarationSinistre')}
      >
        <Text style={styles.label}>{t('sinistre.declare', 'Declarer un sinistre')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8
  },
  button: {
    backgroundColor: '#0b6e4f',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  label: {
    color: '#fff',
    fontWeight: '700'
  }
});
