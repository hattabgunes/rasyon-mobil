import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { getAuth, sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Ayarlar() {
  const router = useRouter();
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();
  
  // State'ler
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [farmModalVisible, setFarmModalVisible] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [farmData, setFarmData] = useState({
    farmName: ''
  });
  const [notifications, setNotifications] = useState({
    appNotifications: false
  });
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('tr');
  const [loading, setLoading] = useState(false);

  // Kullanıcı verilerini yükle
  useEffect(() => {
    loadUserData();
    loadFarmData();
  }, []);

  const loadUserData = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            email: auth.currentUser.email || ''
          });
          
          // Bildirim tercihlerini yükle
          if (data.notifications) {
            setNotifications(prev => ({
              ...prev,
              ...data.notifications
            }));
          }
          
          // Tema tercihini yükle
          if (data.preferences && data.preferences.isDarkTheme !== undefined) {
            setIsDarkTheme(data.preferences.isDarkTheme);
          }
          
          // Dil tercihini yükle
          if (data.preferences && data.preferences.language !== undefined) {
            setCurrentLanguage(data.preferences.language);
          }
        }
      }
    } catch (error) {
      console.error('Kullanıcı verisi yüklenemedi:', error);
    }
  };

  const loadFarmData = async () => {
    try {
      if (auth.currentUser) {
        const farmDoc = await getDoc(doc(db, 'farms', auth.currentUser.uid));
        if (farmDoc.exists()) {
          const data = farmDoc.data();
          setFarmData({
            farmName: data.farmName || ''
          });
        }
      }
    } catch (error) {
      console.error('Çiftlik verisi yüklenemedi:', error);
    }
  };

  const saveProfile = async () => {
    if (!profileData.firstName || !profileData.lastName) {
      Alert.alert('Hata', 'Ad ve soyad alanları zorunludur!');
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        // Firebase Auth profilini güncelle
        await updateProfile(auth.currentUser, {
          displayName: `${profileData.firstName} ${profileData.lastName}`
        });

        // Firestore'da kullanıcı verisini güncelle
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          updatedAt: new Date()
        });

        Alert.alert('Başarılı', 'Profil bilgileri güncellendi!');
        setProfileModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu!');
      console.error('Profil güncelleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFarmData = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'farms', auth.currentUser.uid), {
          farmName: farmData.farmName,
          updatedAt: new Date()
        });

        Alert.alert('Başarılı', 'Çiftlik bilgileri güncellendi!');
        setFarmModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Hata', 'Çiftlik bilgileri güncellenirken bir hata oluştu!');
      console.error('Çiftlik güncelleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = async (key: string) => {
    const newValue = !notifications[key as keyof typeof notifications];
    
    setNotifications(prev => ({
      ...prev,
      [key]: newValue
    }));

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          [`notifications.${key}`]: newValue,
          updatedAt: new Date()
        });
        console.log(`${key} bildirimi ${newValue ? 'açıldı' : 'kapatıldı'}`);
      }
    } catch (error) {
      console.error('Bildirim tercihi güncellenirken hata:', error);
      // Hata durumunda eski değere geri dön
      setNotifications(prev => ({
        ...prev,
        [key]: !newValue
      }));
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          'preferences.isDarkTheme': newTheme,
          updatedAt: new Date()
        });
        console.log(`Tema ${newTheme ? 'koyu' : 'açık'} olarak kaydedildi`);
        
        // Tema değişikliği başarılı mesajı
        Alert.alert(
          '🎨 Tema Değiştirildi',
          `Tema ${newTheme ? 'koyu' : 'açık'} olarak ayarlandı. Uygulama yeniden başlatıldığında aktif olacak.`,
          [{ text: 'Tamam', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Tema değişikliği kaydedilirken hata:', error);
      // Hata durumunda eski temaya geri dön
      setIsDarkTheme(!newTheme);
      Alert.alert('Hata', 'Tema değişikliği kaydedilemedi!');
    }
  };

  const changeLanguage = async (language: string) => {
    setCurrentLanguage(language);
    
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          'preferences.language': language,
          updatedAt: new Date()
        });
        console.log(`Dil ${language === 'tr' ? 'Türkçe' : 'English'} olarak kaydedildi`);
        
        // Dil değişikliği başarılı mesajı
        Alert.alert(
          '🌍 Dil Değiştirildi',
          `Dil ${language === 'tr' ? 'Türkçe' : 'English'} olarak ayarlandı. Uygulama yeniden başlatıldığında aktif olacak.`,
          [{ text: 'Tamam', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Dil değişikliği kaydedilirken hata:', error);
      // Hata durumunda eski dile geri dön
      setCurrentLanguage(language === 'tr' ? 'en' : 'tr');
      Alert.alert('Hata', 'Dil değişikliği kaydedilemedi!');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      '🚪 Çıkış Yap',
      'Uygulamadan çıkmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              console.log('Kullanıcı başarıyla çıkış yaptı');
              // Router ile giriş sayfasına yönlendir
              router.replace('/user-login');
            } catch (error) {
              console.error('Çıkış yapılırken hata:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu!');
            }
          }
        }
      ]
    );
  };

  const handlePasswordReset = () => {
    if (!auth.currentUser?.email) {
      Alert.alert('Hata', 'E-posta adresi bulunamadı!');
      return;
    }

    const userEmail = auth.currentUser.email;

    Alert.alert(
      '🔐 Parola Sıfırlama',
      `${userEmail} adresine parola sıfırlama e-postası gönderilsin mi?`,
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Gönder',
          style: 'default',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, userEmail);
              Alert.alert(
                '✅ E-posta Gönderildi',
                'Parola sıfırlama e-postası gönderildi. E-posta kutunuzu kontrol edin.',
                [{ text: 'Tamam', style: 'default' }]
              );
              console.log('Parola sıfırlama e-postası gönderildi');
            } catch (error) {
              console.error('Parola sıfırlama e-postası gönderilirken hata:', error);
              Alert.alert('Hata', 'Parola sıfırlama e-postası gönderilemedi!');
            }
          }
        }
      ]
    );
  };

  

  const renderProfileModal = () => (
    <Modal
      visible={profileModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setProfileModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContent} 
          activeOpacity={1}
          onPress={() => {}}
        >
          <ScrollView 
            style={{ width: '100%' }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👤 Profil Düzenle</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ad *</Text>
              <TextInput
                style={styles.input}
                value={profileData.firstName}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, firstName: text }))}
                placeholder="Adınız"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Soyad *</Text>
              <TextInput
                style={styles.input}
                value={profileData.lastName}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, lastName: text }))}
                placeholder="Soyadınız"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={profileData.phone}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                placeholder="Telefon numaranız"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-posta</Text>
              <TextInput
                value={profileData.email}
                editable={false}
                style={[styles.input, styles.disabledInput]}
                placeholder="E-posta adresiniz"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]} 
              onPress={saveProfile}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Kaydediliyor...' : '💾 Kaydet'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderFarmModal = () => (
    <Modal
      visible={farmModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFarmModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setFarmModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContent} 
          activeOpacity={1}
          onPress={() => {}}
        >
          <ScrollView 
            style={{ width: '100%' }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏠 Çiftlik Bilgileri</Text>
              <TouchableOpacity onPress={() => setFarmModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Çiftlik Adı (İsteğe Bağlı)</Text>
              <TextInput
                style={styles.input}
                value={farmData.farmName}
                onChangeText={(text) => setFarmData(prev => ({ ...prev, farmName: text }))}
                placeholder="Çiftlik adınız (opsiyonel)"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]} 
              onPress={saveFarmData}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Kaydediliyor...' : '💾 Kaydet'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '⚙️ Ayarlar',
    });
  }, [navigation]);

  return (
    <View style={styles.container}>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profil Bölümü */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Kullanıcı Profili</Text>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setProfileModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="person" size={24} color="#0a7ea4" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Profil Bilgileri</Text>
                <Text style={styles.settingSubtitle}>
                  {profileData.firstName ? `${profileData.firstName} ${profileData.lastName}` : 'Profil bilgilerinizi düzenleyin'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Çiftlik Bölümü */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Çiftlik Bilgileri</Text>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setFarmModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="business" size={24} color="#4CAF50" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Çiftlik Ayarları</Text>
                                 <Text style={styles.settingSubtitle}>
                   {farmData.farmName ? farmData.farmName : 'Çiftlik adınızı girebilirsiniz (opsiyonel)'}
                 </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

                 {/* Bildirimler Bölümü */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>🔔 Bildirim Tercihleri</Text>
           <Text style={styles.sectionSubtitle}>
             Hangi tür bildirimleri almak istediğinizi seçin
           </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color="#0a7ea4" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Uygulama Bildirimi</Text>
                <Text style={styles.settingSubtitle}>
                  {notifications.appNotifications ? 'Aktif - Yem saatleri bildirim gönderir' : 'Pasif - Bildirim gönderilmez'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.appNotifications}
              onValueChange={() => toggleNotification('appNotifications')}
              trackColor={{ false: '#e0e0e0', true: '#0a7ea4' }}
              thumbColor={notifications.appNotifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
           
           
         </View>

                 {/* Görsel Ayarlar */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>🎨 Görsel Tercihler</Text>
           <Text style={styles.sectionSubtitle}>
             Uygulama görünümünü kişiselleştirin
           </Text>
           
           <View style={styles.settingItem}>
             <View style={styles.settingLeft}>
               <Ionicons name="moon" size={24} color="#673AB7" />
               <View style={styles.settingText}>
                 <Text style={styles.settingTitle}>Koyu Tema</Text>
                 <Text style={styles.settingSubtitle}>
                   {isDarkTheme ? 'Aktif - Koyu tema kullanılıyor' : 'Pasif - Açık tema kullanılıyor'}
                 </Text>
               </View>
             </View>
             <Switch
               value={isDarkTheme}
               onValueChange={toggleTheme}
               trackColor={{ false: '#e0e0e0', true: '#673AB7' }}
               thumbColor={isDarkTheme ? '#ffffff' : '#f4f3f4'}
             />
           </View>
           
           <View style={styles.settingItem}>
             <View style={styles.settingLeft}>
               <Ionicons name="text" size={24} color="#2196F3" />
               <View style={styles.settingText}>
                 <Text style={styles.settingTitle}>Yazı Boyutu</Text>
                 <Text style={styles.settingSubtitle}>Küçük - Normal - Büyük</Text>
               </View>
             </View>
             <TouchableOpacity 
               style={styles.fontSizeButton}
               onPress={() => {
                 Alert.alert(
                   '📝 Yazı Boyutu',
                   'Yazı boyutu seçenekleri yakında eklenecek!',
                   [{ text: 'Tamam', style: 'default' }]
                 );
               }}
             >
               <Text style={styles.fontSizeButtonText}>Normal</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.settingItem}>
             <View style={styles.settingLeft}>
               <Ionicons name="color-palette" size={24} color="#4CAF50" />
               <View style={styles.settingText}>
                 <Text style={styles.settingTitle}>Renk Şeması</Text>
                 <Text style={styles.settingSubtitle}>Varsayılan - Mavi - Yeşil</Text>
               </View>
             </View>
             <TouchableOpacity 
               style={styles.colorSchemeButton}
               onPress={() => {
                 Alert.alert(
                   '🎨 Renk Şeması',
                   'Renk şeması seçenekleri yakında eklenecek!',
                   [{ text: 'Tamam', style: 'default' }]
                 );
               }}
             >
               <Text style={styles.colorSchemeButtonText}>Varsayılan</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.settingItem}>
             <View style={styles.settingLeft}>
               <Ionicons name="eye" size={24} color="#FF9800" />
               <View style={styles.settingText}>
                 <Text style={styles.settingTitle}>Görsel Efektler</Text>
                 <Text style={styles.settingSubtitle}>Animasyonlar ve geçişler</Text>
               </View>
             </View>
             <Switch
               value={true}
               onValueChange={() => {
                 Alert.alert(
                   '✨ Görsel Efektler',
                   'Görsel efekt ayarları yakında eklenecek!',
                   [{ text: 'Tamam', style: 'default' }]
                 );
               }}
               trackColor={{ false: '#e0e0e0', true: '#FF9800' }}
               thumbColor="#ffffff"
             />
           </View>
         </View>

        {/* Diğer Ayarlar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Diğer Ayarlar</Text>
          
                     <View style={styles.settingItem}>
             <View style={styles.settingLeft}>
               <Ionicons name="language" size={24} color="#2196F3" />
               <View style={styles.settingText}>
                 <Text style={styles.settingTitle}>Dil Seçimi</Text>
                 <Text style={styles.settingSubtitle}>
                   {currentLanguage === 'tr' ? 'Türkçe' : 'English'}
                 </Text>
               </View>
             </View>
             <View style={styles.languageButtons}>
               <TouchableOpacity 
                 style={[
                   styles.languageButton, 
                   currentLanguage === 'tr' && styles.languageButtonActive
                 ]}
                 onPress={() => changeLanguage('tr')}
               >
                 <Text style={[
                   styles.languageButtonText,
                   currentLanguage === 'tr' && styles.languageButtonTextActive
                 ]}>🇹🇷 TR</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[
                   styles.languageButton, 
                   currentLanguage === 'en' && styles.languageButtonActive
                 ]}
                 onPress={() => changeLanguage('en')}
               >
                 <Text style={[
                   styles.languageButtonText,
                   currentLanguage === 'en' && styles.languageButtonTextActive
                 ]}>🇺🇸 EN</Text>
               </TouchableOpacity>
             </View>
           </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-upload" size={24} color="#4CAF50" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Veri Yedekleme</Text>
                <Text style={styles.settingSubtitle}>Verilerinizi yedekleyin</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

                     <TouchableOpacity style={styles.settingItem}>
             <View style={styles.settingLeft}>
               <Ionicons name="help-circle" size={24} color="#FF9800" />
               <View style={styles.settingText}>
                 <Text style={styles.settingTitle}>Yardım & Destek</Text>
                 <Text style={styles.settingSubtitle}>Kullanım kılavuzu ve destek</Text>
               </View>
             </View>
             <Ionicons name="chevron-forward" size={20} color="#666" />
           </TouchableOpacity>

           {/* Güvenlik Bölümü */}
           <View style={styles.settingItem}>
             <View style={styles.settingLeft}>
               <Ionicons name="lock-closed" size={24} color="#E91E63" />
               <View style={styles.settingText}>
                 <Text style={styles.settingTitle}>Parola Değiştir</Text>
                 <Text style={styles.settingSubtitle}>E-posta ile parola sıfırlama</Text>
               </View>
             </View>
             <TouchableOpacity 
               style={styles.passwordResetButton}
               onPress={handlePasswordReset}
             >
               <Text style={styles.passwordResetButtonText}>Sıfırla</Text>
             </TouchableOpacity>
           </View>

           {/* Çıkış Bölümü */}
           <View style={styles.settingItem}>
             <View style={styles.settingLeft}>
               <Ionicons name="log-out" size={24} color="#F44336" />
               <View style={styles.settingText}>
                 <Text style={styles.settingTitle}>Uygulamadan Çık</Text>
                 <Text style={styles.settingSubtitle}>Güvenli çıkış yapın</Text>
               </View>
             </View>
             <TouchableOpacity 
               style={styles.signOutButton}
               onPress={handleSignOut}
             >
               <Text style={styles.signOutButtonText}>Çıkış</Text>
             </TouchableOpacity>
           </View>
        </View>
      </ScrollView>

      {/* Modaller */}
      {renderProfileModal()}
      {renderFarmModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
     sectionTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#333',
     marginBottom: 10,
   },
   sectionSubtitle: {
     fontSize: 14,
     color: '#666',
     marginBottom: 15,
     fontStyle: 'italic',
   },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingRight: {
    alignItems: 'flex-end',
  },
  settingIcon: {
    fontSize: 24,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#888',
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
     modalContent: {
     backgroundColor: '#ffffff',
     borderRadius: 10,
     padding: 20,
     width: '90%',
     maxHeight: '90%',
     alignItems: 'center',
     justifyContent: 'flex-start',
   },
     modalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     width: '100%',
     marginBottom: 20,
   },
   modalTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#333',
   },
   comingSoon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#607D8B',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
     comingSoonText: {
     fontSize: 16,
     color: '#666666',
     textAlign: 'center',
     lineHeight: 24,
   },
   
   fontSizeButton: {
     backgroundColor: '#2196F3',
     borderRadius: 6,
     paddingHorizontal: 12,
     paddingVertical: 6,
     minWidth: 60,
     alignItems: 'center',
   },
   fontSizeButtonText: {
     color: '#ffffff',
     fontSize: 12,
     fontWeight: 'bold',
   },
   colorSchemeButton: {
     backgroundColor: '#4CAF50',
     borderRadius: 6,
     paddingHorizontal: 12,
     paddingVertical: 6,
     minWidth: 80,
     alignItems: 'center',
   },
   colorSchemeButtonText: {
     color: '#ffffff',
     fontSize: 12,
     fontWeight: 'bold',
   },
   languageButtons: {
     flexDirection: 'row',
     gap: 8,
   },
   languageButton: {
     backgroundColor: '#f0f0f0',
     borderRadius: 6,
     paddingHorizontal: 12,
     paddingVertical: 6,
     minWidth: 50,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#e0e0e0',
   },
   languageButtonActive: {
     backgroundColor: '#2196F3',
     borderColor: '#2196F3',
   },
   languageButtonText: {
     color: '#666',
     fontSize: 12,
     fontWeight: 'bold',
   },
   languageButtonTextActive: {
     color: '#ffffff',
   },
   passwordResetButton: {
     backgroundColor: '#E91E63',
     borderRadius: 6,
     paddingHorizontal: 12,
     paddingVertical: 6,
     minWidth: 60,
     alignItems: 'center',
   },
   passwordResetButtonText: {
     color: '#ffffff',
     fontSize: 12,
     fontWeight: 'bold',
   },
   signOutButton: {
     backgroundColor: '#F44336',
     borderRadius: 6,
     paddingHorizontal: 12,
     paddingVertical: 6,
     minWidth: 50,
     alignItems: 'center',
   },
   signOutButtonText: {
     color: '#ffffff',
     fontSize: 12,
     fontWeight: 'bold',
   },
});

