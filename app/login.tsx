import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';

export default function Login() {
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Giriş' });
  }, [navigation]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hayvan Rasyonu Hesaplama</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/user-login')}
      >
        <Text style={styles.buttonText}>Kullanıcı Girişi</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/admin-login')}
      >
        <Text style={styles.buttonText}>Admin Girişi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#181A20', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, color: '#4F8EF7', textAlign: 'center' },
  button: { backgroundColor: '#23263a', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8, marginVertical: 12, width: 220, alignItems: 'center', borderWidth: 1, borderColor: '#4F8EF7' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});