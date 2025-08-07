import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { getFirestore, collection, getDocs, doc, updateDoc, Timestamp, addDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

function formatDate(ts: any) {
  if (!ts) return '-';
  if (typeof ts === 'string') return ts;
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
  return '-';
}

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifModal, setNotifModal] = useState(false);
  const [notifUser, setNotifUser] = useState<any>(null);
  const [notifMsg, setNotifMsg] = useState('');
  const db = getFirestore(app);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    } catch (err) {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const setPremium = async (userId: string, days: number) => {
    const start = Timestamp.now();
    const end = Timestamp.fromDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
    await updateDoc(doc(db, 'users', userId), {
      premium: true,
      premiumStart: start,
      premiumEnd: end,
    });
    Alert.alert('Başarılı', 'Premium başlatıldı/uzatıldı!');
    fetchUsers();
  };

  const removePremium = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), {
      premium: false,
      premiumStart: null,
      premiumEnd: null,
    });
    Alert.alert('Başarılı', 'Premium kaldırıldı!');
    fetchUsers();
  };

  const sendNotification = async () => {
    if (!notifMsg.trim()) {
      Alert.alert('Uyarı', 'Mesaj boş olamaz!');
      return;
    }
    await addDoc(collection(db, 'notifications'), {
      userId: notifUser.id,
      email: notifUser.email,
      message: notifMsg,
      createdAt: Timestamp.now(),
      read: false,
    });
    setNotifModal(false);
    setNotifMsg('');
    Alert.alert('Başarılı', 'Bildirim gönderildi!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Paneli</Text>
      <Text style={styles.subtitle}>Kullanıcı Listesi</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4F8EF7" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userInfo}>Premium: {item.premium ? '✅' : '❌'}</Text>
              {item.premium && (
                <Text style={styles.userInfo}>
                  Başlangıç: {formatDate(item.premiumStart)}
                  {'\n'}Bitiş: {formatDate(item.premiumEnd)}
                </Text>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.premiumBtn} onPress={() => setPremium(item.id, 30)}>
                  <Text style={styles.premiumBtnText}>Premium 1 Ay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.premiumBtn} onPress={() => setPremium(item.id, 7)}>
                  <Text style={styles.premiumBtnText}>+7 Gün</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.premiumBtn, { backgroundColor: '#e53935' }]} onPress={() => removePremium(item.id)}>
                  <Text style={[styles.premiumBtnText, { color: '#fff' }]}>Premium Kaldır</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.notifBtn} onPress={() => { setNotifUser(item); setNotifModal(true); }}>
                <Text style={styles.notifBtnText}>Bildirim Gönder</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{ marginTop: 30, color: '#888' }}>Kayıtlı kullanıcı yok.</Text>}
        />
      )}
      <Modal visible={notifModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bildirim Gönder</Text>
            <Text style={{ marginBottom: 8, color: '#333' }}>{notifUser?.email}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Mesajınızı yazın..."
              value={notifMsg}
              onChangeText={setNotifMsg}
              multiline
              placeholderTextColor="#888"
            />
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity style={[styles.premiumBtn, { flex: 1 }]} onPress={sendNotification}>
                <Text style={styles.premiumBtnText}>Gönder</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.premiumBtn, { backgroundColor: '#bbb', flex: 1, marginLeft: 8 }]} onPress={() => setNotifModal(false)}>
                <Text style={[styles.premiumBtnText, { color: '#222' }]}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4F8EF7', textAlign: 'center', marginVertical: 18 },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 12, textAlign: 'center' },
  userCard: { backgroundColor: '#f2f6fc', borderRadius: 12, padding: 16, marginVertical: 8, elevation: 2 },
  userEmail: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  userInfo: { fontSize: 15, color: '#444', marginTop: 4 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  premiumBtn: { backgroundColor: '#4F8EF7', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 2 },
  premiumBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  notifBtn: { backgroundColor: '#ffb300', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginTop: 10, alignItems: 'center' },
  notifBtnText: { color: '#222', fontWeight: 'bold', fontSize: 14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 22, width: 320, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#4F8EF7', marginBottom: 10 },
  modalInput: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 10, minHeight: 60, width: 260, backgroundColor: '#f9f9f9', fontSize: 16, color: '#222', textAlignVertical: 'top' },
});