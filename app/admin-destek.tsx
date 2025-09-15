import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDocs, getFirestore, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { app } from '../firebaseConfig';

type UserItem = { id: string; email?: string; firstName?: string; lastName?: string };
type ChatMessage = { id: string; userId: string; text: string; createdAt: any; from: 'user' | 'admin'; read?: boolean };

export default function AdminDestek() {
  const insets = useSafeAreaInsets();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadUsers();
    const unsub = subscribeUnread();
    return () => unsub && unsub();
  }, []);

  const loadUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserItem[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setUsers(list);
    } catch (e) {
      console.error('Kullanıcılar yüklenemedi:', e);
    }
  };

  const subscribeUnread = () => {
    const q = query(collection(db, 'supportChat'));
    return onSnapshot(q, (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach(d => {
        const data = d.data() as any;
        if (data.from === 'user' && !data.read) {
          counts[data.userId] = (counts[data.userId] || 0) + 1;
        }
      });
      setUnreadCounts(counts);
    });
  };

  useEffect(() => {
    if (!selectedUser) return;
    const q = query(collection(db, 'supportChat'), where('userId', '==', selectedUser.id));
    const unsub = onSnapshot(q, async (snap) => {
      const list: ChatMessage[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0);
        const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0);
        return aTime - bTime;
      });
      setMessages(list);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 0);
      // Kullanıcının okunmamış mesajlarını okundu işaretle
      const unread = snap.docs.filter(d => {
        const data = d.data() as any;
        return data.from === 'user' && !data.read;
      });
      if (unread.length > 0) {
        for (const msg of unread) {
          try {
            await updateDoc(doc(db, 'supportChat', msg.id), { read: true, readAt: serverTimestamp() });
          } catch {}
        }
      }
      // Not: Mesaj dokümanlarını "read: true" yapmak için admin aksiyonunda ayrı bir endpoint/
      // burada anlık değişiklik istemiyorsanız bu kısmı aktif edebilirsiniz.
      // Bu örnekte yalnızca unread sayacı subscribeUnread ile azalır (snap değişimini tetiklerse).
    });
    return () => unsub();
  }, [selectedUser?.id]);

  const sendMessage = async () => {
    if (!selectedUser || !input.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'supportChat'), {
        userId: selectedUser.id,
        text: input.trim(),
        createdAt: serverTimestamp(),
        from: 'admin',
        read: false,
      });
      // Kullanıcıya bildirim kaydı ekle
      await addDoc(collection(db, 'notifications'), {
        title: 'Yeni Destek Mesajı',
        message: input.trim(),
        type: 'support',
        from: 'admin',
        to: 'user',
        userId: selectedUser.id,
        createdAt: serverTimestamp(),
        read: false,
        status: 'unread'
      });
      setInput('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
    } catch (e) {
      console.error('Mesaj gönderilemedi:', e);
    } finally {
      setSending(false);
    }
  };

  const sendTemplate = async (template: 'resolved' | 'received') => {
    const text = template === 'resolved'
      ? '✅ Sorununuz çözüldü. Yardıma ihtiyaç olursa tekrar yazabilirsiniz.'
      : '📩 Sorununuz alındı. Çözülünce size dönüş sağlayacağız.';
    setInput(text);
    await sendMessage();
  };

  const renderUser = ({ item }: { item: UserItem }) => (
    <TouchableOpacity style={[styles.userItem, selectedUser?.id === item.id && styles.userItemActive]} onPress={() => setSelectedUser(item)}>
      <Ionicons name="person-circle" size={28} color={selectedUser?.id === item.id ? '#ffffff' : '#0a7ea4'} />
      <View style={styles.userTextBox}>
        <Text style={[styles.userTitle, selectedUser?.id === item.id && styles.userTitleActive]}>
          {item.firstName || item.lastName ? `${item.firstName || ''} ${item.lastName || ''}`.trim() : (item.email || 'Kullanıcı')}
        </Text>
        {!!item.email && <Text style={[styles.userSubtitle, selectedUser?.id === item.id && styles.userSubtitleActive]}>{item.email}</Text>}
      </View>
      {!!unreadCounts[item.id] && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isAdmin = item.from === 'admin';
    return (
      <View style={[styles.bubble, isAdmin ? styles.adminBubble : styles.userBubble]}>
        <Text style={isAdmin ? styles.adminMessageText : styles.userMessageText}>{item.text}</Text>
      </View>
    );
  };

  const keyboardOffset = useMemo(() => insets.top + 56, [insets.top]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={keyboardOffset}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Admin Destek</Text>
      </View>

      <View style={styles.body}>
        {showSidebar && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Kullanıcılar</Text>
              <View style={styles.filterTabs}>
                <TouchableOpacity style={[styles.tabBtn, filter === 'all' && styles.tabBtnActive]} onPress={() => setFilter('all')}>
                  <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>Tümü</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, filter === 'unread' && styles.tabBtnActive]} onPress={() => setFilter('unread')}>
                  <Text style={[styles.tabText, filter === 'unread' && styles.tabTextActive]}>Okunmayan</Text>
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={users.filter(u => filter === 'all' ? true : (unreadCounts[u.id] || 0) > 0)}
              keyExtractor={(u) => u.id}
              renderItem={renderUser}
              contentContainerStyle={styles.sidebarList}
            />
          </View>
        )}

        <View style={styles.chatPane}>
          <View style={styles.chatTopBar}>
            <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowSidebar(s => !s)}>
              <Ionicons name={showSidebar ? 'chevron-back' : 'menu'} size={22} color="#0a7ea4" />
            </TouchableOpacity>
          </View>
          {selectedUser ? (
            <>
              <View style={styles.chatHeader}> 
                <Text style={styles.chatTitle}>{selectedUser.firstName || selectedUser.lastName ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() : (selectedUser.email || 'Kullanıcı')}</Text>
                <View style={styles.templates}>
                  <TouchableOpacity style={[styles.templateBtn, styles.templateOk]} onPress={() => sendTemplate('resolved')}>
                    <Text style={styles.templateText}>Sorun Çözüldü</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.templateBtn, styles.templateInfo]} onPress={() => sendTemplate('received')}>
                    <Text style={styles.templateText}>Sorun Alındı</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(m) => m.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatList}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              />

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Mesaj yazın..."
                  value={input}
                  onChangeText={setInput}
                  multiline
                />
                <TouchableOpacity style={[styles.sendButton, (sending || !input.trim()) && styles.sendButtonDisabled]} onPress={sendMessage} disabled={sending || !input.trim()}>
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.placeholder}> 
              <Ionicons name="people" size={56} color="#bdc3c7" />
              <Text style={styles.placeholderText}>Soldan bir kullanıcı seçiniz</Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { backgroundColor: '#0a7ea4', paddingBottom: 12, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 220, borderRightWidth: 1, borderRightColor: '#e0e0e0', backgroundColor: '#fff' },
  sidebarHeader: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff' },
  sidebarTitle: { fontSize: 14, fontWeight: 'bold', color: '#0a7ea4', padding: 12 },
  filterTabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  tabBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eef6fa' },
  tabBtnActive: { backgroundColor: '#0a7ea4' },
  tabText: { color: '#0a7ea4', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  sidebarList: { paddingBottom: 12 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  userItemActive: { backgroundColor: '#0a7ea4' },
  userTextBox: { marginLeft: 8, flex: 1 },
  userTitle: { color: '#2c3e50', fontWeight: '600' },
  userTitleActive: { color: '#ffffff' },
  userSubtitle: { color: '#7f8c8d', fontSize: 12 },
  userSubtitleActive: { color: 'rgba(255,255,255,0.8)' },
  unreadBadge: { backgroundColor: '#e74c3c', minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  chatPane: { flex: 1, backgroundColor: '#f5f7fb' },
  chatTopBar: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  toggleBtn: { padding: 6, borderRadius: 8 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
  chatTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  templates: { flexDirection: 'row', gap: 8 },
  templateBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  templateOk: { backgroundColor: '#27ae60' },
  templateInfo: { backgroundColor: '#3498db' },
  templateText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  chatList: { padding: 12 },
  bubble: { maxWidth: '75%', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, marginVertical: 6 },
  adminBubble: { alignSelf: 'flex-start', backgroundColor: '#0a7ea4' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#e9ecef' },
  adminMessageText: { color: '#fff' },
  userMessageText: { color: '#2c3e50' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: '#fff' },
  input: { flex: 1, minHeight: 40, maxHeight: 120, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', marginRight: 8 },
  sendButton: { backgroundColor: '#0a7ea4', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  sendButtonDisabled: { opacity: 0.6 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#888', marginTop: 8 },
});


