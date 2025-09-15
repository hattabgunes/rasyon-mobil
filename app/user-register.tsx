import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

// WebBrowser'ı başlat
WebBrowser.maybeCompleteAuthSession();

export default function UserRegister() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const router = useRouter();

  // Header artık layout'ta gizli olduğu için bu kısım kaldırıldı

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
        
        setSocialLoading(false);
        Alert.alert('Başarılı', 'Google ile kayıt başarılı!');
        router.push('/ana-sayfa');
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
        
        setSocialLoading(false);
        Alert.alert('Başarılı', 'Facebook ile kayıt başarılı!');
        router.push('/ana-sayfa');
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
        
        setSocialLoading(false);
        Alert.alert('Başarılı', 'Apple ile kayıt başarılı!');
        router.push('/ana-sayfa');
      }
    } catch (error) {
      console.error('Apple giriş hatası:', error);
      setSocialLoading(false);
      Alert.alert('Hata', 'Apple ile giriş yapılamadı!');
    }
  };

  // Kullanıcı bilgilerini Firestore'a kaydet
  const ensureUserInFirestore = async (user: any, provider: string) => {
    try {
      const db = getFirestore(app);
      const userRef = doc(db, 'users', user.uid);
      
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName?.split(' ')[0] || '',
        surname: user.displayName?.split(' ').slice(1).join(' ') || '',
        provider: provider,
        role: 'normal',
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      
      await setDoc(userRef, userData, { merge: true });
      console.log('Kullanıcı verisi güncellendi');
    } catch (error) {
      console.error('Firestore kayıt hatası:', error);
    }
  };

  // Manuel kayıt işlemi
  const handleRegister = async () => {
    if (!name || !surname || !email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun!');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır!');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Kullanıcı bilgilerini Firestore'a kaydet
      const db = getFirestore(app);
      const userRef = doc(db, 'users', userCredential.user.uid);
      
      // Önce mevcut kullanıcı verisini kontrol et (yeni kullanıcılar için gerekli değil ama güvenlik için)
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
        uid: userCredential.user.uid,
        email: email,
        name: name,
        surname: surname,
        provider: 'email',
        createdAt: new Date(),
        premium: existingPremium,
        premiumStart: existingPremiumStart,
        premiumEnd: existingPremiumEnd,
        lastLogin: new Date(),
      };
      
      await setDoc(userRef, userData);
      
      setLoading(false);
      Alert.alert('Başarılı', 'Kayıt başarılı!');
      router.push('/ana-sayfa');
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Hata', 'Bu e-posta adresi zaten kullanılıyor!');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Hata', 'Şifre çok zayıf!');
      } else {
        Alert.alert('Hata', 'Kayıt yapılamadı!');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
        
        {/* Mevcut emoji dekoratif öğeleri */}
        <Text style={styles.backgroundEmoji1}>🐄</Text>
        <Text style={styles.backgroundEmoji2}>🐑</Text>
        <Text style={styles.backgroundEmoji3}>🌾</Text>
        <Text style={styles.backgroundEmoji4}>🍀</Text>
      </View>

      <View style={styles.container}>
        {/* Geri Dönüş Butonu */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#0a7ea4" />
        </TouchableOpacity>
        
        {/* Logo ve Başlık */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo.jpg')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Rasyon Hesaplama</Text>
          <Text style={styles.subtitle}>Hesabınızı oluşturun ve başlayın</Text>
        </View>

        {/* Manuel Kayıt Formu - ÜST TARAF */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Manuel Kayıt</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#0a7ea4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="İsim"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#687076"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#0a7ea4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Soyisim"
              value={surname}
              onChangeText={setSurname}
              placeholderTextColor="#687076"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#0a7ea4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#687076"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#0a7ea4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#687076"
            />
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Ayırıcı */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.divider} />
        </View>

        {/* Sosyal Medya Giriş Butonları - ALT TARAF */}
        <View style={styles.socialSection}>
          <Text style={styles.sectionTitle}>Hızlı Kayıt</Text>
          
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleSignIn}
            disabled={socialLoading}
          >
            <Ionicons name="logo-google" size={24} color="#4285F4" />
            <Text style={styles.googleButtonText}>
              {socialLoading ? 'Giriş yapılıyor...' : 'Google ile Kayıt Ol'}
            </Text>
            {socialLoading && <ActivityIndicator size="small" color="#4285F4" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.facebookButton} 
            onPress={handleFacebookSignIn}
            disabled={socialLoading}
          >
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
            <Text style={styles.facebookButtonText}>
              {socialLoading ? 'Giriş yapılıyor...' : 'Facebook ile Kayıt Ol'}
            </Text>
            {socialLoading && <ActivityIndicator size="small" color="#1877F2" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.appleButton} 
            onPress={handleAppleSignIn}
            disabled={socialLoading}
          >
            <Ionicons name="logo-apple" size={24} color="#000000" />
            <Text style={styles.appleButtonText}>
              {socialLoading ? 'Giriş yapılıyor...' : 'Apple ile Kayıt Ol'}
            </Text>
            {socialLoading && <ActivityIndicator size="small" color="#000000" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        </View>

        {/* Giriş Yapma Linki */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Zaten hesabınız var mı?</Text>
          <TouchableOpacity onPress={() => router.push('/user-login')}>
            <Text style={styles.loginLink}>Giriş Yapın</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
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
    top: 0,
    left: 0,
    width: '50%',
    height: '50%',
    backgroundColor: '#e0f7fa', // Mavi tonlar
    borderRadius: 100,
    opacity: 0.2,
  },
  backgroundShape2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '50%',
    backgroundColor: '#e0f7fa', // Mavi tonlar
    borderRadius: 100,
    opacity: 0.2,
  },
  backgroundShape3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%',
    height: '50%',
    backgroundColor: '#e8f5e9', // Yeşil tonlar
    borderRadius: 100,
    opacity: 0.2,
  },
  backgroundShape4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '50%',
    height: '50%',
    backgroundColor: '#e8f5e9', // Yeşil tonlar
    borderRadius: 100,
    opacity: 0.2,
  },
  backgroundLine1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: '80%',
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  backgroundLine2: {
    position: 'absolute',
    bottom: '20%',
    left: '10%',
    width: '80%',
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  backgroundEmoji1: {
    position: 'absolute',
    top: 50,
    left: 30,
    fontSize: 60,
    opacity: 0.1,
    color: '#0a7ea4',
  },
  backgroundEmoji2: {
    position: 'absolute',
    top: 120,
    right: 40,
    fontSize: 50,
    opacity: 0.1,
    color: '#2ecc71',
  },
  backgroundEmoji3: {
    position: 'absolute',
    bottom: 200,
    left: 50,
    fontSize: 40,
    opacity: 0.08,
    color: '#ffe066',
  },
  backgroundEmoji4: {
    position: 'absolute',
    bottom: 150,
    right: 30,
    fontSize: 45,
    opacity: 0.08,
    color: '#2ecc71',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#687076',
    textAlign: 'center',
  },
  socialSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#11181C',
    marginBottom: 20,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 12,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    color: '#687076',
    fontSize: 14,
    marginHorizontal: 15,
  },
  formSection: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  inputIcon: {
    marginRight: 12,
    color: '#0a7ea4',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#11181C',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#687076',
    fontSize: 16,
    marginBottom: 8,
  },
  loginLink: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  appleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});