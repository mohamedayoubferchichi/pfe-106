import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  RefreshControl,
  Modal,
  SafeAreaView,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../styles/theme';
import { useDarkMode } from '../hooks/useDarkMode';
import ScreenScaffold from '../components/ScreenScaffold';
import FormInput from '../components/FormInput';

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = String(role).trim().toUpperCase();
  return normalized.startsWith('ROLE_') ? normalized.slice(5) : normalized;
};

const defaultSinistreGuaranteesRaw = [
  '🛡️|Responsabilite civile|Protection essentielle pour couvrir les dommages causes a des tiers.',
  '🚘|Tous risques|Une couverture complete pour proteger votre contrat au quotidien.',
  '🛠️|Assistance 24/7|Une aide rapide partout en Tunisie en cas de panne ou d accident.'
].join('\n');

const defaultSinistreGuaranteesRawEn = [
  '🛡️|Third-party liability|Essential protection to cover damages caused to third parties.',
  '🚘|Comprehensive cover|Complete protection for your policy on a daily basis.',
  '🛠️|24/7 assistance|Fast support anywhere in Tunisia in case of breakdown or accident.'
].join('\n');

const defaultSinistreServicesRaw = [
  'Declaration rapide|Declarez votre sinistre en quelques minutes depuis votre espace client.|https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  'Remorquage & assistance|Beneficiez d une assistance 24/7 en cas de panne, accident ou immobilisation.|https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'Suivi du dossier|Suivez chaque etape du traitement de votre dossier avec une visibilite claire.|https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80'
].join('\n');

const defaultSinistreServicesRawEn = [
  'Quick declaration|Report your claim in a few minutes from your customer area.|https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  'Towing & roadside assistance|Get 24/7 support in case of breakdown, accident, or immobilization.|https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'Case tracking|Follow each processing step of your file with clear visibility.|https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80'
].join('\n');

const defaultSinistreStepsRaw = [
  '01|Declarer en ligne|Remplissez le formulaire sinistre et ajoutez les photos de l accident.',
  '02|Analyse du dossier|Le dossier est analyse automatiquement puis oriente vers validation si besoin.',
  '03|Decision & indemnisation|Vous suivez la decision et le montant directement depuis votre espace client.'
].join('\n');

const defaultSinistreStepsRawEn = [
  '01|Declare online|Fill in the claim form and attach accident photos.',
  '02|Case analysis|The file is analyzed automatically, then routed for validation if needed.',
  '03|Decision & compensation|Track the decision and compensation amount directly from your customer area.'
].join('\n');

const defaultSinistreStatsRaw = [
  '24/7|Assistance routiere',
  '48h|Prise en charge initiale',
  '160|Agences partenaires',
  '95%|Clients satisfaits'
].join('\n');

const defaultSinistreStatsRawEn = [
  '24/7|Roadside assistance',
  '48h|Initial handling',
  '160|Partner agencies',
  '95%|Satisfied clients'
].join('\n');

const createEmptySinistreTypeForm = () => ({
  code: '',
  label: '',
  labelEn: '',
  pageKicker: '',
  pageKickerEn: '',
  heroTitle: '',
  heroTitleEn: '',
  heroTag: '',
  heroTagEn: '',
  heroHeadline: '',
  heroHeadlineEn: '',
  heroDescription: '',
  heroDescriptionEn: '',
  heroImageUrl: '',
  guaranteesTitle: 'Nos garanties',
  guaranteesTitleEn: 'Our coverages',
  guaranteesRaw: defaultSinistreGuaranteesRaw,
  guaranteesRawEn: defaultSinistreGuaranteesRawEn,
  servicesKicker: '',
  servicesKickerEn: '',
  servicesTitle: 'Des services penses pour votre mobilite',
  servicesTitleEn: 'Services designed for your mobility',
  servicesRaw: defaultSinistreServicesRaw,
  servicesRawEn: defaultSinistreServicesRawEn,
  flowKicker: 'Parcours sinistre',
  flowKickerEn: 'Claim journey',
  flowTitle: '',
  flowTitleEn: '',
  stepsRaw: defaultSinistreStepsRaw,
  stepsRawEn: defaultSinistreStepsRawEn,
  statsTitle: '',
  statsTitleEn: '',
  statsDescription: '',
  statsDescriptionEn: '',
  statsRaw: defaultSinistreStatsRaw,
  statsRawEn: defaultSinistreStatsRawEn
});

