import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// WebBrowser'ı başlat
WebBrowser.maybeCompleteAuthSession();

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  // Google OAuth konfigürasyonu
  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: '910288660539-d43o7e243vqg0e04qeqj36vd9r8rpqbe.apps.googleusercontent.com',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'rasyon-mobil'
      }),
    },
    { authorizationEndpoint: 'https://accounts.google.com/oauth/authorize' }
  );

  // Facebook OAuth konfigürasyonu
  const [facebookRequest, facebookResponse, facebookPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'YOUR_FACEBOOK_APP_ID', // Facebook Developer Console'dan alınacak
      scopes: ['public_profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'rasyon-mobil'
      }),
    },
    { authorizationEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth' }
  );

  // Apple OAuth konfigürasyonu
  const [appleRequest, appleResponse, applePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'com.yourcompany.rasyon-mobil', // Apple Developer Console'dan alınacak
      scopes: ['name', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'rasyon-mobil'
      }),
      responseType: AuthSession.ResponseType.Code,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    },
    { authorizationEndpoint: 'https://appleid.apple.com/auth/authorize' }
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '🔐 Giriş Yap',
      headerTitleStyle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0a7ea4',
      },
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 2,
        borderBottomColor: '#0a7ea4',
      },
      headerShown: true,
    });
  }, [navigation]);

  // Kullanıcı bilgilerini Firestore'a kaydet
  const ensureUserInFirestore = async (user: any, provider: string) => {
    try {
      const db = getFirestore(app);
      const userRef = doc(db, 'users', user.uid);
      
      // Önce mevcut kullanıcı verisini kontrol et
      const userSnap = await getDoc(userRef);
      let existingPremium = false;
      let existingPremiumStart = null;
      let existingPremiumEnd = null;
      
      if (userSnap.exists()) {
        const existingData = userSnap.data();
        existingPremium = existingData.premium || false;
        existingPremiumStart = existingData.premiumStart || null;
        existingPremiumEnd = existingData.premiumEnd || null;
        console.log('Mevcut premium durumu korunuyor:', existingPremium);
      }
      
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName?.split(' ')[0] || '',
        surname: user.displayName?.split(' ').slice(1).join(' ') || '',
        provider: provider,
        createdAt: new Date(),
        premium: existingPremium,
        premiumStart: existingPremiumStart,
        premiumEnd: existingPremiumEnd,
        lastLogin: new Date(),
      };
      
      await setDoc(userRef, userData, { merge: true });
      console.log('Kullanıcı verisi güncellendi, premium durumu korundu:', existingPremium);
    } catch (error) {
      console.error('Firestore kayıt hatası:', error);
    }
  };

  // Google giriş işlemi
  const handleGoogleSignIn = async () => {
    try {
      setSocialLoading(true);
      const result = await googlePromptAsync();
      
      if (result.type === 'success') {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const auth = getAuth(app);
        const userCredential = await signInWithCredential(auth, credential);
        
        // Kullanıcı bilgilerini Firestore'a kaydet
        await ensureUserInFirestore(userCredential.user, 'Google');
        
        // Süper admin kontrolü
        const superAdminEmails = [
          'admin@rasyon.com',
          'admin@example.com',
          'gunesyazilim00@gmail.com',
          // Buraya süper admin e-postalarını ekleyin
        ];
        if (superAdminEmails.includes(userCredential.user.email?.toLowerCase() || '')) {
          setSocialLoading(false);
          Alert.alert('Başarılı', 'Süper admin girişi başarılı!');
          router.push('/ration-choice?admin=true');
        } else {
          setSocialLoading(false);
          Alert.alert('Başarılı', 'Google ile giriş başarılı!');
          router.push('/ration-choice');
        }
      }
    } catch (error) {
      console.error('Google giriş hatası:', error);
      setSocialLoading(false);
      Alert.alert('Hata', 'Google ile giriş yapılamadı!');
    }
  };

  // Facebook giriş işlemi
  const handleFacebookSignIn = async () => {
    try {
      setSocialLoading(true);
      const result = await facebookPromptAsync();
      
      if (result.type === 'success') {
        const { access_token } = result.params;
        const credential = FacebookAuthProvider.credential(access_token);
        const auth = getAuth(app);
        const userCredential = await signInWithCredential(auth, credential);
        
        // Kullanıcı bilgilerini Firestore'a kaydet
        await ensureUserInFirestore(userCredential.user, 'Facebook');
        
        // Süper admin kontrolü
        const superAdminEmails = [
          'admin@rasyon.com',
          'admin@example.com',
          'gunesyazilim00@gmail.com',
          // Buraya süper admin e-postalarını ekleyin
        ];
        if (superAdminEmails.includes(userCredential.user.email?.toLowerCase() || '')) {
          setSocialLoading(false);
          Alert.alert('Başarılı', 'Süper admin girişi başarılı!');
          router.push('/ration-choice?admin=true');
        } else {
          setSocialLoading(false);
          Alert.alert('Başarılı', 'Facebook ile giriş başarılı!');
          router.push('/ration-choice');
        }
      }
    } catch (error) {
      console.error('Facebook giriş hatası:', error);
      setSocialLoading(false);
      Alert.alert('Hata', 'Facebook ile giriş yapılamadı!');
    }
  };

  // Apple giriş işlemi
  const handleAppleSignIn = async () => {
    try {
      setSocialLoading(true);
      const result = await applePromptAsync();
      
      if (result.type === 'success') {
        const { code } = result.params;
        // Apple için özel credential oluşturma
        const auth = getAuth(app);
        const provider = new OAuthProvider('apple.com');
        const userCredential = await signInWithCredential(auth, provider.credential({
          idToken: code,
        }));
        
        // Kullanıcı bilgilerini Firestore'a kaydet
        await ensureUserInFirestore(userCredential.user, 'Apple');
        
        // Süper admin kontrolü
        const superAdminEmails = [
          'admin@rasyon.com',
          'admin@example.com',
          'gunesyazilim00@gmail.com',
          // Buraya süper admin e-postalarını ekleyin
        ];
        if (superAdminEmails.includes(userCredential.user.email?.toLowerCase() || '')) {
          setSocialLoading(false);
          Alert.alert('Başarılı', 'Süper admin girişi başarılı!');
          router.push('/ration-choice?admin=true');
        } else {
          setSocialLoading(false);
          Alert.alert('Başarılı', 'Apple ile giriş başarılı!');
          router.push('/ration-choice');
        }
      }
    } catch (error) {
      console.error('Apple giriş hatası:', error);
      setSocialLoading(false);
      Alert.alert('Hata', 'Apple ile giriş yapılamadı!');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifre girin!');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth(app);
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      // Süper admin kontrolü
      const superAdminEmails = [
        'admin@rasyon.com',
        'admin@example.com',
        'gunesyazilim00@gmail.com',
        // Buraya süper admin e-postalarını ekleyin
      ];
      if (superAdminEmails.includes(email.toLowerCase())) {
        setLoading(false);
        Alert.alert('Başarılı', 'Süper admin girişi başarılı!');
        router.push('/ration-choice?admin=true');
      } else {
        // Normal kullanıcı girişi
        // Firestore ekleme işlemini arka planda başlat
        ensureUserInFirestore(userCred.user, 'Email');
        setLoading(false);
        Alert.alert('Başarılı', 'Giriş başarılı!');
        router.push('/ration-choice');
      }
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Hata', 'Kullanıcı bulunamadı!');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Hata', 'Yanlış şifre!');
      } else {
        Alert.alert('Hata', 'Giriş yapılamadı!');
      }
    }
  };

  return (
    <ScrollView 
      style={styles.scrollContainer} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Arka Plan Dekoratif Öğeleri */}
      <View style={styles.backgroundContainer}>
        {/* Sol üst köşe - Mavi tonlar */}
        <View style={styles.backgroundShape1} />
        <View style={styles.backgroundShape2} />
        
        {/* Sağ alt köşe - Yeşil tonlar */}
        <View style={styles.backgroundShape3} />
        <View style={styles.backgroundShape4} />
        
        {/* Orta dekoratif çizgiler */}
        <View style={styles.backgroundLine1} />
        <View style={styles.backgroundLine2} />
      </View>

      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>Giriş Yap</Text>
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
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>Giriş Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/user-register')} style={{ marginTop: 16 }}>
          <Text style={{ color: '#0a7ea4', fontWeight: 'bold' }}>Hesabın yok mu? Kayıt ol</Text>
        </TouchableOpacity>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={socialLoading}>
          <Ionicons name="logo-google" size={24} color="#4285F4" />
          <Text style={styles.googleButtonText}>Google ile Giriş Yap</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.facebookButton} onPress={handleFacebookSignIn} disabled={socialLoading}>
          <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          <Text style={styles.facebookButtonText}>Facebook ile Giriş Yap</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.appleButton} onPress={handleAppleSignIn} disabled={socialLoading}>
          <Ionicons name="logo-apple" size={24} color="#000000" />
          <Text style={styles.appleButtonText}>Apple ile Giriş Yap</Text>
        </TouchableOpacity>
        
        {loading && <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 20 }} />}
        {socialLoading && <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 20 }} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
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
    opacity: 0.1,
  },
  backgroundShape2: {
    position: 'absolute',
    bottom: 100,
    right: -50,
    width: 100,
    height: 100,
    backgroundColor: '#0a7ea4',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundShape3: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 120,
    height: 120,
    backgroundColor: '#4CAF50',
    borderRadius: 60,
    opacity: 0.1,
  },
  backgroundShape4: {
    position: 'absolute',
    top: 300,
    right: -30,
    width: 100,
    height: 100,
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundLine1: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  backgroundLine2: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  container: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: 20,
    minHeight: '100%',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 28, color: '#0a7ea4' },
  input: { borderWidth: 1, borderColor: '#0a7ea4', borderRadius: 10, padding: 13, marginVertical: 12, backgroundColor: '#f8f9fa', fontSize: 18, color: '#11181C', width: 260 },
  button: { backgroundColor: '#0a7ea4', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 18, width: 260, borderWidth: 1, borderColor: '#0a7ea4' },
  buttonText: { color: '#ffffff', fontSize: 19, fontWeight: 'bold' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#687076',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#687076',
    fontSize: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 18,
    width: 260,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 18,
    width: 260,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  facebookButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 18,
    width: 260,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});