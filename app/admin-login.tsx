import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { useRouter } from 'expo-router';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Header artık layout'ta gizli olduğu için bu kısım kaldırıldı

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
        placeholderTextColor="#687076"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#687076"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: 20,
  },

  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 28, color: '#e74c3c' },
  input: { borderWidth: 1, borderColor: '#e74c3c', borderRadius: 10, padding: 13, marginVertical: 12, backgroundColor: '#f8f9fa', fontSize: 18, color: '#11181C', width: 260 },
  button: { backgroundColor: '#e74c3c', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 18, width: 260, borderWidth: 1, borderColor: '#e74c3c' },
  buttonText: { color: '#ffffff', fontSize: 19, fontWeight: 'bold' },
});