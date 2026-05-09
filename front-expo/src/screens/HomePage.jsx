import { useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../styles/theme';

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80';

export default function HomePage({ navigation }) {
  const { t, i18n } = useTranslation();
  const isEn = String(i18n.resolvedLanguage || i18n.language || 'fr').toLowerCase().startsWith('en');
  const scrollRef = useRef(null);
  const [productsY, setProductsY] = useState(0);

  const products = useMemo(
    () => [
      {
        icon: '🚗',
        title: t('home.products.items.voiture.title'),
        desc: t('home.products.items.voiture.desc'),
        to: 'MaVoiture'
      },
      {
        icon: '🏠',
        title: t('home.products.items.habitation.title'),
        desc: t('home.products.items.habitation.desc'),
        to: 'MonHabitation'
      },
      {
        icon: '✈️',
        title: t('home.products.items.voyage.title'),
        desc: t('home.products.items.voyage.desc'),
        to: 'MonVoyage'
      },
      {
        icon: '🛡️',
        title: t('home.products.items.prevoyance.title'),
        desc: t('home.products.items.prevoyance.desc'),
        to: 'MaPrevoyance'
      }
    ],
    [t]
  );

  return (
    <View style={styles.screen}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <ImageBackground source={{ uri: HERO_IMAGE_URL }} style={styles.heroBg} imageStyle={styles.heroBgImage}>
            <View style={styles.heroOverlay}>
              <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>{t('home.hero.title')}</Text>
                <Text style={styles.heroSubtitle}>{t('home.hero.subtitle')}</Text>
                <Text style={styles.heroDesc}>{t('home.hero.desc')}</Text>
                
                <Pressable 
                  style={styles.ctaButton} 
                  onPress={() => scrollRef.current?.scrollTo({ y: productsY, animated: true })}
                >
                  <Text style={styles.ctaButtonText}>{t('common.discover')}</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Products Section */}
        <View 
          style={styles.section}
          onLayout={(event) => setProductsY(event.nativeEvent.layout.y)}
        >
          <Text style={styles.sectionKicker}>{t('home.products.kicker')}</Text>
          <Text style={styles.sectionTitle}>{t('home.products.title')}</Text>

          <View style={styles.productGrid}>
            {products.map((item) => (
              <Pressable key={item.title} style={styles.productCard} onPress={() => navigation.navigate(item.to)}>
                <Text style={styles.productIcon}>{item.icon}</Text>
                <Text style={styles.productTitle}>{item.title}</Text>
                <Text style={styles.productDesc}>{item.desc}</Text>
                <View style={styles.productFooter}>
                   <Text style={styles.learnMore}>{t('common.readMore')}</Text>
                   <Text style={styles.arrow}>→</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* News Section */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>{t('home.news.kicker')}</Text>
          <Text style={styles.sectionTitle}>{t('home.news.title')}</Text>
          
          <View style={styles.newsCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80' }} 
              style={styles.newsImage} 
            />
            <View style={styles.newsBody}>
              <Text style={styles.newsTag}>{t('home.news.tag')}</Text>
              <Text style={styles.newsTitle}>{t('home.news.cardTitle')}</Text>
              <Text style={styles.newsDesc}>{t('home.news.cardDesc')}</Text>
              <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Bulletin')}>
                <Text style={styles.secondaryButtonText}>{t('home.news.link')}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Demarches Section */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>{t('home.demarches.kicker')}</Text>
          <Text style={styles.sectionTitle}>{t('home.demarches.title')}</Text>
          
          <View style={styles.demarchesGrid}>
            {[
              {
                title: t('home.demarches.items.auto.title'),
                desc: t('home.demarches.items.auto.desc'),
              },
              {
                title: t('home.demarches.items.hab.title'),
                desc: t('home.demarches.items.hab.desc'),
              },
              {
                title: t('home.demarches.items.constat.title'),
                desc: t('home.demarches.items.constat.desc'),
              }
            ].map((item) => (
              <View key={item.title} style={styles.demarche}>
                <Text style={styles.demarcheTitle}>{item.title}</Text>
                <Text style={styles.demarcheDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsLeft}>
            <Text style={styles.sectionKicker}>{t('home.stats.kicker')}</Text>
            <Text style={styles.sectionTitle}>{t('home.stats.title')}</Text>
            <Text style={styles.statsDesc}>{t('home.stats.desc')}</Text>
          </View>
          
          <View style={styles.statsGrid}>
            {[
              { value: '65', label: t('home.stats.items.exp') },
              { value: '160', label: t('home.stats.items.agences') },
              { value: '500+', label: t('home.stats.items.collab') },
              { value: '24/7', label: t('home.stats.items.assist') }
            ].map((item) => (
              <View key={item.label} style={styles.statItem}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pillars Section */}
        <View style={styles.pillarsSection}>
          {[
            { icon: '🏆', label: t('home.footerTop.pro') },
            { icon: '💡', label: t('home.footerTop.innov') },
            { icon: '🛡️', label: t('home.footerTop.assist') }
          ].map((p) => (
            <View key={p.label} style={styles.pillarCard}>
              <Text style={styles.pillarIcon}>{p.icon}</Text>
              <Text style={styles.pillarLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* Pulse Banner */}
        <View style={styles.pulseBanner}>
          <Text style={styles.pulseText}>
            {isEn
              ? 'AssurGo — protecting Tunisians for over 65 years'
              : 'AssurGo — protecteur des Tunisiens depuis plus de 65 ans'}
          </Text>
        </View>

        {/* Footer info (Mirroring Web) */}
        <View style={styles.footerInfo}>
           <Text style={styles.footerBrand}>AssurGo</Text>
           <Text style={styles.footerTagline}>{t('footer.address1')}</Text>
           <Text style={styles.footerCopyright}>© 2026 AssurGo {t('common.brand')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  content: {
    paddingBottom: 40,
  },
  hero: {
    height: 500,
  },
  heroBg: {
    flex: 1,
  },
  heroBgImage: {
    // Mirroring web gradient + image
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 22, 46, 0.4)',
    padding: 20,
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.md,
    maxWidth: 400,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0b1a45',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  ctaButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  section: {
    padding: 24,
  },
  sectionKicker: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#071b4a',
    textAlign: 'center',
    marginBottom: 24,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  productCard: {
    width: '47%', // roughly 2 columns
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  productIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  productDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  learnMore: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  arrow: {
    fontSize: 16,
    color: COLORS.primary,
  },
  newsCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  newsImage: {
    width: '100%',
    height: 200,
  },
  newsBody: {
    padding: 20,
  },
  newsTag: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  newsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  newsDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  footerInfo: {
    padding: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerBrand: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 10,
  },
  footerTagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  footerCopyright: {
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.6,
  },
  demarchesGrid: {
    gap: 16,
  },
  demarche: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  demarcheTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  demarcheDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  statsSection: {
    backgroundColor: '#f5f5f5',
    padding: 24,
    gap: 24,
  },
  statsDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  pillarsSection: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: 8,
  },
  pillarIcon: {
    fontSize: 32,
  },
  pillarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  pulseBanner: {
    backgroundColor: COLORS.primary,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 16,
    marginVertical: 20,
  },
  pulseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  }
});