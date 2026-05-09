import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';

import { COLORS, SHADOWS } from '../styles/theme';
import { useDarkMode } from '../hooks/useDarkMode';
import { normalizeTypeCode } from '../utils/sinistreTypeMeta';
import { validatePhoneNumberOrEmpty } from '../utils/phoneNumberValidator';
import FormInput from '../components/FormInput';
import FormModal from '../components/FormModal';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toUpperCase();
  return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
};

const emptyAgenceForm = {
  nomAgence: '',
  ville: '',
  adresse: '',
  telephone: '',
  horaires: '',
  sotadmin: '',
  emailSotadmin: '',
  password: ''
};

const emptyContratForm = {
  cin: '',
  numeroContrat: '',
  typeContrat: '',
  dateDebutContrat: '',
  dateFinContrat: '',
  fichier: null,
  fichierName: ''
};

const emptyUserForm = {
  nom: '',
  email: '',
  password: '',
  telephone: '',
  cin: '',
  statutCompte: 'NON_VERIFIE'
};

export default function AgentPage({ navigation }) {
  const { t } = useTranslation();
  const { isDark } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;
  const dynamicStyles = makeStyles(colors);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [agenceId, setAgenceId] = useState(null);
  const [agence, setAgence] = useState(null);
  const [agenceForm, setAgenceForm] = useState(emptyAgenceForm);
  const [isAgenceModalOpen, setIsAgenceModalOpen] = useState(false);

  const [contrats, setContrats] = useState([]);
  const [contratForm, setContratForm] = useState(emptyContratForm);
  const [editingContratId, setEditingContratId] = useState(null);
  const [isContratModalOpen, setIsContratModalOpen] = useState(false);

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [sinistreTypes, setSinistreTypes] = useState([]);

  const typeOptions = useMemo(() => {
    const set = new Set(
      (sinistreTypes || [])
        .map((typeItem) => normalizeTypeCode(typeItem?.code))
        .filter(Boolean)
    );
    return Array.from(set);
  }, [sinistreTypes]);

  const stats = useMemo(() => ({
    contrats: contrats.length,
    utilisateurs: utilisateurs.length
  }), [contrats.length, utilisateurs.length]);

  const getAuthHeaders = async (isJson = false) => {
    const token = await AsyncStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
  };

  const loadData = async () => {
    try {
      setError('');
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const role = normalizeRole(await AsyncStorage.getItem('userRole'));
      if (role !== 'AGENT') {
        navigation.replace(role === 'ADMIN' ? 'Admin' : 'Profile');
        return;
      }

      const storedAgenceId = await AsyncStorage.getItem('agentAgenceId');
      if (!storedAgenceId) {
        setError(t('agent.feedback.invalidSession'));
        setIsLoading(false);
        return;
      }

      setAgenceId(storedAgenceId);

      const headers = { Authorization: `Bearer ${token}` };

      const [agenceRes, contratsRes, usersRes, typesRes] = await Promise.all([
        fetch(`${API}/api/agent/agence/${storedAgenceId}`, { headers }),
        fetch(`${API}/api/agent/contrats/${storedAgenceId}`, { headers }),
        fetch(`${API}/api/agent/utilisateurs/${storedAgenceId}`, { headers }),
        fetch(`${API}/api/sinistre-types`)
      ]);

      if (!agenceRes.ok) throw new Error(t('agent.feedback.loadAgencyError'));

      const agenceData = await agenceRes.json();
      const contratsData = contratsRes.ok ? await contratsRes.json() : [];
      const usersData = usersRes.ok ? await usersRes.json() : [];
      const typesData = typesRes.ok ? await typesRes.json() : [];

      setAgence(agenceData || null);
      setAgenceForm({
        nomAgence: agenceData?.nomAgence || '',
        ville: agenceData?.ville || '',
        adresse: agenceData?.adresse || '',
        telephone: agenceData?.telephone || '',
        horaires: agenceData?.horaires || '',
        sotadmin: agenceData?.sotadmin || '',
        emailSotadmin: agenceData?.emailSotadmin || '',
        password: ''
      });

      setContrats(Array.isArray(contratsData) ? contratsData : []);
      setUtilisateurs(Array.isArray(usersData) ? usersData : []);
      setSinistreTypes(Array.isArray(typesData) ? typesData : []);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAgenceModal = () => {
    setAgenceForm((prev) => ({
      ...prev,
      password: ''
    }));
    setIsAgenceModalOpen(true);
  };

  const handleSaveAgence = async () => {
    if (!agenceId) return;
    const phoneCheck = validatePhoneNumberOrEmpty(agenceForm.telephone);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.error || t('common.error'));
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...agenceForm,
        telephone: phoneCheck.value
      };

      const response = await fetch(`${API}/api/agent/agence/${agenceId}`, {
        method: 'PUT',
        headers: await getAuthHeaders(true),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || t('agent.feedback.saveError'));
      }

      setSuccess(t('agent.feedback.agencyUpdated'));
      setIsAgenceModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || t('agent.feedback.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetContratForm = () => {
    setContratForm(emptyContratForm);
    setEditingContratId(null);
  };

  const handlePickContratFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      setContratForm((prev) => ({
        ...prev,
        fichier: base64,
        fichierName: asset.name || 'contrat.pdf'
      }));
    } catch (err) {
      setError(err.message || t('agent.feedback.downloadError'));
    }
  };

  const handleSubmitContrat = async () => {
    if (!contratForm.cin.trim() || !contratForm.numeroContrat.trim()) {
      setError(t('agent.feedback.contractRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        cin: contratForm.cin.trim(),
        numeroContrat: contratForm.numeroContrat.trim(),
        typeContrat: contratForm.typeContrat.trim(),
        dateDebutContrat: contratForm.dateDebutContrat || null,
        dateFinContrat: contratForm.dateFinContrat || null
      };
      if (agence?.nomAgence) payload.nomAgence = agence.nomAgence;
      if (contratForm.fichier) payload.fichier = contratForm.fichier;

      const url = editingContratId ? `${API}/api/agent/contrats/${editingContratId}` : `${API}/api/agent/contrats`;
      const method = editingContratId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: await getAuthHeaders(true),
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 409) throw new Error(t('agent.feedback.numeroContratExists'));
        throw new Error(data?.message || t('agent.feedback.contractSaveError'));
      }

      setSuccess(editingContratId ? t('agent.feedback.contractUpdated') : t('agent.feedback.contractAdded'));
      setIsContratModalOpen(false);
      resetContratForm();
      await loadData();
    } catch (err) {
      setError(err.message || t('agent.feedback.contractSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditContrat = (contrat) => {
    setContratForm({
      cin: contrat?.cin || '',
      numeroContrat: contrat?.numeroContrat || '',
      typeContrat: contrat?.typeContrat || '',
      dateDebutContrat: contrat?.dateDebutContrat || '',
      dateFinContrat: contrat?.dateFinContrat || '',
      fichier: null,
      fichierName: ''
    });
    setEditingContratId(contrat?.id || null);
    setIsContratModalOpen(true);
  };

  const handleDeleteContrat = (contratId) => {
    Alert.alert(
      t('admin.modal.confirmDeleteContract'),
      t('admin.modal.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API}/api/agent/contrats/${contratId}`, {
                method: 'DELETE',
                headers: await getAuthHeaders()
              });
              if (!response.ok) throw new Error(t('agent.feedback.deleteError'));
              setSuccess(t('agent.feedback.contractDeleted'));
              await loadData();
            } catch (err) {
              setError(err.message || t('agent.feedback.deleteError'));
            }
          }
        }
      ]
    );
  };

  const resetUserForm = () => {
    setUserForm(emptyUserForm);
    setEditingUserId(null);
  };

  const handleEditUser = (user) => {
    setUserForm({
      nom: user?.nom || '',
      email: user?.email || '',
      password: '',
      telephone: user?.telephone || '',
      cin: user?.cin || '',
      statutCompte: user?.statutCompte || 'NON_VERIFIE'
    });
    setEditingUserId(user?.id || null);
    setIsUserModalOpen(true);
  };

  const handleSubmitUser = async () => {
    if (!editingUserId) return;
    if (!userForm.nom.trim() || !userForm.email.trim()) {
      setError(t('agent.feedback.userRequired'));
      return;
    }

    const phoneCheck = validatePhoneNumberOrEmpty(userForm.telephone);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.error || t('common.error'));
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        nom: userForm.nom.trim(),
        email: userForm.email.trim(),
        password: userForm.password || '',
        telephone: phoneCheck.value,
        cin: userForm.cin,
        statutCompte: userForm.statutCompte
      };

      const response = await fetch(`${API}/api/agent/utilisateurs/${editingUserId}`, {
        method: 'PUT',
        headers: await getAuthHeaders(true),
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || t('agent.feedback.userSaveError'));

      setSuccess(t('agent.feedback.userUpdated'));
      setIsUserModalOpen(false);
      resetUserForm();
      await loadData();
    } catch (err) {
      setError(err.message || t('agent.feedback.userSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      t('admin.modal.confirmDeleteUser'),
      t('agent.users.deleteDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API}/api/agent/utilisateurs/${userId}`, {
                method: 'DELETE',
                headers: await getAuthHeaders()
              });
              if (!response.ok) throw new Error(t('agent.feedback.deleteError'));
              setSuccess(t('agent.feedback.userDeleted'));
              await loadData();
            } catch (err) {
              setError(err.message || t('agent.feedback.deleteError'));
            }
          }
        }
      ]
    );
  };

  const openChat = (role) => {
    navigation.navigate('Chat', {
      targetRoleFilter: [role],
      headerTitle: role === 'ADMIN' ? t('admin.sidebar.adminMessages') : t('admin.sidebar.userMessages')
    });
  };

  const tabs = [
    { id: 'dashboard', label: t('admin.sidebar.dashboard') },
    { id: 'agence', label: t('admin.sidebar.myAgency') },
    { id: 'contrats', label: t('admin.sidebar.contracts') },
    { id: 'clients', label: t('admin.sidebar.myClients') },
    { id: 'messages', label: t('admin.sidebar.messages') }
  ];

  if (isLoading) {
    return (
      <View style={[dynamicStyles.center, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[dynamicStyles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <View style={[dynamicStyles.tabBar, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dynamicStyles.tabScroll}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[dynamicStyles.tab, activeTab === tab.id && dynamicStyles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[dynamicStyles.tabText, activeTab === tab.id && dynamicStyles.activeTabText]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={dynamicStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {!!error && <Text style={[dynamicStyles.alertText, { color: colors.danger }]}>{error}</Text>}
        {!!success && <Text style={[dynamicStyles.alertText, { color: colors.success }]}>{success}</Text>}

        {activeTab === 'dashboard' && (
          <View>
            <View style={dynamicStyles.statsGrid}>
              <View style={[dynamicStyles.statCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <Text style={[dynamicStyles.statValue, { color: colors.primary }]}>{stats.contrats}</Text>
                <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>{t('admin.sidebar.contracts')}</Text>
              </View>
              <View style={[dynamicStyles.statCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <Text style={[dynamicStyles.statValue, { color: colors.primary }]}>{stats.utilisateurs}</Text>
                <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>{t('admin.sidebar.myClients')}</Text>
              </View>
            </View>
            <Pressable style={[dynamicStyles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => openChat('UTILISATEUR')}>
              <Text style={dynamicStyles.primaryBtnText}>{t('admin.sidebar.userMessages')}</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'agence' && (
          <View>
            {!agence ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>{t('agent.agency.noneAssigned')}</Text>
            ) : (
              <View style={[dynamicStyles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary }]}>{agence.nomAgence}</Text>
                <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{agence.adresse}</Text>
                <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{agence.ville}</Text>
                <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{agence.telephone}</Text>
                <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{agence.horaires}</Text>
                <Pressable style={[dynamicStyles.secondaryBtn, { borderColor: colors.primary }]} onPress={openAgenceModal}>
                  <Text style={[dynamicStyles.secondaryBtnText, { color: colors.primary }]}>{t('common.edit')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {activeTab === 'contrats' && (
          <View>
            <Pressable style={[dynamicStyles.addBtn, { backgroundColor: colors.primary }]} onPress={() => { resetContratForm(); setIsContratModalOpen(true); }}>
              <Text style={dynamicStyles.addBtnText}>{t('admin.modal.newContract')}</Text>
            </Pressable>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary }]}>
              {t('admin.sidebar.contracts')} ({contrats.length})
            </Text>
            {contrats.length === 0 ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>{t('agent.contracts.noneForAgency')}</Text>
            ) : (
              contrats.map((c) => (
                <View key={c.id} style={[dynamicStyles.listItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.listTitle, { color: colors.textPrimary }]}>{c.numeroContrat}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>CIN: {c.cin}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>Type: {c.typeContrat || '-'}</Text>
                  </View>
                  <View style={dynamicStyles.actionRow}>
                    <Pressable onPress={() => handleEditContrat(c)}>
                      <Text style={[dynamicStyles.editBtn, { color: colors.primary }]}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteContrat(c.id)}>
                      <Text style={[dynamicStyles.deleteBtn, { color: colors.danger }]}>🗑</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'clients' && (
          <View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary }]}>
              {t('admin.sidebar.myClients')} ({utilisateurs.length})
            </Text>
            {utilisateurs.length === 0 ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>{t('agent.users.noneForAgency')}</Text>
            ) : (
              utilisateurs.map((u) => (
                <View key={u.id} style={[dynamicStyles.listItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.listTitle, { color: colors.textPrimary }]}>{u.nom}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{u.email}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{u.telephone || '-'}</Text>
                  </View>
                  <View style={dynamicStyles.actionRow}>
                    <Pressable onPress={() => handleEditUser(u)}>
                      <Text style={[dynamicStyles.editBtn, { color: colors.primary }]}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteUser(u.id)}>
                      <Text style={[dynamicStyles.deleteBtn, { color: colors.danger }]}>🗑</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'messages' && (
          <View>
            <Pressable style={[dynamicStyles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => openChat('UTILISATEUR')}>
              <Text style={dynamicStyles.primaryBtnText}>{t('admin.sidebar.userMessages')}</Text>
            </Pressable>
            <Pressable style={[dynamicStyles.secondaryBtn, { borderColor: colors.primary }]} onPress={() => openChat('ADMIN')}>
              <Text style={[dynamicStyles.secondaryBtnText, { color: colors.primary }]}>{t('admin.sidebar.adminMessages')}</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <FormModal
        visible={isAgenceModalOpen}
        title={t('admin.modal.editAgency')}
        onClose={() => setIsAgenceModalOpen(false)}
        onSubmit={handleSaveAgence}
        isLoading={isSubmitting}
        submitText={t('common.save')}
      >
        <FormInput label={t('admin.fields.agency')} value={agenceForm.nomAgence} onChangeText={(v) => setAgenceForm((p) => ({ ...p, nomAgence: v }))} required />
        <FormInput label={t('admin.fields.city')} value={agenceForm.ville} onChangeText={(v) => setAgenceForm((p) => ({ ...p, ville: v }))} />
        <FormInput label={t('admin.fields.address')} value={agenceForm.adresse} onChangeText={(v) => setAgenceForm((p) => ({ ...p, adresse: v }))} />
        <FormInput label={t('admin.fields.phone')} keyboardType="phone-pad" value={agenceForm.telephone} onChangeText={(v) => setAgenceForm((p) => ({ ...p, telephone: v }))} />
        <FormInput label={t('admin.fields.hours')} value={agenceForm.horaires} onChangeText={(v) => setAgenceForm((p) => ({ ...p, horaires: v }))} />
        <FormInput label={t('admin.fields.agent')} value={agenceForm.sotadmin} onChangeText={(v) => setAgenceForm((p) => ({ ...p, sotadmin: v }))} />
        <FormInput label={t('admin.fields.agentEmail')} keyboardType="email-address" value={agenceForm.emailSotadmin} onChangeText={(v) => setAgenceForm((p) => ({ ...p, emailSotadmin: v }))} />
        <FormInput label={t('auth.login.password')} value={agenceForm.password} onChangeText={(v) => setAgenceForm((p) => ({ ...p, password: v }))} />
      </FormModal>

      <FormModal
        visible={isContratModalOpen}
        title={editingContratId ? t('admin.modal.editContract') : t('admin.modal.newContract')}
        onClose={() => { setIsContratModalOpen(false); resetContratForm(); }}
        onSubmit={handleSubmitContrat}
        isLoading={isSubmitting}
        submitText={editingContratId ? t('common.save') : t('admin.table.add')}
      >
        <FormInput label={t('admin.fields.cin')} placeholder={t('agent.cin.placeholder')} keyboardType="numeric" value={contratForm.cin}
          onChangeText={(v) => setContratForm((p) => ({ ...p, cin: v.replace(/\D/g, '').slice(0, 8) }))} required />
        <FormInput label={t('admin.fields.number')} value={contratForm.numeroContrat} onChangeText={(v) => setContratForm((p) => ({ ...p, numeroContrat: v }))} required />
        <FormInput label={t('admin.fields.type')} value={contratForm.typeContrat} onChangeText={(v) => setContratForm((p) => ({ ...p, typeContrat: v }))} />
        {typeOptions.length > 0 && (
          <View style={dynamicStyles.typeChipsRow}>
            {typeOptions.map((opt) => {
              const isActive = normalizeTypeCode(contratForm.typeContrat) === opt;
              return (
                <Pressable
                  key={opt}
                  style={[dynamicStyles.typeChip, isActive && { backgroundColor: colors.primary }]}
                  onPress={() => setContratForm((p) => ({ ...p, typeContrat: opt }))}
                >
                  <Text style={[dynamicStyles.typeChipText, isActive && { color: '#fff' }]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <FormInput label={t('admin.fields.startDate')} placeholder="YYYY-MM-DD" value={contratForm.dateDebutContrat} onChangeText={(v) => setContratForm((p) => ({ ...p, dateDebutContrat: v }))} />
        <FormInput label={t('admin.fields.endDate')} placeholder="YYYY-MM-DD" value={contratForm.dateFinContrat} onChangeText={(v) => setContratForm((p) => ({ ...p, dateFinContrat: v }))} />
        <Pressable style={[dynamicStyles.fileBtn, { borderColor: colors.border }]} onPress={handlePickContratFile}>
          <Text style={[dynamicStyles.fileBtnText, { color: colors.textPrimary }]}>
            {contratForm.fichierName ? `${t('agent.contracts.fileAttached')}: ${contratForm.fichierName}` : t('agent.contracts.filePdf')}
          </Text>
        </Pressable>
      </FormModal>

      <FormModal
        visible={isUserModalOpen}
        title={t('admin.modal.editProfile')}
        onClose={() => { setIsUserModalOpen(false); resetUserForm(); }}
        onSubmit={handleSubmitUser}
        isLoading={isSubmitting}
        submitText={t('common.save')}
      >
        <FormInput label={t('admin.fields.username')} value={userForm.nom} onChangeText={(v) => setUserForm((p) => ({ ...p, nom: v }))} required />
        <FormInput label={t('admin.fields.email')} keyboardType="email-address" value={userForm.email} onChangeText={(v) => setUserForm((p) => ({ ...p, email: v }))} required />
        <FormInput label={t('auth.login.password')} value={userForm.password} onChangeText={(v) => setUserForm((p) => ({ ...p, password: v }))} />
        <FormInput label={t('admin.fields.phone')} keyboardType="phone-pad" value={userForm.telephone} onChangeText={(v) => setUserForm((p) => ({ ...p, telephone: v }))} />
        <FormInput label={t('admin.fields.cin')} keyboardType="numeric" value={userForm.cin} onChangeText={(v) => setUserForm((p) => ({ ...p, cin: v.replace(/\D/g, '').slice(0, 8) }))} />
        <FormInput label={t('admin.fields.status')} value={userForm.statutCompte} onChangeText={(v) => setUserForm((p) => ({ ...p, statutCompte: v }))} />
      </FormModal>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { borderBottomWidth: 1, paddingVertical: 8 },
  tabScroll: { paddingHorizontal: 12, gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.bgPrimary },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  activeTabText: { color: '#fff', fontWeight: '700' },
  content: { paddingHorizontal: 12, paddingVertical: 12 },
  alertText: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', marginVertical: 24 },
  addBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  listItem: { borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  listDesc: { fontSize: 12, marginBottom: 2 },
  actionRow: { flexDirection: 'row', gap: 12 },
  editBtn: { fontSize: 18 },
  deleteBtn: { fontSize: 18 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 6 },
  primaryBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12, marginBottom: 12, ...SHADOWS.sm },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
  typeChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeChip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border },
  typeChipText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  fileBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  fileBtnText: { fontSize: 12, fontWeight: '600' }
});