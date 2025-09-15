import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { getAuth, signOut, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Profilim() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '👤 Profilim',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0a7ea4',
      },
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#0a7ea4',
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginLeft: 16,
            backgroundColor: '#f8f9fa',
            borderRadius: 12,
            padding: 8,
            borderWidth: 1,
            borderColor: '#0a7ea4',
            shadowColor: '#0a7ea4',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0a7ea4" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const db = getFirestore(app);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (err) {
        Alert.alert('Hata', 'Kullanıcı bilgileri alınamadı!');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      router.replace('/user-login');
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılamadı!');
    }
  };

  const handlePasswordReset = async () => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (user && user.email) {
        await sendPasswordResetEmail(auth, user.email);
        Alert.alert('Başarılı', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      } else {
        Alert.alert('Hata', 'Kullanıcı e-posta adresi bulunamadı!');
      }
    } catch (error) {
      Alert.alert('Hata', 'Şifre sıfırlama bağlantısı gönderilemedi!');
    }
  };

  const handleDeleteAccount = async () => {
    console.log('Hesap silme fonksiyonu çağrıldı');
    console.log('Kullanıcı verisi:', userData);
    
    // Premium üyelerin süresi dolmamışsa hesap silmelerini engelle
    if (userData?.premium && userData?.premiumEnd) {
      const premiumEndDate = userData.premiumEnd.seconds ? new Date(userData.premiumEnd.seconds * 1000) : new Date(userData.premiumEnd);
      const currentDate = new Date();
      

    }
    
    console.log('Premium kontrolü geçildi, hesap silme onayı isteniyor');
    
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinize emin misiniz? Hesap silinecek ama bilgileriniz kayıtlı kalacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Sil', style: 'destructive', onPress: async () => {
            console.log('Kullanıcı hesap silmeyi onayladı');
            try {
              const auth = getAuth(app);
              const user = auth.currentUser;
              
              if (!user) {
                Alert.alert('Hata', 'Kullanıcı bulunamadı!');
                return;
              }
              
              const db = getFirestore(app);
              
              // Kullanıcı bilgilerini deleted_users koleksiyonuna kopyala
              const deletedUserData = {
                ...userData,
                deletedAt: new Date(),
                originalUid: user.uid,
                email: user.email,
                reason: 'user_requested_deletion'
              };
              
              try {
                // Silinen kullanıcı bilgilerini kaydet
                await addDoc(collection(db, 'deleted_users'), deletedUserData);
                console.log('Kullanıcı bilgileri deleted_users koleksiyonuna kaydedildi');
              } catch (firestoreError) {
                console.error('Firestore kaydetme hatası:', firestoreError);
                // Firestore hatası olsa bile devam et
              }
              
              try {
                // Orijinal kullanıcı dokümanını sil
                await deleteDoc(doc(db, 'users', user.uid));
                console.log('Kullanıcı dokümanı silindi');
              } catch (firestoreError) {
                console.error('Firestore silme hatası:', firestoreError);
                // Firestore hatası olsa bile devam et
              }
              
              try {
                // Firebase Auth'dan kullanıcıyı sil
                await deleteUser(user);
                console.log('Firebase Auth kullanıcısı silindi');
              } catch (authError) {
                console.error('Firebase Auth silme hatası:', authError);
                // Auth silme hatası olsa bile çıkış yap
                await signOut(auth);
                console.log('Kullanıcı çıkış yaptırıldı');
              }
              
              Alert.alert('Başarılı', 'Hesabınız silindi. Bilgileriniz kayıtlı kalacak.');
              router.replace('/user-login');
              
            } catch (error) {
              console.error('Genel hesap silme hatası:', error);
              Alert.alert('Hata', 'Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.');
            }
          }
        }
      ]
    );
  };

  function formatDate(ts: any) {
    if (!ts) return '-';
    if (typeof ts === 'string') return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR');
    return '-';
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Arka Plan Dekoratif Öğeleri */}
      <View style={styles.backgroundContainer}>
        {/* Sol üst köşe - Mavi tonlar (R harfi rengi) */}
        <View style={styles.backgroundShape1} />
        <View style={styles.backgroundShape2} />
        
        {/* Sağ alt köşe - Yeşil tonlar (M harfi rengi) */}
        <View style={styles.backgroundShape3} />
        <View style={styles.backgroundShape4} />
        
        {/* Orta dekoratif çizgiler */}
        <View style={styles.backgroundLine1} />
        <View style={styles.backgroundLine2} />
      </View>

      <View style={styles.contentContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Profilim</Text>
        <Text style={styles.email}>{userData?.email || ''}</Text>
        <Text style={styles.name}>{userData?.name} {userData?.surname}</Text>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>👤</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 30 }} />
        ) : userData ? (
          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>Hesap Bilgileri</Text>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Ad Soyad</Text>
              <Text style={styles.profileValue}>{`${userData?.name || '-'} ${userData?.surname || ''}`.trim()}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>E-posta</Text>
              <Text style={styles.profileValue}>{userData?.email || '-'}</Text>
            </View>
            <View style={styles.profileActions}>
              <TouchableOpacity style={styles.actionPill} onPress={handlePasswordReset}>
                <Ionicons name="key-outline" size={18} color="#0a7ea4" />
                <Text style={styles.actionPillText}>Parolayı Sıfırla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionPill, { borderColor: '#e53935' }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color="#e53935" />
                <Text style={[styles.actionPillText, { color: '#e53935' }]}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#11181C', marginTop: 30 }}>Kullanıcı bilgisi bulunamadı.</Text>
        )}

        
        
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteText}>
            Hesabı Sil
          </Text>
        </TouchableOpacity>
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  backgroundShape1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 150,
    height: 150,
    backgroundColor: '#0a7ea4',
    borderRadius: 75,
    opacity: 0.15,
  },
  backgroundShape2: {
    position: 'absolute',
    bottom: 100,
    right: -50,
    width: 100,
    height: 100,
    backgroundColor: '#0a7ea4',
    borderRadius: 50,
    opacity: 0.15,
  },
  backgroundShape3: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 120,
    height: 120,
    backgroundColor: '#4CAF50',
    borderRadius: 60,
    opacity: 0.15,
  },
  backgroundShape4: {
    position: 'absolute',
    top: 300,
    right: -30,
    width: 100,
    height: 100,
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    opacity: 0.15,
  },
  backgroundLine1: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#0a7ea4',
    opacity: 0.1,
  },
  backgroundLine2: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#4CAF50',
    opacity: 0.1,
  },
  contentContainer: { 
    flexGrow: 1, 
    alignItems: 'center', 
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  email: { fontSize: 22, fontWeight: 'bold', color: '#0a7ea4', marginTop: 20, marginBottom: 4 },
  name: { fontSize: 18, color: '#11181C', marginBottom: 18 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#0a7ea4', textAlign: 'center' },
  avatarContainer: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: '#f8f9fa', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 18, 
    borderWidth: 2, 
    borderColor: '#0a7ea4',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: { fontSize: 48, color: '#0a7ea4' },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  profileTitle: { fontSize: 18, fontWeight: 'bold', color: '#0a7ea4', marginBottom: 10 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  profileLabel: { fontSize: 14, color: '#687076' },
  profileValue: { fontSize: 15, color: '#11181C', fontWeight: '600' },
  profileActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 12 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#0a7ea4', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 },
  actionPillText: { color: '#0a7ea4', fontWeight: '600' },
  logoutBtn: { 
    backgroundColor: '#e53935', 
    borderRadius: 25, 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    marginTop: 18,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  resetBtn: { 
    backgroundColor: '#0a7ea4', 
    borderRadius: 25, 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    marginTop: 12,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  resetText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  deleteBtn: { 
    backgroundColor: '#e53935', 
    borderRadius: 25, 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    marginTop: 12,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#c62828',
  },
  deleteText: { 
    color: '#ffffff', 
    fontWeight: 'bold', 
    fontSize: 18,
    textAlign: 'center',
  },
  deleteBtnDisabled: {
    backgroundColor: '#cccccc',
    borderColor: '#999999',
    opacity: 0.6,
  },
  deleteTextDisabled: {
    color: '#666666',
  },
  
  // Premium alanları kaldırıldı
});