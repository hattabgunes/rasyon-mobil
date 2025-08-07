import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useNavigation } from 'expo-router';

async function ensureUserInFirestore(user) {
  const db = getFirestore(app);
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      name: user.displayName || '',
      surname: '',
      premium: false,
      premiumStart: null,
      premiumEnd: null,
      createdAt: Timestamp.now(),
    });
  }
}

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Kullanıcı Girişi' });
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Uyarı', 'E-posta ve şifre giriniz!');
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth(app);
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      // Firestore ekleme işlemini arka planda başlat
      ensureUserInFirestore(userCred.user);
      setLoading(false);
      Alert.alert('Başarılı', 'Giriş başarılı!');
      router.push('/ration-choice');
    } catch (err) {
      setLoading(false);
      Alert.alert('Hata', 'Giriş başarısız! E-posta veya şifre yanlış.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kullanıcı Girişi</Text>
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/user-register')} style={{ marginTop: 16 }}>
        <Text style={{ color: '#4F8EF7', fontWeight: 'bold' }}>Hesabın yok mu? Kayıt ol</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#4F8EF7" style={{ marginTop: 20 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#181A20', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 28, color: '#4F8EF7' },
  input: { borderWidth: 1, borderColor: '#4F8EF7', borderRadius: 10, padding: 13, marginVertical: 12, backgroundColor: '#23263a', fontSize: 18, color: '#fff', width: 260 },
  button: { backgroundColor: '#23263a', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 18, width: 260, borderWidth: 1, borderColor: '#4F8EF7' },
  buttonText: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
});