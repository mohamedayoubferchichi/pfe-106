import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../styles/theme';
import ScreenScaffold from '../components/ScreenScaffold';

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=80';

export default function AssistancePage({ navigation }) {
  const { t, i18n } = useTranslation();
  const isEn = String(i18n.resolvedLanguage || i18n.language || 'fr').toLowerCase().startsWith('en');

  const contacts = [
    { icon: '🚗', title: isEn ? 'Car assistance' : 'Assistance Automobile', number: '70 255 001', desc: isEn ? '24/7 roadside support' : 'Disponible 24h/24 et 7j/7' },
    { icon: '🏠', title: isEn ? 'Home assistance' : 'Assistance Habitation', number: '70 255 002', desc: isEn ? 'Emergency locksmith/plumbing' : 'Urgence serrurerie, plomberie' },
    { icon: '✈️', title: isEn ? 'Travel assistance' : 'Assistance Voyage', number: '+216 70 255 003', desc: isEn ? 'Medical support abroad' : 'Support médical et rapatriement' },
  ];

  const handleCall = (num) => {
    Linking.openURL(`tel:${num.replace(/\s+/g, '')}`);
  };

  return (
    <ScreenScaffold 
      title={isEn ? 'We are here for you, 24/7' : 'Nous sommes là pour vous, 24h/24 et 7j/7'}
      subtitle={isEn ? 'Expert teams mobilised for your safety.' : 'Nos équipes d\'experts mobilisées pour votre sécurité.'}
    >
      <View style={styles.container}>
        <Image source={{ uri: HERO_IMAGE_URL }} style={styles.heroImage} />
        
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>{isEn ? 'Emergency numbers' : 'Numéros d\'urgence'}</Text>
          <View style={styles.contactsGrid}>
            {contacts.map((item) => (
              <Pressable key={item.title} style={styles.contactCard} onPress={() => handleCall(item.number)}>
                <Text style={styles.contactIcon}>{item.icon}</Text>
                <View style={styles.contactBody}>
                  <Text style={styles.contactTitle}>{item.title}</Text>
                  <Text style={styles.contactNumber}>{item.number}</Text>
                  <Text style={styles.contactDesc}>{item.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>{isEn ? 'How it works?' : 'Comment ça marche ?'}</Text>
          <Text style={styles.ctaDesc}>
            {isEn 
              ? 'Locate the nearest provider in under 45 minutes.' 
              : 'Localisez le prestataire le plus proche en moins de 45 minutes.'}
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Contact')}>
            <Text style={styles.primaryButtonText}>{isEn ? 'Contact Support' : 'Contacter le Support'}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
  },
  section: {
    gap: 12,
  },
  sectionKicker: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactsGrid: {
    gap: 12,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  contactIcon: {
    fontSize: 32,
  },
  contactBody: {
    flex: 1,
    gap: 4,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  contactNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  contactDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ctaCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  ctaDesc: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  }
});