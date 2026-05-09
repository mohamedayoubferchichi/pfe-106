import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ScrollView, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../styles/theme';
import ScreenScaffold from '../components/ScreenScaffold';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

const getAvatarLabel = (nom, email) => {
  const source = (nom || email || 'U').trim();
  if (!source) return 'U';
  const words = source.replace(/@.*/, '').split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

const getClaimReference = (sinistre, index) => {
  const rawId = String(sinistre?.id || '').trim();
  if (rawId) {
    const cleaned = rawId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const suffix = cleaned.slice(-8) || String(index + 1).padStart(4, '0');
    return `SIN-${suffix}`;
  }
  return `SIN-${String(index + 1).padStart(4, '0')}`;
};

const getClaimStatusMeta = (status, t) => {
  const normalized = String(status || '').trim().toUpperCase();
  const closedStatuses = ['APPROVED', 'REJECTED', 'CLOTURE', 'CLOTURÉ', 'CLOSED'];
  if (closedStatuses.includes(normalized)) {
    return {
      className: 'history-status-closed',
      label: t('profile.claims.closed')
    };
  }
  return {
    className: 'history-status-open',
    label: t('profile.claims.ongoing')
  };
};

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toUpperCase();
  return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
};

export default function ProfilePage({ navigation }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [sinistres, setSinistres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    cin: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const role = normalizeRole(await AsyncStorage.getItem('userRole'));
      if (role === 'ADMIN') {
        navigation.replace('Admin');
        return;
      }
      if (role === 'AGENT') {
        navigation.replace('Agent');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Load Profile
      const pRes = await fetch(`${API}/api/utilisateurs/me`, { headers });
      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData);
      }

      // Load Sinistres
      const sRes = await fetch(`${API}/api/sinistres/me`, { headers });
      if (sRes.ok) {
        const sData = await sRes.json();
        setSinistres(Array.isArray(sData) ? sData : []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditModal = () => {
    setEditForm({
      nom: profile?.nom || '',
      email: profile?.email || '',
      telephone: profile?.telephone || '',
      cin: profile?.cin || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async () => {
    setEditError('');
    setEditSuccess('');

    if (!editForm.nom.trim() || !editForm.email.trim()) {
      setEditError('Nom et email sont obligatoires.');
      return;
    }

    const hasPasswordChange = editForm.newPassword.trim().length > 0 || editForm.confirmNewPassword.trim().length > 0;

    if (hasPasswordChange) {
      if (!editForm.newPassword.trim()) {
        setEditError('Le nouveau mot de passe est requis.');
        return;
      }
      if (!editForm.confirmNewPassword.trim()) {
        setEditError('Confirmation du mot de passe requise.');
        return;
      }
      if (editForm.newPassword !== editForm.confirmNewPassword) {
        setEditError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (!editForm.currentPassword.trim()) {
        setEditError('Le mot de passe actuel est requis pour changer le mot de passe.');
        return;
      }
    }

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      const payload = {
        nom: editForm.nom,
        email: editForm.email,
        telephone: editForm.telephone,
        cin: editForm.cin
      };

      if (hasPasswordChange) {
        payload.currentPassword = editForm.currentPassword;
        payload.newPassword = editForm.newPassword;
      }

      const res = await fetch(`${API}/api/utilisateurs/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur lors de la mise à jour.');
      }

      setEditSuccess('Profil mis à jour avec succès.');
      await loadData();
      setTimeout(() => setIsEditModalOpen(false), 1000);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <ScreenScaffold title="Erreur" subtitle="">
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.logoutBtnText}>Retour à la connexion</Text>
        </Pressable>
      </ScreenScaffold>
    );
  }

  const avatarLabel = getAvatarLabel(profile?.nom, profile?.email);

  return (
    <ScreenScaffold title={profile?.nom || t('profile.title')} subtitle={profile?.email || ''}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Avatar Hero */}
        <View style={styles.heroRow}>
          <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.avatarText}>{avatarLabel}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{profile?.nom}</Text>
            <Text style={styles.heroRole}>{t('profile.verified')}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.contrats?.length || 0}</Text>
            <Text style={styles.statLabel}>{t('profile.contracts.title')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{sinistres.length}</Text>
            <Text style={styles.statLabel}>{t('profile.claims.title')}</Text>
          </View>
        </View>

        {/* Info Panel */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t('profile.personalInfo')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('auth.register.email')}</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
            <Text style={styles.infoValue}>{profile?.telephone || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CIN</Text>
            <Text style={styles.infoValue}>{profile?.cin || '-'}</Text>
          </View>
        </View>

        {/* Claims Section */}
        {sinistres.length > 0 && (
          <View style={styles.claimsSection}>
            <Text style={styles.panelTitle}>{t('profile.claims.title')}</Text>
            {sinistres.map((sinistre, idx) => {
              const meta = getClaimStatusMeta(sinistre.status, t);
              return (
                <View key={sinistre.id || idx} style={styles.claimCard}>
                  <View style={styles.claimHeader}>
                    <Text style={styles.claimRef}>{getClaimReference(sinistre, idx)}</Text>
                    <Text style={[styles.claimStatus, meta.className === 'history-status-closed' ? styles.statusClosed : styles.statusOpen]}>
                      {meta.label}
                    </Text>
                  </View>
                  <View style={styles.claimBody}>
                    <Text style={styles.claimDetail}>
                      Contrat: <Text style={styles.claimValue}>{sinistre.numeroContrat || '-'}</Text>
                    </Text>
                    <Text style={styles.claimDetail}>
                      Date: <Text style={styles.claimValue}>{sinistre.dateDeclaration ? new Date(sinistre.dateDeclaration).toLocaleDateString('fr-FR') : '-'}</Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Actions */}
        <Pressable style={styles.editBtn} onPress={handleOpenEditModal}>
          <Text style={styles.editBtnText}>✎ {t('common.edit') || 'Modifier'}</Text>
        </Pressable>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>{t('nav.logout')}</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <Pressable onPress={() => setIsEditModalOpen(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {editError && <Text style={styles.errorMsg}>{editError}</Text>}
              {editSuccess && <Text style={styles.successMsg}>{editSuccess}</Text>}

              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={editForm.nom}
                onChangeText={(text) => setEditForm({ ...editForm, nom: text })}
                placeholder="Votre nom"
                editable={!isSaving}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="votre@email.com"
                keyboardType="email-address"
                editable={!isSaving}
              />

              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={editForm.telephone}
                onChangeText={(text) => setEditForm({ ...editForm, telephone: text })}
                placeholder="+216..."
                keyboardType="phone-pad"
                editable={!isSaving}
              />

              <Text style={styles.inputLabel}>CIN</Text>
              <TextInput
                style={styles.input}
                value={editForm.cin}
                onChangeText={(text) => setEditForm({ ...editForm, cin: text })}
                placeholder="Votre CIN"
                editable={!isSaving}
              />

              <Text style={styles.divider}>Changer le mot de passe (optionnel)</Text>

              <Text style={styles.inputLabel}>Mot de passe actuel</Text>
              <TextInput
                style={styles.input}
                value={editForm.currentPassword}
                onChangeText={(text) => setEditForm({ ...editForm, currentPassword: text })}
                placeholder="Mot de passe actuel"
                secureTextEntry
                editable={!isSaving}
              />

              <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                value={editForm.newPassword}
                onChangeText={(text) => setEditForm({ ...editForm, newPassword: text })}
                placeholder="Nouveau mot de passe"
                secureTextEntry
                editable={!isSaving}
              />

              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.input}
                value={editForm.confirmNewPassword}
                onChangeText={(text) => setEditForm({ ...editForm, confirmNewPassword: text })}
                placeholder="Confirmez le mot de passe"
                secureTextEntry
                editable={!isSaving}
              />

              <Pressable
                style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]}
                onPress={handleSubmitEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Enregistrer les modifications</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
  },
  container: {
    gap: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  heroText: {
    gap: 4,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  heroRole: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontWeight: '800',
    fontSize: 16,
  },
  editBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  claimsSection: {
    gap: 12,
    marginTop: 20,
  },
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  claimHeader: {
    backgroundColor: COLORS.bgPrimary,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  claimRef: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  claimStatus: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusOpen: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  statusClosed: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
  },
  claimBody: {
    padding: 12,
    gap: 6,
  },
  claimDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  claimValue: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  divider: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  errorMsg: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
  },
  successMsg: {
    color: '#388e3c',
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 8,
  }
});