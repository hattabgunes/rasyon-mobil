import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, Timestamp } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useRouter, useNavigation } from 'expo-router';

export default function UserRegister() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Kullanıcı Kayıt' });
  }, [navigation]);

  const handleRegister = async () => {
    if (!name || !surname || !email || !password) {
      Alert.alert('Uyarı', 'Tüm alanları doldurunuz!');
      return;
    }
    try {
      const auth = getAuth(app);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      // Firestore'a kullanıcı ekle
      const db = getFirestore(app);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name,
        surname,
        email,
        premium: false,
        premiumStart: null,
        premiumEnd: null,
        createdAt: Timestamp.now(),
      });
      Alert.alert('Başarılı', 'Kayıt başarılı!', [
        {
          text: 'Tamam',
          onPress: () => router.push('/ration-choice'),
        },
      ]);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        Alert.alert('Hata', 'Bu e-posta ile zaten bir hesap var. Lütfen giriş yapın.');
      } else {
        Alert.alert('Hata', err.message || 'Kayıt başarısız!');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kullanıcı Kayıt</Text>
      <TextInput
        style={styles.input}
        placeholder="İsim"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Soyisim"
        value={surname}
        onChangeText={setSurname}
        placeholderTextColor="#888"
      />
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
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Kayıt Ol</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/user-login')} style={{ marginTop: 16 }}>
        <Text style={{ color: '#4F8EF7', fontWeight: 'bold' }}>Zaten hesabın var mı? Giriş yap</Text>
      </TouchableOpacity>
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