import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { authStorage } from '../hooks/useAuthStorage';
import { COLORS, SHADOWS } from '../styles/theme';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8080';

export default function ChatPage({ navigation, route }) {
  const routeFilter = route?.params?.targetRoleFilter;
  const headerTitle = route?.params?.headerTitle;
  const targetRoleFilter = Array.isArray(routeFilter)
    ? routeFilter
    : routeFilter
      ? [routeFilter]
      : null;
  const normalizedRoleFilter = targetRoleFilter
    ? targetRoleFilter.map((role) => String(role).toUpperCase())
    : null;
  const [partners, setPartners] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState({});
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [token, setToken] = useState(null);
  const flatListRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await authStorage.getToken();
      if (!t) {
        navigation.replace('Login');
        return;
      }
      const uid = await AsyncStorage.getItem('userId');
      const role = await AsyncStorage.getItem('userRole');
      const name = await AsyncStorage.getItem('userDisplayName');
      if (!cancelled) {
        setToken(t);
        setUserId(uid);
        setUserRole(role);
        setUserName(name);
      }
    })();
    return () => { cancelled = true; };
  }, [navigation]);

  const fetchUnread = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const r = await axios.get(`${API}/api/chat/unread-by-partner/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setUnread(r.data || {});
    } catch {}
  }, [userId, token]);

  const fetchPartners = useCallback(async () => {
    if (!userId || !userRole || !token) return;
    try {
      const r = await axios.get(`${API}/api/chat/interlocutors/${userId}/${userRole}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = Array.isArray(r.data) ? r.data : [];
      const filtered = normalizedRoleFilter
        ? data.filter((item) => normalizedRoleFilter.includes(String(item?.role || '').toUpperCase()))
        : data;
      setPartners(filtered);
      if (filtered.length > 0 && (!selected || !filtered.some((item) => item.id === selected?.id))) {
        setSelected(filtered[0]);
      }
    } catch {} finally { setLoading(false); }
  }, [userId, userRole, token, normalizedRoleFilter, selected]);

  const fetchMessages = useCallback(async (partnerId) => {
    if (!partnerId || !userId || !token) return;
    setMsgsLoading(true);
    try {
      const r = await axios.get(`${API}/api/chat/conversation/${userId}/${partnerId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(Array.isArray(r.data) ? r.data : []);
      // Mark as read
      await axios.post(`${API}/api/chat/mark-read`, { receiverId: userId, senderId: partnerId },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }).catch(() => {});
      fetchUnread();
    } catch { setMessages([]); } finally { setMsgsLoading(false); }
  }, [userId, token, fetchUnread]);

  useEffect(() => { if (userId && token) { fetchPartners(); fetchUnread(); } }, [userId, token, fetchPartners, fetchUnread]);
  useEffect(() => { if (selected) fetchMessages(selected.id); }, [selected, fetchMessages]);

  // Polling for new messages
  useEffect(() => {
    if (!selected || !userId || !token) return;
    pollRef.current = setInterval(() => { fetchMessages(selected.id); fetchUnread(); }, 10000);
    return () => clearInterval(pollRef.current);
  }, [selected, userId, token, fetchMessages, fetchUnread]);

  const handleSend = async () => {
    if (!text.trim() || !selected || sending) return;
    setSending(true);
    try {
      const msg = {
        senderId: userId, senderName: userName || '', senderRole: userRole || 'UTILISATEUR',
        receiverId: selected.id, receiverName: selected.name, receiverRole: selected.role, content: text.trim(),
      };
      const r = await axios.post(`${API}/api/chat/send`, msg,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      setMessages(prev => [...prev, r.data]);
      setText('');
    } catch (err) { console.error('Send error:', err); } finally { setSending(false); }
  };

  const fmtTime = (d) => { try { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;

  // Partner list view
  if (!selected) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
        <View style={s.header}><Text style={s.headerTitle}>{headerTitle || '💬 Messagerie'}</Text></View>
        {partners.length === 0 ? (
          <View style={s.center}><Text style={s.emptyText}>Aucun contact disponible.</Text></View>
        ) : (
          <FlatList data={partners} keyExtractor={p => String(p.id)} renderItem={({ item }) => (
            <Pressable style={s.partnerRow} onPress={() => setSelected(item)}>
              <View style={s.avatar}><Text style={s.avatarText}>{(item.name || '?')[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.partnerName}>{item.name}</Text>
                <Text style={s.partnerRole}>{item.role}</Text>
              </View>
              {(unread[item.id] || 0) > 0 && (
                <View style={s.badge}><Text style={s.badgeText}>{unread[item.id] > 9 ? '9+' : unread[item.id]}</Text></View>
              )}
            </Pressable>
          )} />
        )}
      </SafeAreaView>
    );
  }

  // Conversation view
  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {/* Chat header */}
        <View style={s.chatHeader}>
          <Pressable onPress={() => setSelected(null)} style={s.backBtn}><Text style={s.backText}>←</Text></Pressable>
          <View style={s.avatar}><Text style={s.avatarText}>{(selected.name || '?')[0]}</Text></View>
          <View><Text style={s.chatHeaderName}>{selected.name}</Text><Text style={s.chatHeaderRole}>{selected.role}</Text></View>
        </View>

        {/* Messages */}
        {msgsLoading && messages.length === 0 ? (
          <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : messages.length === 0 ? (
          <View style={s.center}><Text style={{ fontSize: 32 }}>💬</Text><Text style={s.emptyText}>Aucun message. Écrivez le premier !</Text></View>
        ) : (
          <FlatList ref={flatListRef} data={messages} keyExtractor={(m, i) => String(m.id || i)}
            contentContainerStyle={{ padding: 12, gap: 6 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isMine = String(item.senderId) === String(userId);
              return (
                <View style={[s.msgRow, isMine ? s.msgRowSent : s.msgRowReceived]}>
                  <View style={[s.msgBubble, isMine ? s.bubbleSent : s.bubbleReceived]}>
                    <Text style={[s.msgText, isMine && { color: '#fff' }]}>{item.content}</Text>
                    <Text style={[s.msgTime, isMine && { color: 'rgba(255,255,255,0.6)' }]}>{fmtTime(item.createdAt)}</Text>
                  </View>
                </View>
              );
            }} />
        )}

        {/* Input */}
        <View style={s.inputBar}>
          <TextInput style={s.input} value={text} onChangeText={setText} placeholder="Écrire un message..."
            placeholderTextColor="#999" onSubmitEditing={handleSend} returnKeyType="send" />
          <Pressable style={[s.sendBtn, !text.trim() && { opacity: 0.4 }]} onPress={handleSend} disabled={!text.trim() || sending}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.sendIcon}>➤</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  header: { backgroundColor: COLORS.secondary, paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: '#fff' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  partnerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  partnerRole: { fontSize: 12, color: COLORS.textSecondary },
  badge: { backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.secondary, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  chatHeaderName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  chatHeaderRole: { color: '#a0b4d0', fontSize: 11 },
  msgRow: { flexDirection: 'row' },
  msgRowSent: { justifyContent: 'flex-end' },
  msgRowReceived: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleSent: { backgroundColor: COLORS.secondary, borderBottomRightRadius: 4 },
  bubbleReceived: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 19 },
  msgTime: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafbfc', color: COLORS.textPrimary },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' },
});
