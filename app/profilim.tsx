import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { getAuth, signOut, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useRouter, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

export default function Profilim() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Profilim' });
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
      router.replace('/login');
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
    if (userData?.premium) {
      Alert.alert('Uyarı', 'Premium hesabınızı silemezsiniz!');
      return;
    }
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Sil', style: 'destructive', onPress: async () => {
            try {
              const auth = getAuth(app);
              const user = auth.currentUser;
              if (user) {
                const db = getFirestore(app);
                await deleteDoc(doc(db, 'users', user.uid));
                await deleteUser(user);
                router.replace('/login');
              }
            } catch (error) {
              Alert.alert('Hata', 'Hesap silinemedi!');
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
    <View style={styles.container}>
      <Text style={styles.email}>{userData?.email || ''}</Text>
      <Text style={styles.name}>{userData?.name} {userData?.surname}</Text>
      <Text style={styles.title}>Profilim</Text>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>👤</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4F8EF7" style={{ marginTop: 30 }} />
      ) : userData ? (
        <View style={styles.card}>
          <Text style={styles.label}>Premium:</Text>
          <Text style={styles.value}>{userData.premium ? '✅ Aktif' : '❌ Pasif'}</Text>
          {userData.premium && (
            <>
              <Text style={styles.label}>Başlangıç:</Text>
              <Text style={styles.value}>{formatDate(userData.premiumStart)}</Text>
              <Text style={styles.label}>Bitiş:</Text>
              <Text style={styles.value}>{formatDate(userData.premiumEnd)}</Text>
            </>
          )}
        </View>
      ) : (
        <Text style={{ color: '#fff', marginTop: 30 }}>Kullanıcı bilgisi bulunamadı.</Text>
      )}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.resetBtn} onPress={handlePasswordReset}>
        <Text style={styles.resetText}>Şifre Değiştir</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.deleteBtn, userData?.premium && { backgroundColor: '#888' }]}
        onPress={handleDeleteAccount}
        disabled={userData?.premium}
      >
        <Text style={styles.deleteText}>Hesabı Sil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#181A20', padding: 20 },
  email: { fontSize: 22, fontWeight: 'bold', color: '#4F8EF7', marginTop: 32, marginBottom: 4 },
  name: { fontSize: 18, color: '#fff', marginBottom: 18 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#4F8EF7', textAlign: 'center' },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#23263a', alignItems: 'center', justifyContent: 'center', marginBottom: 18, borderWidth: 2, borderColor: '#4F8EF7' },
  avatar: { fontSize: 48, color: '#4F8EF7' },
  card: { backgroundColor: '#23263a', borderRadius: 16, padding: 22, marginBottom: 24, width: '100%', elevation: 3, borderWidth: 1, borderColor: '#4F8EF7' },
  label: { fontSize: 16, color: '#bbb', marginTop: 10 },
  value: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  logoutBtn: { backgroundColor: '#e53935', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, marginTop: 18 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  resetBtn: { backgroundColor: '#4F8EF7', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8 },
  resetText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  deleteBtn: { backgroundColor: '#e53935', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8 },
  deleteText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});