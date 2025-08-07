import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function RationChoice() {
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Rasyon Seçimi',
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/profilim')}
          style={{ marginRight: 16, backgroundColor: '#23263a', borderRadius: 999, padding: 6, borderWidth: 1, borderColor: '#4F8EF7' }}
        >
          <Ionicons name="person-circle" size={32} color="#4F8EF7" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLogout = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.replace('/user-login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Çıkış</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Ne yapmak istersin?</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/ration')}>
        <Text style={styles.buttonText}>🐮 Rasyon Hesaplama</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#2d8cff' }]} onPress={() => router.push('/ration-by-feed')}>
        <Text style={styles.buttonText}>🍽️ Elimdeki Yemlerle Hesapla</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#2ecc71' }]} onPress={() => router.push('/ration-history')}>
        <Text style={styles.buttonText}>📋 Rasyon Kayıtlarım</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#181A20', padding: 20 },
  logoutBtn: { position: 'absolute', top: 32, right: 24, backgroundColor: '#e53935', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16, zIndex: 10 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 40, color: '#4F8EF7', textAlign: 'center' },
  button: { backgroundColor: '#23263a', paddingVertical: 22, paddingHorizontal: 32, borderRadius: 12, marginVertical: 18, width: 280, alignItems: 'center', elevation: 3, borderWidth: 1, borderColor: '#4F8EF7' },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});