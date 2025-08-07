import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { useRouter, useNavigation } from 'expo-router';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Admin Girişi' });
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Uyarı', 'E-posta ve şifre giriniz!');
      return;
    }
    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Başarılı', 'Admin girişi başarılı!');
      router.push('/admin-panel'); // Admin paneli ekranına yönlendirme (ileride ekleyeceğiz)
    } catch (err) {
      Alert.alert('Hata', 'Giriş başarısız! E-posta veya şifre yanlış.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Girişi</Text>
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
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Giriş Yap</Text>
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