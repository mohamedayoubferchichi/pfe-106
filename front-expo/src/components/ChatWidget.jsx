import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ChatWidget() {
  const { t } = useTranslation();

  return (
    <View style={styles.widget}>
      <Text style={styles.title}>{t('chat.title', 'Chat')}</Text>
      <Text style={styles.text}>
        {t('chat.mobileHint', 'Le chat mobile est disponible sur la page Chat.')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    borderRadius: 12,
    backgroundColor: '#eef8f2',
    padding: 14
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#184632'
  },
  text: {
    marginTop: 6,
    color: '#2d5d4a',
    lineHeight: 20
  }
});
