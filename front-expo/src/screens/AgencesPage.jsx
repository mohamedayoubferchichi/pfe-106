import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable, Linking, Picker } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../styles/theme';
import ScreenScaffold from '../components/ScreenScaffold';

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80';
const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

export default function AgencesPage() {
  const { t, i18n } = useTranslation();
  const isEn = String(i18n.resolvedLanguage || i18n.language || 'fr').toLowerCase().startsWith('en');

  const [agences, setAgences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    fetch(`${API}/api/agences`)
      .then((res) => res.json())
      .then((data) => setAgences(Array.isArray(data) ? data : []))
      .catch(() => setAgences([]))
      .finally(() => setIsLoading(false));
  }, []);

  const cityOptions = useMemo(() => {
    const cities = [...new Set(
      agences
        .map((item) => String(item.ville || '').trim())
        .filter(Boolean)
    )];
    return cities.sort((a, b) => a.localeCompare(b, isEn ? 'en' : 'fr'));
  }, [agences, isEn]);

  const filteredAgences = useMemo(() => {
    if (selectedCity === 'all') {
      return agences;
    }
    return agences.filter((item) => String(item.ville || '').trim() === selectedCity);
  }, [agences, selectedCity]);

  const handleCall = (num) => {
    if (num) Linking.openURL(`tel:${num.replace(/\s+/g, '')}`);
  };

  return (
    <ScreenScaffold 
      title={isEn ? 'Find the nearest AssurGo agency' : 'Trouvez l\'agence AssurGo la plus proche'}
      subtitle={isEn ? 'Meet our advisors in person across Tunisia.' : 'Rencontrez nos conseillers dans chaque région de Tunisie.'}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: HERO_IMAGE_URL }} style={styles.heroImage} />

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{agences.length}</Text>
            <Text style={styles.metricLabel}>{isEn ? 'Agencies' : 'Agences'}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{cityOptions.length}</Text>
            <Text style={styles.metricLabel}>{isEn ? 'Cities' : 'Villes'}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>24/7</Text>
            <Text style={styles.metricLabel}>Support</Text>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>{isEn ? 'Nearby agencies' : 'Agences proches'}</Text>
          
          <View style={styles.filterWrapper}>
            <Text style={styles.filterLabel}>{isEn ? 'City' : 'Ville'}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCity}
                onValueChange={(itemValue) => setSelectedCity(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label={isEn ? 'All cities' : 'Toutes les villes'} value="all" />
                {cityOptions.map((city) => (
                  <Picker.Item key={city} label={city} value={city} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : agences.length === 0 ? (
          <Text style={styles.emptyText}>{isEn ? 'No agency available.' : 'Aucune agence disponible.'}</Text>
        ) : filteredAgences.length === 0 ? (
          <Text style={styles.emptyText}>{isEn ? 'No agency matches this city yet.' : 'Aucune agence ne correspond à cette ville.'}</Text>
        ) : (
          <View style={styles.agencesGrid}>
            {filteredAgences.map((item) => (
              <View key={item.id || item.nomAgence} style={styles.agenceCard}>
                <View style={styles.agenceHeader}>
                  <Text style={styles.agenceName}>{item.nomAgence || 'AssurGo'}</Text>
                  <Text style={styles.agenceCity}>{item.ville || '-'}</Text>
                </View>
                <View style={styles.agenceBody}>
                  <Text style={styles.infoText}>📍 {item.adresse || '-'}</Text>
                  <Pressable onPress={() => handleCall(item.telephone)}>
                    <Text style={styles.phoneText}>📞 {item.telephone || '-'}</Text>
                  </Pressable>
                  <Text style={styles.infoText}>🕒 {item.horaires || '-'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  filterSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  filterWrapper: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  picker: {
    height: 50,
  },
  agencesGrid: {
    gap: 16,
  },
  agenceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  agenceHeader: {
    backgroundColor: COLORS.bgPrimary,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  agenceName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  agenceCity: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  agenceBody: {
    padding: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  phoneText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 20,
    fontSize: 14,
  }
});