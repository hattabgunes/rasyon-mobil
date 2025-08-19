# 🔐 OAuth Kurulum Rehberi

Bu rehber, Google, Facebook ve Apple ile giriş sistemini kurmanız için gereken adımları içerir.

## 📋 Gereksinimler

- Google Cloud Console hesabı
- Facebook Developer Console hesabı
- Apple Developer Console hesabı (iOS için)
- Firebase projesi

## 🔧 Kurulum Adımları

### 1. Google OAuth Kurulumu

#### Google Cloud Console'da:
1. [Google Cloud Console](https://console.cloud.google.com/)'a gidin
2. Projenizi seçin veya yeni proje oluşturun
3. **APIs & Services** > **Credentials** bölümüne gidin
4. **Create Credentials** > **OAuth 2.0 Client IDs** seçin
5. Uygulama türünü seçin:
   - **Android**: Package name: `com.yourcompany.rasyon-mobil`
   - **iOS**: Bundle ID: `com.yourcompany.rasyon-mobil`
   - **Web**: Authorized redirect URIs: `https://your-app.com/auth/callback`

#### Kodda Güncelleme:
```typescript
// user-login.tsx ve user-register.tsx dosyalarında
clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
```

### 2. Facebook OAuth Kurulumu

#### Facebook Developer Console'da:
1. [Facebook Developers](https://developers.facebook.com/)'a gidin
2. Yeni uygulama oluşturun
3. **Facebook Login** ürününü ekleyin
4. **Settings** > **Basic** bölümünde:
   - **App Domains**: `your-app.com`
   - **Privacy Policy URL**: `https://your-app.com/privacy`
   - **Terms of Service URL**: `https://your-app.com/terms`

#### Kodda Güncelleme:
```typescript
// user-login.tsx ve user-register.tsx dosyalarında
clientId: 'YOUR_FACEBOOK_APP_ID'
```

### 3. Apple OAuth Kurulumu

#### Apple Developer Console'da:
1. [Apple Developer](https://developer.apple.com/) hesabınıza gidin
2. **Certificates, Identifiers & Profiles** bölümüne gidin
3. **Identifiers** > **App IDs** > **+** butonuna tıklayın
4. **Sign In with Apple** özelliğini etkinleştirin
5. **Services IDs** oluşturun ve **Sign In with Apple**'ı etkinleştirin

#### Kodda Güncelleme:
```typescript
// user-login.tsx ve user-register.tsx dosyalarında
clientId: 'com.yourcompany.rasyon-mobil'
```

### 4. Firebase Konfigürasyonu

#### Firebase Console'da:
1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. Projenizi seçin
3. **Authentication** > **Sign-in method** bölümüne gidin
4. Aşağıdaki sağlayıcıları etkinleştirin:
   - **Google**
   - **Facebook**
   - **Apple**

#### Google için:
- **Web SDK configuration** bölümünde **Web client ID**'yi kopyalayın
- **Authorized domains** listesine domain'inizi ekleyin

#### Facebook için:
- **Facebook App ID** ve **App Secret**'ı girin
- **OAuth redirect URI**'yi ekleyin: `https://your-project.firebaseapp.com/__/auth/handler`

#### Apple için:
- **Services ID**'yi girin
- **Apple Team ID**'yi girin
- **Key ID**'yi girin
- **Private Key**'i yükleyin

## 🚀 Test Etme

1. Uygulamayı başlatın: `npm start`
2. Giriş veya kayıt sayfasına gidin
3. Sosyal medya butonlarına tıklayın
4. OAuth akışının çalıştığını doğrulayın

## ⚠️ Önemli Notlar

- **Client ID'leri** güvenli tutun, public repository'de paylaşmayın
- **Redirect URI'leri** doğru yapılandırın
- **Firebase Security Rules**'u uygun şekilde ayarlayın
- **Privacy Policy** ve **Terms of Service** sayfalarınızı hazırlayın

## 🔒 Güvenlik

- Tüm OAuth token'larını güvenli şekilde saklayın
- Kullanıcı verilerini şifreleyin
- Regular security audits yapın
- GDPR ve diğer privacy regulations'a uyun

## 📞 Destek

Sorun yaşarsanız:
1. Console loglarını kontrol edin
2. Firebase Authentication loglarını inceleyin
3. OAuth provider'ların documentation'larını okuyun
4. Expo AuthSession documentation'ını kontrol edin

---

**Not**: Bu rehber temel kurulum adımlarını içerir. Production ortamı için ek güvenlik önlemleri almanız gerekebilir.

