import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { getFirestore, collection, getDocs, doc, updateDoc, Timestamp, addDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function formatDate(ts: any) {
  if (!ts) return '-';
  if (typeof ts === 'string') return ts;
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
  return '-';
}

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(true);
  const [notifModal, setNotifModal] = useState(false);
  const [notifUser, setNotifUser] = useState<any>(null);
  const [notifMsg, setNotifMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'support'>('users');
  
  // Destek cevap modal state'leri
  const [supportResponseModal, setSupportResponseModal] = useState(false);
  const [selectedSupportMessage, setSelectedSupportMessage] = useState<any>(null);
  const [supportResponse, setSupportResponse] = useState('');
  const db = getFirestore(app);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '⚙️ Admin Paneli',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e74c3c',
      },
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#e74c3c',
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginLeft: 16,
            backgroundColor: '#f8f9fa',
            borderRadius: 12,
            padding: 8,
            borderWidth: 1,
            borderColor: '#e74c3c',
            shadowColor: '#e74c3c',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#e74c3c" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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

  const fetchSupportMessages = async () => {
    setSupportLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'support_messages'));
      const messageList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setSupportMessages(messageList);
    } catch (err) {
      setSupportMessages([]);
    }
    setSupportLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchSupportMessages();
  }, []);

  const setPremium = async (userId: string, days: number) => {
    try {
      console.log('=== PREMIUM VERME İŞLEMİ BAŞLADI ===');
      console.log('User ID:', userId);
      console.log('Gün sayısı:', days);
      
      const start = Timestamp.now();
      const end = Timestamp.fromDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
      
      console.log('Premium başlangıç tarihi:', start.toDate());
      console.log('Premium bitiş tarihi:', end.toDate());
      
      // Kullanıcı dokümanını kontrol et
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.error('Kullanıcı bulunamadı!');
        Alert.alert('Hata', 'Kullanıcı bulunamadı!');
        return;
      }
      
      console.log('Mevcut kullanıcı verisi:', userSnap.data());
      
      // Premium durumunu güncelle
      await updateDoc(userRef, {
        premium: true,
        premiumStart: start,
        premiumEnd: end,
        premiumPlan: 'Admin tarafından verildi',
        updatedAt: Timestamp.now()
      });
      
      console.log('=== PREMIUM BAŞARIYLA VERİLDİ ===');
      
      // Güncellenmiş veriyi kontrol et
      const updatedSnap = await getDoc(userRef);
      console.log('Güncellenmiş kullanıcı verisi:', updatedSnap.data());
      
      Alert.alert('Başarılı', 'Premium başlatıldı/uzatıldı!');
      fetchUsers();
    } catch (error) {
      console.error('=== PREMIUM VERME HATASI ===');
      console.error('Hata detayı:', error);
      Alert.alert('Hata', `Premium verme işlemi başarısız oldu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
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

  const handleRespondToSupport = (message: any) => {
    setSelectedSupportMessage(message);
    setSupportResponse('');
    setSupportResponseModal(true);
  };

  const sendSupportResponse = async () => {
    if (!supportResponse.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir cevap yazın!');
      return;
    }

    try {
      console.log('=== DESTEK CEVABI GÖNDERME BAŞLADI ===');
      console.log('Seçili mesaj:', selectedSupportMessage);
      console.log('Cevap:', supportResponse.trim());
      
      // Destek mesajını güncelle
      await updateDoc(doc(db, 'support_messages', selectedSupportMessage.id), {
        adminResponse: supportResponse.trim(),
        adminResponseDate: Timestamp.now(),
        status: 'answered'
      });
      
      console.log('Destek mesajı güncellendi');
      
      // Kullanıcıya bildirim gönder
      const notificationData = {
        userId: selectedSupportMessage.userId,
        email: selectedSupportMessage.userEmail,
        message: `Destek mesajınıza cevap verildi: "${supportResponse.trim()}"`,
        createdAt: Timestamp.now(),
        read: false,
        type: 'support_response'
      };
      
      console.log('Bildirim verisi:', notificationData);
      
      const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
      console.log('Bildirim gönderildi, ID:', notificationRef.id);
      
      Alert.alert('Başarılı', 'Cevap gönderildi ve kullanıcıya bildirim iletildi!');
      setSupportResponseModal(false);
      setSupportResponse('');
      setSelectedSupportMessage(null);
      fetchSupportMessages();
    } catch (error) {
      console.error('=== DESTEK CEVABI GÖNDERME HATASI ===');
      console.error('Hata detayı:', error);
      Alert.alert('Hata', `Cevap gönderilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  // Test bildirimi gönderme
  const sendTestNotification = async (message: any) => {
    try {
      console.log('=== TEST BİLDİRİMİ GÖNDERME BAŞLADI ===');
      console.log('Test mesajı:', message);
      
      const notificationData = {
        userId: message.userId,
        email: message.userEmail,
        message: '🧪 Bu bir test bildirimidir! Admin panelinden gönderildi.',
        createdAt: Timestamp.now(),
        read: false,
        type: 'test'
      };
      
      console.log('Test bildirim verisi:', notificationData);
      
      const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
      console.log('Test bildirimi gönderildi, ID:', notificationRef.id);
      
      Alert.alert('Başarılı', 'Test bildirimi gönderildi!');
    } catch (error) {
      console.error('=== TEST BİLDİRİMİ GÖNDERME HATASI ===');
      console.error('Hata detayı:', error);
      Alert.alert('Hata', `Test bildirimi gönderilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Paneli</Text>
      
      {/* Tab Butonları */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'users' && styles.activeTabButton]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'users' && styles.activeTabButtonText]}>
            👥 Kullanıcılar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'support' && styles.activeTabButton]} 
          onPress={() => setActiveTab('support')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'support' && styles.activeTabButtonText]}>
            🆘 Destek Mesajları
          </Text>
        </TouchableOpacity>
      </View>

      {/* Kullanıcılar Tab */}
      {activeTab === 'users' && (
        <>
          <Text style={styles.subtitle}>Kullanıcı Listesi</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#e74c3c" style={{ marginTop: 30 }} />
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
              ListEmptyComponent={<Text style={{ marginTop: 30, color: '#687076' }}>Kayıtlı kullanıcı yok.</Text>}
            />
          )}
        </>
      )}

      {/* Destek Mesajları Tab */}
      {activeTab === 'support' && (
        <>
          <Text style={styles.subtitle}>Destek Mesajları</Text>
          {supportLoading ? (
            <ActivityIndicator size="large" color="#e74c3c" style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={supportMessages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.supportCard}>
                  <View style={styles.supportHeader}>
                    <Text style={styles.supportUser}>{item.userName || item.userEmail}</Text>
                    <Text style={[styles.supportStatus, 
                      item.status === 'pending' ? styles.statusPending :
                      item.status === 'answered' ? styles.statusAnswered :
                      styles.statusClosed
                    ]}>
                      {item.status === 'pending' ? '⏳ Bekliyor' :
                       item.status === 'answered' ? '✅ Cevaplandı' :
                       '❌ Kapatıldı'}
                    </Text>
                  </View>
                  <Text style={styles.supportDate}>
                    {formatDate(item.createdAt)} - {item.userEmail}
                  </Text>
                  <Text style={styles.supportMessage}>{item.message}</Text>
                  
                  {item.adminResponse && (
                    <View style={styles.adminResponse}>
                      <Text style={styles.adminResponseTitle}>👨‍💼 Admin Cevabı:</Text>
                      <Text style={styles.adminResponseText}>{item.adminResponse}</Text>
                      <Text style={styles.adminResponseDate}>
                        {formatDate(item.adminResponseDate)}
                      </Text>
                    </View>
                  )}
                  
                  {item.status === 'pending' && (
                    <TouchableOpacity 
                      style={styles.respondButton} 
                      onPress={() => handleRespondToSupport(item)}
                    >
                      <Text style={styles.respondButtonText}>💬 Cevap Ver</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Test için manuel bildirim butonu */}
                  <TouchableOpacity 
                    style={[styles.respondButton, { backgroundColor: '#ff6b6b', marginTop: 8 }]} 
                    onPress={() => sendTestNotification(item)}
                  >
                    <Text style={styles.respondButtonText}>🧪 Test Bildirimi</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={{ marginTop: 30, color: '#687076' }}>Destek mesajı yok.</Text>}
            />
          )}
        </>
      )}
      <Modal visible={notifModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bildirim Gönder</Text>
            <Text style={{ marginBottom: 8, color: '#11181C' }}>{notifUser?.email}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Mesajınızı yazın..."
              value={notifMsg}
              onChangeText={setNotifMsg}
              multiline
              placeholderTextColor="#687076"
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
      
      {/* Destek Cevap Modal */}
      <Modal visible={supportResponseModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💬 Destek Mesajına Cevap Ver</Text>
            
            {selectedSupportMessage && (
              <View style={styles.supportMessagePreview}>
                <Text style={styles.supportMessagePreviewTitle}>
                  Kullanıcı: {selectedSupportMessage.userName || selectedSupportMessage.userEmail}
                </Text>
                <Text style={styles.supportMessagePreviewText}>
                  {selectedSupportMessage.message}
                </Text>
              </View>
            )}
            
            <Text style={styles.modalSubtitle}>Cevabınızı yazın:</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Cevabınızı buraya yazın..."
              value={supportResponse}
              onChangeText={setSupportResponse}
              multiline
              numberOfLines={4}
              placeholderTextColor="#687076"
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setSupportResponseModal(false);
                  setSupportResponse('');
                  setSelectedSupportMessage(null);
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]} 
                onPress={sendSupportResponse}
              >
                <Text style={styles.sendButtonText}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#e74c3c', textAlign: 'center', marginVertical: 18 },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#11181C', marginBottom: 12, textAlign: 'center' },
  userCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginVertical: 8, elevation: 2, borderWidth: 1, borderColor: '#e0e0e0' },
  userEmail: { fontSize: 16, fontWeight: 'bold', color: '#11181C' },
  userInfo: { fontSize: 15, color: '#687076', marginTop: 4 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  premiumBtn: { backgroundColor: '#e74c3c', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 2 },
  premiumBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  notifBtn: { backgroundColor: '#ffb300', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginTop: 10, alignItems: 'center' },
  notifBtnText: { color: '#11181C', fontWeight: 'bold', fontSize: 14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#e74c3c', textAlign: 'center', marginBottom: 16 },
  modalSubtitle: { fontSize: 16, color: '#11181C', marginBottom: 12, fontWeight: '600' },
  modalInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, minHeight: 100, backgroundColor: '#f8f9fa', fontSize: 16, color: '#11181C', textAlignVertical: 'top', marginBottom: 20 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e0e0e0' },
  sendButton: { backgroundColor: '#e74c3c' },
  cancelButtonText: { color: '#687076', fontSize: 16, fontWeight: 'bold' },
  sendButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  supportMessagePreview: { backgroundColor: '#f8f9fa', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  supportMessagePreviewTitle: { fontSize: 14, fontWeight: 'bold', color: '#11181C', marginBottom: 8 },
  supportMessagePreviewText: { fontSize: 14, color: '#11181C', lineHeight: 20 },
  
  // Tab stilleri
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#e74c3c',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#687076',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  
  // Destek mesajları stilleri
  supportCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  supportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supportUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#11181C',
  },
  supportStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  statusAnswered: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusClosed: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  supportDate: {
    fontSize: 12,
    color: '#687076',
    marginBottom: 8,
  },
  supportMessage: {
    fontSize: 14,
    color: '#11181C',
    lineHeight: 20,
    marginBottom: 12,
  },
  adminResponse: {
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
  },
  adminResponseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 4,
  },
  adminResponseText: {
    fontSize: 14,
    color: '#11181C',
    lineHeight: 20,
    marginBottom: 4,
  },
  adminResponseDate: {
    fontSize: 12,
    color: '#687076',
    fontStyle: 'italic',
  },
  respondButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  respondButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
});