const createSinistreTypeFormFromItem = (typeItem) => {
  const defaults = createEmptySinistreTypeForm();
  return {
    ...defaults,
    code: typeItem?.code || '',
    label: typeItem?.label || '',
    labelEn: typeItem?.labelEn || '',
    pageKicker: typeItem?.pageKicker || '',
    pageKickerEn: typeItem?.pageKickerEn || '',
    heroTitle: typeItem?.heroTitle || '',
    heroTitleEn: typeItem?.heroTitleEn || '',
    heroTag: typeItem?.heroTag || '',
    heroTagEn: typeItem?.heroTagEn || '',
    heroHeadline: typeItem?.heroHeadline || '',
    heroHeadlineEn: typeItem?.heroHeadlineEn || '',
    heroDescription: typeItem?.heroDescription || '',
    heroDescriptionEn: typeItem?.heroDescriptionEn || '',
    heroImageUrl: typeItem?.heroImageUrl || '',
    guaranteesTitle: typeItem?.guaranteesTitle || defaults.guaranteesTitle,
    guaranteesTitleEn: typeItem?.guaranteesTitleEn || defaults.guaranteesTitleEn,
    guaranteesRaw: typeItem?.guaranteesRaw || defaults.guaranteesRaw,
    guaranteesRawEn: typeItem?.guaranteesRawEn || defaults.guaranteesRawEn,
    servicesKicker: typeItem?.servicesKicker || '',
    servicesKickerEn: typeItem?.servicesKickerEn || '',
    servicesTitle: typeItem?.servicesTitle || defaults.servicesTitle,
    servicesTitleEn: typeItem?.servicesTitleEn || defaults.servicesTitleEn,
    servicesRaw: typeItem?.servicesRaw || defaults.servicesRaw,
    servicesRawEn: typeItem?.servicesRawEn || defaults.servicesRawEn,
    flowKicker: typeItem?.flowKicker || defaults.flowKicker,
    flowKickerEn: typeItem?.flowKickerEn || defaults.flowKickerEn,
    flowTitle: typeItem?.flowTitle || '',
    flowTitleEn: typeItem?.flowTitleEn || '',
    stepsRaw: typeItem?.stepsRaw || defaults.stepsRaw,
    stepsRawEn: typeItem?.stepsRawEn || defaults.stepsRawEn,
    statsTitle: typeItem?.statsTitle || '',
    statsTitleEn: typeItem?.statsTitleEn || '',
    statsDescription: typeItem?.statsDescription || '',
    statsDescriptionEn: typeItem?.statsDescriptionEn || '',
    statsRaw: typeItem?.statsRaw || defaults.statsRaw,
    statsRawEn: typeItem?.statsRawEn || defaults.statsRawEn
  };
};

const stripDiacritics = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeSinistreTypeCode = (value) => {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase();
};

