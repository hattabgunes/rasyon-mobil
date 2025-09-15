import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, getFirestore, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { app } from '../firebaseConfig';

type ChatMessage = {
  id: string;
  userId: string;
  userEmail?: string;
  text: string;
  createdAt: any;
  from: 'user' | 'admin';
  read?: boolean;
};

export default function DestekChat() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, 'supportChat'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: ChatMessage[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0);
        const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0);
        return aTime - bTime;
      });
      setMessages(list);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 0);
    }, (e) => {
      console.error('Mesajlar yüklenemedi:', e);
    });
    return () => unsub();
  }, []);

  const sendMessage = async () => {
    const user = auth.currentUser;
    if (!user || !input.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'supportChat'), {
        userId: user.uid,
        userEmail: user.email,
        text: input.trim(),
        createdAt: serverTimestamp(),
        from: 'user',
        read: false,
      });
      // Admin'e okunmayan bildirim kaydı
      await addDoc(collection(db, 'notifications'), {
        title: 'Yeni Destek Mesajı',
        message: input.trim(),
        type: 'support',
        from: 'user',
        to: 'admin',
        userId: user.uid,
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

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.from === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.adminBubble]}>
        {!isUser && <Text style={styles.adminLabel}>Admin</Text>}
        <Text style={isUser ? styles.userMessageText : styles.adminMessageText}>{item.text}</Text>
      </View>
    );
  };

  const navHeaderHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const keyboardOffset = useMemo(() => {
    // Sayfa içi özel başlık yaklaşık 56px + native header yüksekliği
    return Math.ceil(navHeaderHeight + insets.top + 56);
  }, [navHeaderHeight, insets.top]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardOffset}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Destek</Text>
            <Text style={styles.headerSubtitle}>Admin ile sohbet</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
      </View>

      {/* Arka plan dekorları */}
      <View style={styles.bgDecorContainer} pointerEvents="none">
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>Destek ekibine mesaj gönderin.</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={[styles.sendButton, (sending || !input.trim()) && styles.sendButtonDisabled]} onPress={sendMessage} disabled={sending || !input.trim()}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: {
    backgroundColor: '#0a7ea4',
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: { padding: 6 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  headerDecor1: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 140,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 70,
  },
  headerDecor2: {
    position: 'absolute',
    left: -40,
    bottom: -50,
    width: 180,
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 90,
  },
  bgDecorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 120,
    bottom: 0,
  },
  bgCircle1: {
    position: 'absolute',
    right: 20,
    top: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f4f8',
  },
  bgCircle2: {
    position: 'absolute',
    left: -10,
    top: 180,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eef6fa',
  },
  bgCircle3: {
    position: 'absolute',
    right: -20,
    bottom: 120,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f0f8fb',
  },
  listContent: { padding: 12 },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0a7ea4',
  },
  adminBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
  },
  adminLabel: { fontSize: 12, color: '#555', marginBottom: 4 },
  userMessageText: { color: '#fff' },
  adminMessageText: { color: '#333' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendButtonDisabled: { opacity: 0.6 },
  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#888', marginTop: 8 },
});


