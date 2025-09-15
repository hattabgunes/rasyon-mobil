import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#0a7ea4',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        },
        headerTintColor: '#0a7ea4',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="ana-sayfa" 
        options={{ 
          headerTitle: '🚜 Çiftlik Yönetim Sistemi',
          headerTitleStyle: { color: '#2E7D32', fontSize: 18, fontWeight: 'bold' },
          headerTintColor: '#2E7D32',
          headerBackVisible: false,
        }} 
      />
      <Stack.Screen 
        name="user-login" 
        options={{ 
          headerTitle: '🔐 Giriş Yap',
          headerBackVisible: false,
        }} 
      />
      <Stack.Screen 
        name="user-register" 
        options={{ 
          headerTitle: '📝 Kayıt Ol',
          headerBackVisible: false,
        }} 
      />
      <Stack.Screen 
        name="admin-login" 
        options={{ 
          headerTitle: '👨‍💼 Admin Girişi',
          headerBackVisible: false,
        }} 
      />
      <Stack.Screen 
        name="admin-panel" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="yem-stok-yonetimi" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="bildirim-yonetimi" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="destek-chat" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="admin-destek" 
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  );
}
