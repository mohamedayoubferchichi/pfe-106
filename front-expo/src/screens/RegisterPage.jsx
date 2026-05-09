import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../styles/theme';
import ScreenScaffold from '../components/ScreenScaffold';
import { validatePhoneNumberOrEmpty } from '../utils/phoneNumberValidator';

export default function RegisterPage({ navigation }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    telephone: '',
    cin: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name, value) => {
    let processedValue = value;
    if (name === 'cin') {
      processedValue = value.replace(/\D/g, '').slice(0, 8);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!formData.nom.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError(t('auth.register.fillError') || 'Veuillez remplir les champs obligatoires.');
      return;
    }

    const phoneCheck = validatePhoneNumberOrEmpty(formData.telephone);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.error || 'Numéro de téléphone invalide.');
      return;
    }

    setIsSubmitting(true);

    try {
      const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';
      const response = await fetch(`${API}/api/auth/utilisateur/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          telephone: phoneCheck.value,
          cin: formData.cin.trim()
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || t('auth.register.error') || 'Impossible de créer le compte.');
      }

      setSuccess(t('auth.register.success') || 'Compte créé avec succès.');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenScaffold 
      title={t('auth.register.title')} 
      subtitle={t('auth.register.subtitle')}
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('auth.register.nom')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.register.nom')}
            placeholderTextColor="#94a3b8"
            value={formData.nom}
            onChangeText={(v) => handleChange('nom', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('auth.register.email')} *</Text>
          <TextInput
            style={styles.input}
            placeholder="votre@email.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(v) => handleChange('email', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('auth.register.password')} *</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={formData.password}
            onChangeText={(v) => handleChange('password', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profile.phone')}</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: +216 12 345 678"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={formData.telephone}
            onChangeText={(v) => handleChange('telephone', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre CIN (8 chiffres)"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            maxLength={8}
            value={formData.cin}
            onChangeText={(v) => handleChange('cin', v)}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <Pressable 
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{t('auth.register.button')}</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.register.hasAccount')} </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>{t('auth.register.login')}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: '#fff',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...SHADOWS.sm,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  }
});