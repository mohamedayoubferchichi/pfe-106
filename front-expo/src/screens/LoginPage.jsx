import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../styles/theme';
import { useDarkMode } from '../hooks/useDarkMode';
import ScreenScaffold from '../components/ScreenScaffold';

export default function LoginPage({ navigation }) {
  const { t } = useTranslation();
  const { isDark } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;
  const dynamicStyles = makeStyles(colors);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizeRole = (role) => {
    if (!role) return null;
    const normalized = String(role).trim().toUpperCase();
    return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError(t('common.error'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';
      const loginEndpoints = [
        { url: `${API}/api/auth/login`, role: 'ADMIN' },
        { url: `${API}/api/auth/utilisateur/login`, role: 'UTILISATEUR' },
        { url: `${API}/api/agent/login`, role: 'AGENT' }
      ];

      let data = null;
      let matchedRole = null;
      let lastErrorMessage = t('auth.login.error') || 'Email ou mot de passe invalide.';

      for (const endpoint of loginEndpoints) {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email.trim(), password: formData.password })
        });

        const responseData = await response.json().catch(() => null);
        if (response.ok) {
          data = responseData;
          matchedRole = endpoint.role;
          break;
        }
        lastErrorMessage = responseData?.message || lastErrorMessage;
      }

      if (!data || !data.token) throw new Error(lastErrorMessage);

      const role = normalizeRole(data.role || matchedRole) || 'UTILISATEUR';
      const emailPrefix = formData.email.trim().split('@')[0] || 'user';
      const displayName = role === 'ADMIN'
        ? (t('common.admin') || 'Administrateur')
        : role === 'AGENT'
          ? (data.nom || emailPrefix)
          : data.nom || data.name || emailPrefix;

      await AsyncStorage.multiSet([
        ['token', data.token],
        ['userId', String(data.id || '')],
        ['userEmail', formData.email.trim()],
        ['userDisplayName', displayName],
        ['userRole', role]
      ]);

      if (role === 'AGENT' && data.agenceId) {
        await AsyncStorage.setItem('agentAgenceId', String(data.agenceId));
      }

      if (role === 'ADMIN') navigation.replace('Admin');
      else if (role === 'AGENT') navigation.replace('Agent');
      else navigation.replace('Profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenScaffold 
      title={t('auth.login.title')} 
      subtitle={t('auth.login.subtitle')}
    >
      <View style={dynamicStyles.form}>
        <View style={dynamicStyles.inputGroup}>
          <Text style={[dynamicStyles.label, { color: colors.textPrimary }]}>{t('auth.login.email')}</Text>
          <TextInput
            style={[dynamicStyles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="votre@email.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
          />
        </View>

        <View style={dynamicStyles.inputGroup}>
          <Text style={[dynamicStyles.label, { color: colors.textPrimary }]}>{t('auth.login.password')}</Text>
          <TextInput
            style={[dynamicStyles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="********"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={formData.password}
            onChangeText={(v) => setFormData((p) => ({ ...p, password: v }))}
          />
        </View>

        {error ? <Text style={[dynamicStyles.errorText, { color: colors.danger }]}>{error}</Text> : null}

        <Pressable 
          style={[dynamicStyles.submitBtn, { backgroundColor: colors.primary }, isSubmitting && dynamicStyles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={dynamicStyles.submitBtnText}>{t('auth.login.button')}</Text>
          )}
        </Pressable>

        <View style={dynamicStyles.footer}>
          <Text style={[dynamicStyles.footerText, { color: colors.textSecondary }]}>{t('auth.login.noAccount')} </Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={[dynamicStyles.linkText, { color: colors.primary }]}>{t('auth.login.register')}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenScaffold>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.bgSecondary,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: colors.primary,
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
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  }
});

const styles = StyleSheet.create({});