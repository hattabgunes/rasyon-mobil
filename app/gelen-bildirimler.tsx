import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, getFirestore, orderBy, query, updateDoc, doc, where } from 'firebase/firestore';
import { app } from '../firebaseConfig';

type SupportItem = {
  id: string;
  userId: string;
  userEmail?: string;
  message: string;
  createdAt?: any;
  status?: 'pending' | 'resolved' | 'in_progress';
  read?: boolean;
};

export default function GelenBildirimler() {
  const router = useRouter();
  const db = getFirestore(app);

  const [items, setItems] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pending' | 'resolved'>('all');

  const loadItems = async () => {
    try {
      setLoading(true);
      const baseQuery = query(collection(db, 'support'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(baseQuery);
      const data: SupportItem[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(data);
    } catch (error) {
      console.error('Gelen bildirimler yüklenemedi:', error);
      Alert.alert('Hata', 'Gelen bildirimler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, []);

  const markRead = async (id: string, read: boolean) => {
    try {
      await updateDoc(doc(db, 'support', id), { read, updatedAt: new Date() });
      setItems(prev => prev.map(it => (it.id === id ? { ...it, read } : it)));
    } catch (e) {
      console.error('Okunma durumu güncellenemedi:', e);
      Alert.alert('Hata', 'Okunma durumu güncellenemedi.');
    }
  };

  const setStatus = async (id: string, status: 'pending' | 'resolved' | 'in_progress') => {
    try {
      await updateDoc(doc(db, 'support', id), { status, updatedAt: new Date() });
      setItems(prev => prev.map(it => (it.id === id ? { ...it, status } : it)));
    } catch (e) {
      console.error('Durum güncellenemedi:', e);
      Alert.alert('Hata', 'Durum güncellenemedi.');
    }
  };

  const formatTs = (ts: any) => {
    try {
      if (!ts) return '-';
      const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
      return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR')}`;
    } catch {
      return '-';
    }
  };

  const filteredItems = items.filter(it => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !it.read;
    if (filter === 'pending') return (it.status || 'pending') === 'pending';
    if (filter === 'resolved') return it.status === 'resolved';
    return true;
  });

  const renderItem = ({ item }: { item: SupportItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.email}>{item.userEmail || 'Bilinmeyen e-posta'}</Text>
          <Text style={styles.date}>{formatTs(item.createdAt)}</Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, item.read ? styles.badgeRead : styles.badgeUnread]}>
            <Text style={styles.badgeText}>{item.read ? 'Okundu' : 'Okunmadı'}</Text>
          </View>
          <View style={[styles.badge, item.status === 'resolved' ? styles.badgeResolved : item.status === 'in_progress' ? styles.badgeInProgress : styles.badgePending]}>
            <Text style={styles.badgeText}>{item.status === 'resolved' ? 'Çözüldü' : item.status === 'in_progress' ? 'İşlemde' : 'Beklemede'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.message}>{item.message}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => markRead(item.id, !item.read)}>
          <Ionicons name={item.read ? 'mail-open' : 'mail'} size={16} color={item.read ? '#2ecc71' : '#2980b9'} />
          <Text style={[styles.actionText, { color: item.read ? '#2ecc71' : '#2980b9' }]}>{item.read ? 'Okunmadı yap' : 'Okundu yap'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => setStatus(item.id, 'in_progress')}>
          <Ionicons name="time" size={16} color="#ffffff" />
          <Text style={[styles.actionText, styles.primaryText]}>İşlemde</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.successBtn]} onPress={() => setStatus(item.id, 'resolved')}>
          <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
          <Text style={[styles.actionText, styles.primaryText]}>Çözüldü</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📥 Gelen Bildirimler</Text>
          <Text style={styles.headerSubtitle}>Kullanıcı destek mesajlarını görüntüle</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterRow}>
        {([
          { key: 'all', label: 'Tümü' },
          { key: 'unread', label: 'Okunmamış' },
          { key: 'pending', label: 'Beklemede' },
          { key: 'resolved', label: 'Çözüldü' },
        ] as { key: typeof filter; label: string }[]).map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-unread" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>Gösterilecek bildirim yok</Text>
            <Text style={styles.emptySubtext}>Kullanıcılar destek mesajı gönderdiğinde burada görünecek</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  filterBtnActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  email: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  badgeUnread: { backgroundColor: '#f39c12' },
  badgeRead: { backgroundColor: '#2ecc71' },
  badgePending: { backgroundColor: '#e67e22' },
  badgeInProgress: { backgroundColor: '#3498db' },
  badgeResolved: { backgroundColor: '#27ae60' },
  message: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryBtn: {
    backgroundColor: '#ecf0f1',
  },
  primaryBtn: {
    backgroundColor: '#2980b9',
  },
  successBtn: {
    backgroundColor: '#27ae60',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});