const normalizeDocumentTypeCode = (value) => {
  const normalized = stripDiacritics(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const aliases = {
    VOITURE: 'AUTO',
    AUTOMOBILE: 'AUTO',
    AUTO: 'AUTO',
    HABITATION: 'HABITATION',
    VOYAGE: 'VOYAGE',
    PREVOYANCE: 'PREVOYANCE'
  };

  return aliases[normalized] || normalized;
};

const createEmptyDocumentForm = () => ({
  typeDocument: '',
  file: null,
  fileName: ''
});

export default function AdminPage({ navigation }) {
  const { t } = useTranslation();
  const { isDark } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;
  const dynamicStyles = makeStyles(colors);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    contracts: 0,
    messages: 0,
    agences: 0,
    documents: 0,
    sinistreTypes: 0
  });

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [publications, setPublications] = useState([]);
  const [agences, setAgences] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [sinistreTypes, setSinistreTypes] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageReplies, setMessageReplies] = useState([]);
  const [replyText, setReplyText] = useState('');

  const [modalType, setModalType] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState(createEmptyDocumentForm());
  const [documentErrors, setDocumentErrors] = useState({});
  const [editingDocumentId, setEditingDocumentId] = useState(null);

  const [sinistreTypeModalOpen, setSinistreTypeModalOpen] = useState(false);
  const [sinistreTypeForm, setSinistreTypeForm] = useState(createEmptySinistreTypeForm());
  const [sinistreTypeErrors, setSinistreTypeErrors] = useState({});
  const [editingSinistreTypeId, setEditingSinistreTypeId] = useState(null);

  const [adminForm, setAdminForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [adminFormErrors, setAdminFormErrors] = useState({});

  const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return navigation.replace('Login');
      const role = normalizeRole(await AsyncStorage.getItem('userRole'));
      if (role !== 'ADMIN') {
        return navigation.replace(role === 'AGENT' ? 'Agent' : 'Profile');
      }
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, contractsRes, msgRes, pubsRes, agencesRes, docsRes, sinistreRes, profileRes] = await Promise.all([
        fetch(`${API}/api/utilisateurs`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/contrats`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/contact-messages/admin`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/publications`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/agences`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/documents`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/sinistre-types`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/admin/profile`, { headers }).then(r => r.ok ? r.json() : null)
      ]);

      setUtilisateurs(Array.isArray(usersRes) ? usersRes : []);
      setContrats(Array.isArray(contractsRes) ? contractsRes : []);
      setMessages(Array.isArray(msgRes) ? msgRes : []);
      setPublications(Array.isArray(pubsRes) ? pubsRes : []);
      setAgences(Array.isArray(agencesRes) ? agencesRes : []);
      setDocuments(Array.isArray(docsRes) ? docsRes : []);
      setSinistreTypes(Array.isArray(sinistreRes) ? sinistreRes : []);
      setAdminProfile(profileRes);
      if (profileRes?.email) {
        setAdminForm(prev => ({ ...prev, email: profileRes.email }));
      }

      setStats({
        users: Array.isArray(usersRes) ? usersRes.length : 0,
        contracts: Array.isArray(contractsRes) ? contractsRes.length : 0,
        messages: Array.isArray(msgRes) ? msgRes.filter(m => m.status === 'NOUVEAU' || m.status === 'NUEVO').length : 0,
        agences: Array.isArray(agencesRes) ? agencesRes.length : 0,
        documents: Array.isArray(docsRes) ? docsRes.length : 0,
        sinistreTypes: Array.isArray(sinistreRes) ? sinistreRes.length : 0
      });
    } catch (err) {
      console.log('Load error:', err);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateForm = () => {
    const errors = {};

    if (modalType === 'contrat') {
      if (!formData.numeroContrat?.trim()) errors.numeroContrat = 'Numéro requis';
      if (!formData.cin?.trim()) errors.cin = 'CIN requis';
      if (formData.cin && formData.cin.length !== 8) errors.cin = 'CIN doit avoir 8 chiffres';
      if (!formData.typeContrat?.trim()) errors.typeContrat = 'Type requis';
      if (!formData.dateDebut?.trim()) errors.dateDebut = 'Date début requise';
      if (!formData.dateFin?.trim()) errors.dateFin = 'Date fin requise';
    } else if (modalType === 'agence') {
      if (!formData.nomAgence?.trim()) errors.nomAgence = 'Nom requis';
      if (!formData.adresse?.trim()) errors.adresse = 'Adresse requise';
      if (!formData.ville?.trim()) errors.ville = 'Ville requise';
      if (!formData.telephone?.trim()) errors.telephone = 'Téléphone requis';
      if (!formData.email?.trim()) errors.email = 'Email requis';
      if (!formData.codeAgence?.trim()) errors.codeAgence = 'Code requis';
      if (!formData.heureOuverture?.trim()) errors.heureOuverture = 'Heure ouverture requise';
      if (!formData.heureFermeture?.trim()) errors.heureFermeture = 'Heure fermeture requise';
    } else if (modalType === 'publication') {
      if (!formData.title_fr?.trim()) errors.title_fr = 'Titre FR requis';
      if (!formData.title_en?.trim()) errors.title_en = 'Titre EN requis';
      if (!formData.content_fr?.trim()) errors.content_fr = 'Contenu FR requis';
      if (!formData.content_en?.trim()) errors.content_en = 'Contenu EN requis';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDelete = async (endpoint, id) => {
    Alert.alert('Confirmation', 'Voulez-vous vraiment supprimer?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API}${endpoint}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              Alert.alert('Succès', 'Supprimé');
              loadData();
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          } catch (e) {
            Alert.alert('Erreur', e.message);
          }
        }
      }
    ]);
  };

  const openMessageThread = async (msg) => {
    setSelectedMessage(msg);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/api/contact-messages/${msg.id}/replies`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMessageReplies(await res.json());
    } catch (e) {
      console.log(e);
    }
  };

  const handleReplyMessage = async () => {
    if (!replyText.trim()) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/api/contact-messages/${selectedMessage.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: replyText })
      });
      if (res.ok) {
        setReplyText('');
        openMessageThread(selectedMessage);
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const openFormModal = (type, data = null) => {
    setModalType(type);
    setFormData(data ? { ...data } : {});
    setFormErrors({});
  };

  const pickDocumentFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.type === 'success') {
        setDocumentForm(prev => ({ ...prev, file: res.uri, fileName: res.name }));
      }
    } catch (e) {
      console.log('Pick error', e);
      Alert.alert('Erreur', 'Impossible de selectionner le fichier');
    }
  };

  const openDocumentModal = (doc = null) => {
    setEditingDocumentId(doc?.id || null);
    setDocumentForm(doc ? { typeDocument: doc.typeDocument, file: null, fileName: doc.fileName } : createEmptyDocumentForm());
    setDocumentErrors({});
    setDocumentModalOpen(true);
  };

  const validateDocumentForm = () => {
    const errs = {};
    if (!documentForm.typeDocument || !documentForm.typeDocument.trim()) errs.typeDocument = 'Type requis';
    if (!editingDocumentId && !documentForm.file) errs.file = 'Fichier PDF requis';
    setDocumentErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitDocument = async () => {
    if (!validateDocumentForm()) {
      Alert.alert('Erreur', 'Remplir correctement le formulaire de document');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const form = new FormData();
      form.append('typeDocument', normalizeDocumentTypeCode(documentForm.typeDocument));
      if (documentForm.file) {
        const uriParts = documentForm.file.split('/');
        const name = documentForm.fileName || uriParts[uriParts.length - 1];
        form.append('file', { uri: documentForm.file, name, type: 'application/pdf' });
      }
      const method = editingDocumentId ? 'PUT' : 'POST';
      const url = editingDocumentId ? `${API}/api/documents/${editingDocumentId}` : `${API}/api/documents`;
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: form });
      if (res.ok) {
        Alert.alert('Succès', 'Document sauvegardé');
        setDocumentModalOpen(false);
        loadData();
      } else {
        const data = await res.text().catch(() => ({}));
        Alert.alert('Erreur', typeof data === 'string' ? data : 'Erreur');
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSinistreTypeModal = (item = null) => {
    setEditingSinistreTypeId(item?.id || null);
    setSinistreTypeForm(item ? createSinistreTypeFormFromItem(item) : createEmptySinistreTypeForm());
    setSinistreTypeErrors({});
    setSinistreTypeModalOpen(true);
  };

  const validateSinistreTypeForm = () => {
    const errs = {};
    if (!sinistreTypeForm.code || !sinistreTypeForm.code.trim()) errs.code = 'Code requis';
    if (!sinistreTypeForm.label || !sinistreTypeForm.label.trim()) errs.label = 'Libelle FR requis';
    if (!sinistreTypeForm.labelEn || !sinistreTypeForm.labelEn.trim()) errs.labelEn = 'Libelle EN requis';
    setSinistreTypeErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitSinistreType = async () => {
    if (!validateSinistreTypeForm()) {
      Alert.alert('Erreur', 'Remplir correctement le formulaire');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const url = editingSinistreTypeId ? `${API}/api/sinistre-types/${editingSinistreTypeId}` : `${API}/api/sinistre-types`;
      const method = editingSinistreTypeId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(sinistreTypeForm) });
      if (res.ok) {
        Alert.alert('Succès', 'Type sinistre sauvegarde');
        setSinistreTypeModalOpen(false);
        loadData();
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Erreur', data.message || 'Erreur');
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAdminProfile = async () => {
    const errs = {};
    if (!adminForm.email || !adminForm.email.includes('@')) errs.email = 'Email invalide';
    if (adminForm.newPassword && adminForm.newPassword !== adminForm.confirmNewPassword) errs.newPassword = 'Les mots de passe ne correspondent pas';
    setAdminFormErrors(errs);
    if (Object.keys(errs).length) {
      Alert.alert('Erreur', 'Corriger le formulaire admin');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/api/admin/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(adminForm) });
      if (res.ok) {
        Alert.alert('Succès', 'Profil mis a jour');
        loadData();
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Erreur', data.message || 'Erreur');
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCrudSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Remplir tous les champs');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const isEdit = !!formData.id;
      const endpoint = modalType === 'contrat' ? '/api/contrats' : modalType === 'agence' ? '/api/agences' : '/api/publications';
      const url = isEdit ? `${API}${endpoint}/${formData.id}` : `${API}${endpoint}`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        Alert.alert('Succès', isEdit ? 'Modifié' : 'Créé');
        setModalType(null);
        loadData();
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Erreur', data.message || 'Erreur de sauvegarde');
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Confirmer?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter', style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        }
      }
    ]);
  };

  if (isLoading) {
    return <View style={[dynamicStyles.center, { backgroundColor: colors.bgPrimary }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const tabs = [
    { id: 'dashboard', label: 'Tableau' },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'contracts', label: 'Contrats' },
    { id: 'messages', label: 'Messages', badge: stats.messages },
    { id: 'publications', label: 'Publications' },
    { id: 'agencies', label: 'Agences' },
    { id: 'documents', label: 'Documents', badge: stats.documents },
    { id: 'sinistreTypes', label: 'Types Sinistre', badge: stats.sinistreTypes },
    { id: 'profile', label: 'Profil Admin' },
  ];

  return (
    <SafeAreaView style={[dynamicStyles.safeArea, { backgroundColor: colors.bgPrimary }]}>
      <View style={[dynamicStyles.tabBar, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dynamicStyles.tabScroll}>
          {tabs.map(tab => (
            <Pressable
              key={tab.id}
              style={[dynamicStyles.tab, activeTab === tab.id && dynamicStyles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[dynamicStyles.tabText, activeTab === tab.id && dynamicStyles.activeTabText]}>
                {tab.label}
                {tab.badge > 0 && <Text style={dynamicStyles.badge}> ({tab.badge})</Text>}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={dynamicStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {activeTab === 'dashboard' && (
          <View>
            <View style={dynamicStyles.statsGrid}>
              {[
                { value: stats.users, label: 'Utilisateurs' },
                { value: stats.contracts, label: 'Contrats' },
                { value: stats.messages, label: 'Messages', critical: stats.messages > 0 },
                { value: stats.agences, label: 'Agences' }
              ].map((stat, i) => (
                <View key={i} style={[dynamicStyles.statCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <Text style={[dynamicStyles.statValue, { color: stat.critical ? colors.danger : colors.primary }]}>
                    {stat.value}
                  </Text>
                  <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
            <Pressable style={[dynamicStyles.logoutBtn, { backgroundColor: colors.danger }]} onPress={handleLogout}>
              <Text style={dynamicStyles.logoutBtnText}>Déconnexion</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'users' && (
          <View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary }]}>
              Utilisateurs ({utilisateurs.length})
            </Text>
            {utilisateurs.length === 0 ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>Aucun utilisateur</Text>
            ) : (
              utilisateurs.map(u => (
                <View key={u.id} style={[dynamicStyles.listItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.listTitle, { color: colors.textPrimary }]}>{u.nom}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{u.email}</Text>
                    <View style={dynamicStyles.badgeRow}>
                      <View style={[dynamicStyles.badge, { backgroundColor: colors.primary }]}>
                        <Text style={dynamicStyles.badgeText}>{u.role}</Text>
                      </View>
                      <View style={[dynamicStyles.badge, { backgroundColor: colors.success }]}>
                        <Text style={dynamicStyles.badgeText}>{u.statutCompte}</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable onPress={() => handleDelete('/api/utilisateurs', u.id)}>
                    <Text style={[dynamicStyles.deleteBtn, { color: colors.danger }]}>🗑</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'contracts' && (
          <View>
            <Pressable style={[dynamicStyles.addBtn, { backgroundColor: colors.primary }]} onPress={() => openFormModal('contrat')}>
              <Text style={dynamicStyles.addBtnText}>+ Nouveau Contrat</Text>
            </Pressable>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Contrats ({contrats.length})
            </Text>
            {contrats.length === 0 ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>Aucun contrat</Text>
            ) : (
              contrats.map(c => (
                <View key={c.id} style={[dynamicStyles.listItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.listTitle, { color: colors.textPrimary }]}>#{c.numeroContrat}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>CIN: {c.cin}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>Type: {c.typeContrat}</Text>
                  </View>
                  <View style={dynamicStyles.actionRow}>
                    <Pressable onPress={() => openFormModal('contrat', c)}>
                      <Text style={[dynamicStyles.editBtn, { color: colors.primary }]}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete('/api/contrats', c.id)}>
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
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary }]}>
              Messages ({messages.length})
            </Text>
            {messages.length === 0 ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>Aucun message</Text>
            ) : (
              messages.map(m => (
                <Pressable
                  key={m.id}
                  style={[dynamicStyles.listItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                  onPress={() => openMessageThread(m)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.listTitle, { color: colors.textPrimary }]}>{m.sujet}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>De: {m.nom}</Text>
                  </View>
                  <View style={[dynamicStyles.badge, { backgroundColor: m.status === 'NOUVEAU' || m.status === 'NUEVO' ? colors.danger : colors.success }]}>
                    <Text style={dynamicStyles.badgeText}>{m.status}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === 'publications' && (
          <View>
            <Pressable style={[dynamicStyles.addBtn, { backgroundColor: colors.primary }]} onPress={() => openFormModal('publication')}>
              <Text style={dynamicStyles.addBtnText}>+ Nouvelle Publication</Text>
            </Pressable>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Publications ({publications.length})
            </Text>
            {publications.length === 0 ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>Aucune publication</Text>
            ) : (
              publications.map(p => (
                <View key={p.id} style={[dynamicStyles.listItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.listTitle, { color: colors.textPrimary }]}>
                      {p.title_fr || p.titreFr}
                    </Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>
                      {p.title_en || p.titreEn}
                    </Text>
                  </View>
                  <View style={dynamicStyles.actionRow}>
                    <Pressable onPress={() => openFormModal('publication', p)}>
                      <Text style={[dynamicStyles.editBtn, { color: colors.primary }]}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete('/api/publications', p.id)}>
                      <Text style={[dynamicStyles.deleteBtn, { color: colors.danger }]}>🗑</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'agencies' && (
          <View>
            <Pressable style={[dynamicStyles.addBtn, { backgroundColor: colors.primary }]} onPress={() => openFormModal('agence')}>
              <Text style={dynamicStyles.addBtnText}>+ Nouvelle Agence</Text>
            </Pressable>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Agences ({agences.length})
            </Text>
            {agences.length === 0 ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>Aucune agence</Text>
            ) : (
              agences.map(a => (
                <View key={a.id} style={[dynamicStyles.listItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.listTitle, { color: colors.textPrimary }]}>{a.nomAgence}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{a.adresse}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{a.ville} - {a.telephone}</Text>
                  </View>
                  <View style={dynamicStyles.actionRow}>
                    <Pressable onPress={() => openFormModal('agence', a)}>
                      <Text style={[dynamicStyles.editBtn, { color: colors.primary }]}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete('/api/agences', a.id)}>
                      <Text style={[dynamicStyles.deleteBtn, { color: colors.danger }]}>🗑</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'documents' && (
          <View>
            <Pressable style={[dynamicStyles.addBtn, { backgroundColor: colors.primary }]} onPress={() => openDocumentModal()}>
              <Text style={dynamicStyles.addBtnText}>+ Nouveau Document</Text>
            </Pressable>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary, marginTop: 12 }]}>Documents ({documents.length})</Text>
            {documents.length === 0 ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>Aucun document</Text>
            ) : (
              documents.map(d => (
                <View key={d.id} style={[dynamicStyles.listItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.listTitle, { color: colors.textPrimary }]}>{d.fileName}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{d.typeDocument}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{d.dateCreation}</Text>
                  </View>
                  <View style={dynamicStyles.actionRow}>
                    <Pressable onPress={() => Linking.openURL(`${API}/api/documents/${d.id}/download`)}>
                      <Text style={[dynamicStyles.editBtn, { color: colors.primary }]}>⬇️</Text>
                    </Pressable>
                    <Pressable onPress={() => openDocumentModal(d)}>
                      <Text style={[dynamicStyles.editBtn, { color: colors.primary }]}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete('/api/documents', d.id)}>
                      <Text style={[dynamicStyles.deleteBtn, { color: colors.danger }]}>🗑</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'sinistreTypes' && (
          <View>
            <Pressable style={[dynamicStyles.addBtn, { backgroundColor: colors.primary }]} onPress={() => openSinistreTypeModal()}>
              <Text style={dynamicStyles.addBtnText}>+ Nouveau Type</Text>
            </Pressable>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary, marginTop: 12 }]}>Types de Sinistre ({sinistreTypes.length})</Text>
            {sinistreTypes.length === 0 ? (
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>Aucun type</Text>
            ) : (
              sinistreTypes.map(sType => (
                <View key={sType.id} style={[dynamicStyles.listItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.listTitle, { color: colors.textPrimary }]}>{sType.code} — {sType.label}</Text>
                    <Text style={[dynamicStyles.listDesc, { color: colors.textSecondary }]}>{sType.labelEn}</Text>
                  </View>
                  <View style={dynamicStyles.actionRow}>
                    <Pressable onPress={() => openSinistreTypeModal(sType)}>
                      <Text style={[dynamicStyles.editBtn, { color: colors.primary }]}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete('/api/sinistre-types', sType.id)}>
                      <Text style={[dynamicStyles.deleteBtn, { color: colors.danger }]}>🗑</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <View>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.textPrimary }]}>Profil Admin</Text>
            <FormInput label="Email" placeholder="admin@exemple.com" value={adminForm.email} onChangeText={v => setAdminForm(prev => ({ ...prev, email: v }))} error={adminFormErrors.email} keyboardType="email-address" required />
            <FormInput label="Mot de passe courant" placeholder="********" value={adminForm.currentPassword} onChangeText={v => setAdminForm(prev => ({ ...prev, currentPassword: v }))} error={adminFormErrors.currentPassword} />
            <FormInput label="Nouveau mot de passe" placeholder="********" value={adminForm.newPassword} onChangeText={v => setAdminForm(prev => ({ ...prev, newPassword: v }))} error={adminFormErrors.newPassword} />
            <FormInput label="Confirmer mot de passe" placeholder="********" value={adminForm.confirmNewPassword} onChangeText={v => setAdminForm(prev => ({ ...prev, confirmNewPassword: v }))} error={adminFormErrors.confirmNewPassword} />
            <Pressable style={[dynamicStyles.submitBtn, { backgroundColor: colors.primary }]} onPress={submitAdminProfile} disabled={isSubmitting}>
              <Text style={dynamicStyles.submitBtnText}>{isSubmitting ? '...' : 'Enregistrer'}</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MESSAGE MODAL */}
      <Modal visible={!!selectedMessage} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[dynamicStyles.modal, { backgroundColor: colors.bgPrimary }]}>
          <View style={[dynamicStyles.modalHeader, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
            <Text style={[dynamicStyles.modalTitle, { color: colors.textPrimary }]}>Message</Text>
            <Pressable onPress={() => setSelectedMessage(null)}>
              <Text style={{ fontSize: 24, color: colors.primary }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={dynamicStyles.modalBody}>
            <Text style={[dynamicStyles.msgLabel, { color: colors.textSecondary }]}>Sujet:</Text>
            <Text style={[dynamicStyles.msgText, { color: colors.textPrimary }]}>{selectedMessage?.sujet}</Text>
            <Text style={[dynamicStyles.msgLabel, { color: colors.textSecondary, marginTop: 12 }]}>Message:</Text>
            <View style={[dynamicStyles.msgBubble, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Text style={[dynamicStyles.msgText, { color: colors.textPrimary }]}>{selectedMessage?.message}</Text>
            </View>
            {messageReplies.length > 0 && (
              <View>
                <Text style={[dynamicStyles.msgLabel, { color: colors.textSecondary, marginTop: 12 }]}>Réponses:</Text>
                {messageReplies.map((r, i) => (
                  <View key={i} style={[dynamicStyles.replyBubble, { backgroundColor: colors.primary }]}>
                    <Text style={dynamicStyles.replyText}>{r.message}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
          <View style={[dynamicStyles.msgFooter, { backgroundColor: colors.bgSecondary, borderTopColor: colors.border }]}>
            <TextInput
              style={[dynamicStyles.msgInput, { backgroundColor: colors.bgPrimary, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Votre réponse..."
              placeholderTextColor={colors.textSecondary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              editable={!isSubmitting}
            />
            <Pressable style={[dynamicStyles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleReplyMessage} disabled={isSubmitting}>
              <Text style={dynamicStyles.sendBtnText}>{isSubmitting ? '...' : 'Envoyer'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* CONTRAT FORM MODAL */}
      <Modal visible={modalType === 'contrat'} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[dynamicStyles.modal, { backgroundColor: colors.bgPrimary }]}>
          <View style={[dynamicStyles.modalHeader, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
            <Text style={[dynamicStyles.modalTitle, { color: colors.textPrimary }]}>
              {formData.id ? 'Modifier Contrat' : 'Nouveau Contrat'}
            </Text>
            <Pressable onPress={() => setModalType(null)}>
              <Text style={{ fontSize: 24, color: colors.primary }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={dynamicStyles.modalBody}>
            <FormInput
              label="Numéro Contrat"
              placeholder="CNT-2024-001"
              value={formData.numeroContrat || ''}
              onChangeText={v => setFormData({ ...formData, numeroContrat: v })}
              error={formErrors.numeroContrat}
              required
            />
            <FormInput
              label="CIN Client"
              placeholder="12345678"
              value={formData.cin || ''}
              onChangeText={v => setFormData({ ...formData, cin: v })}
              error={formErrors.cin}
              keyboardType="numeric"
              required
            />
            <FormInput
              label="Type de Contrat"
              placeholder="AUTO, HABITATION, VOYAGE"
              value={formData.typeContrat || ''}
              onChangeText={v => setFormData({ ...formData, typeContrat: v })}
              error={formErrors.typeContrat}
              required
            />
            <FormInput
              label="Agence"
              placeholder="Nom agence"
              value={formData.nomAgence || ''}
              onChangeText={v => setFormData({ ...formData, nomAgence: v })}
              required
            />
            <FormInput
              label="Date Début"
              placeholder="YYYY-MM-DD"
              value={formData.dateDebut || ''}
              onChangeText={v => setFormData({ ...formData, dateDebut: v })}
              error={formErrors.dateDebut}
              required
            />
            <FormInput
              label="Date Fin"
              placeholder="YYYY-MM-DD"
              value={formData.dateFin || ''}
              onChangeText={v => setFormData({ ...formData, dateFin: v })}
              error={formErrors.dateFin}
              required
            />
            <Pressable
              style={[dynamicStyles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleCrudSubmit}
              disabled={isSubmitting}
            >
              <Text style={dynamicStyles.submitBtnText}>{isSubmitting ? '...' : 'Enregistrer'}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* AGENCE FORM MODAL */}
      <Modal visible={modalType === 'agence'} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[dynamicStyles.modal, { backgroundColor: colors.bgPrimary }]}>
          <View style={[dynamicStyles.modalHeader, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
            <Text style={[dynamicStyles.modalTitle, { color: colors.textPrimary }]}>
              {formData.id ? 'Modifier Agence' : 'Nouvelle Agence'}
            </Text>
            <Pressable onPress={() => setModalType(null)}>
              <Text style={{ fontSize: 24, color: colors.primary }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={dynamicStyles.modalBody}>
            <FormInput label="Nom Agence" placeholder="AssurGo Tunis" value={formData.nomAgence || ''} onChangeText={v => setFormData({ ...formData, nomAgence: v })} error={formErrors.nomAgence} required />
            <FormInput label="Adresse" placeholder="Rue, numéro" value={formData.adresse || ''} onChangeText={v => setFormData({ ...formData, adresse: v })} error={formErrors.adresse} required />
            <FormInput label="Ville" placeholder="Tunis" value={formData.ville || ''} onChangeText={v => setFormData({ ...formData, ville: v })} error={formErrors.ville} required />
            <FormInput label="Téléphone" placeholder="+216 XX XXX XXX" value={formData.telephone || ''} onChangeText={v => setFormData({ ...formData, telephone: v })} error={formErrors.telephone} keyboardType="phone-pad" required />
            <FormInput label="Email" placeholder="contact@agence.com" value={formData.email || ''} onChangeText={v => setFormData({ ...formData, email: v })} error={formErrors.email} keyboardType="email-address" required />
            <FormInput label="Code Agence" placeholder="AG-001" value={formData.codeAgence || ''} onChangeText={v => setFormData({ ...formData, codeAgence: v })} error={formErrors.codeAgence} required />
            <FormInput label="Heure Ouverture" placeholder="08:00" value={formData.heureOuverture || ''} onChangeText={v => setFormData({ ...formData, heureOuverture: v })} error={formErrors.heureOuverture} required />
            <FormInput label="Heure Fermeture" placeholder="18:00" value={formData.heureFermeture || ''} onChangeText={v => setFormData({ ...formData, heureFermeture: v })} error={formErrors.heureFermeture} required />
            <Pressable
              style={[dynamicStyles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleCrudSubmit}
              disabled={isSubmitting}
            >
              <Text style={dynamicStyles.submitBtnText}>{isSubmitting ? '...' : 'Enregistrer'}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* PUBLICATION FORM MODAL */}
      <Modal visible={modalType === 'publication'} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[dynamicStyles.modal, { backgroundColor: colors.bgPrimary }]}>
          <View style={[dynamicStyles.modalHeader, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
            <Text style={[dynamicStyles.modalTitle, { color: colors.textPrimary }]}>
              {formData.id ? 'Modifier Publication' : 'Nouvelle Publication'}
            </Text>
            <Pressable onPress={() => setModalType(null)}>
              <Text style={{ fontSize: 24, color: colors.primary }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={dynamicStyles.modalBody}>
            <FormInput label="Titre FR" placeholder="Titre en français" value={formData.title_fr || formData.titreFr || ''} onChangeText={v => setFormData({ ...formData, title_fr: v, titreFr: v })} error={formErrors.title_fr} required />
            <FormInput label="Titre EN" placeholder="Title in English" value={formData.title_en || formData.titreEn || ''} onChangeText={v => setFormData({ ...formData, title_en: v, titreEn: v })} error={formErrors.title_en} required />
            <FormInput label="Contenu FR" placeholder="Contenu en français" value={formData.content_fr || formData.contentFr || ''} onChangeText={v => setFormData({ ...formData, content_fr: v, contentFr: v })} error={formErrors.content_fr} multiline required />
            <FormInput label="Contenu EN" placeholder="Content in English" value={formData.content_en || formData.contentEn || ''} onChangeText={v => setFormData({ ...formData, content_en: v, contentEn: v })} error={formErrors.content_en} multiline required />
            <FormInput label="Type (Optionnel)" placeholder="NEWS, ARTICLE" value={formData.typePublication || ''} onChangeText={v => setFormData({ ...formData, typePublication: v })} />
            <FormInput label="Statut (Optionnel)" placeholder="ACTIVE, DRAFT" value={formData.statusPublication || ''} onChangeText={v => setFormData({ ...formData, statusPublication: v })} />
            <Pressable
              style={[dynamicStyles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleCrudSubmit}
              disabled={isSubmitting}
            >
              <Text style={dynamicStyles.submitBtnText}>{isSubmitting ? '...' : 'Enregistrer'}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  badge: { fontSize: 10, color: colors.danger, fontWeight: 'bold' },
  content: { paddingHorizontal: 12, paddingVertical: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 32, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  logoutBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  logoutBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', marginVertical: 24 },
  addBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  listItem: { borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  listDesc: { fontSize: 12, marginBottom: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12 },
  editBtn: { fontSize: 18 },
  deleteBtn: { fontSize: 18 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { flex: 1, padding: 16 },
  msgLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgBubble: { borderRadius: 8, borderWidth: 1, padding: 12, marginVertical: 8 },
  replyBubble: { borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 8, alignSelf: 'flex-end', maxWidth: '85%' },
  replyText: { color: '#fff', fontSize: 13 },
  msgFooter: { paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  msgInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 80, textAlignVertical: 'top' },
  sendBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  submitBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

const styles = StyleSheet.create({});
