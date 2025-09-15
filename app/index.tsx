import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebaseConfig';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    
    // Kullanıcının giriş durumunu dinle
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Kullanıcı giriş yapmış
        setIsAuthenticated(true);
      } else {
        // Kullanıcı giriş yapmamış
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  // Yükleniyor durumunda loading göster
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  // Kullanıcı giriş yapmışsa ana sayfaya, yapmamışsa giriş sayfasına yönlendir
  if (isAuthenticated) {
    return <Redirect href="/ana-sayfa" />;
  } else {
    return <Redirect href="/user-login" />;
  }
}