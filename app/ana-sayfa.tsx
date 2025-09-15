import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { Timestamp, addDoc, collection, doc, getDoc, getDocs, getFirestore, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { app } from '../firebaseConfig';


export default function AnaSayfa() {
  const router = useRouter();
  const navigation = useNavigation();
  
  // Destek sistemi state'leri
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  
  // Bildirim sistemi state'leri
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickStats, setQuickStats] = useState({ hayvan: 0, yem: 0, aktifRasyon: 0 });

  // Yem verme saati state'leri
  const [feedingTimeModalVisible, setFeedingTimeModalVisible] = useState(false);
  const [feedingTimes, setFeedingTimes] = useState([
    { id: 1, time: '08:00', enabled: true, label: 'Sabah' },
    { id: 2, time: '12:00', enabled: true, label: 'Öğle' },
    { id: 3, time: '18:00', enabled: true, label: 'Akşam' }
  ]);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');

  // Tarih formatlama fonksiyonu
  function formatDate(ts: any) {
    if (!ts) return '-';
    if (typeof ts === 'string') return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR');
    return '-';
  }

  // Bildirim tercihlerini yükle
  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  // Destek mesajı gönderme
  const handleSendSupportMessage = async () => {
    if (!supportMessage.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir mesaj yazın!');
      return;
    }

    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı giriş yapmamış!');
        return;
      }

      const db = getFirestore(app);
      await addDoc(collection(db, 'support'), {
        userId: user.uid,
        userEmail: user.email,
        message: supportMessage.trim(),
        createdAt: Timestamp.now(),
        status: 'pending',
        read: false,
      });

      Alert.alert('Başarılı', 'Mesajınız gönderildi! Admin size en kısa sürede dönüş yapacaktır.');
      setSupportModalVisible(false);
      setSupportMessage('');
    } catch (error) {
      console.error('Destek mesajı gönderilemedi:', error);
      Alert.alert('Hata', 'Mesaj gönderilirken bir hata oluştu!');
    }
  };

  // Bildirim tercihlerini yükle
  const [notificationPreferences, setNotificationPreferences] = useState({
    appNotifications: false
  });

  // Bildirim tercihlerini yükle
  const loadNotificationPreferences = async () => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (user) {
        const db = getFirestore(app);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.notifications) {
            setNotificationPreferences(data.notifications);
          }
        }
      }
    } catch (error) {
      console.error('Bildirim tercihleri yüklenemedi:', error);
    }
  };

  // Yem verme saati yönetimi
  const toggleFeedingTime = (id: number) => {
    setFeedingTimes((prev: any[]) => prev.map((time: any) => 
      time.id === id ? { ...time, enabled: !time.enabled } : time
    ));
  };

  const addFeedingTime = async () => {
    if (!selectedHour || !selectedMinute) {
      Alert.alert('Hata', 'Lütfen saat ve dakika seçin!');
      return;
    }

    const fullTime = `${selectedHour}:${selectedMinute}`;

    const newTime = {
      id: Date.now(),
      time: fullTime,
      enabled: true,
      label: fullTime // Saat kendisi etiket olsun
    };

    setFeedingTimes((prev: any[]) => [...prev, newTime]);
    
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (user) {
        const db = getFirestore(app);
        await addDoc(collection(db, 'feedingTimes'), {
          userId: user.uid,
          time: fullTime,
          label: fullTime, // Saat kendisi etiket olsun
          enabled: true,
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Yem verme saati kaydedilemedi:', error);
    }

    // Form'u sıfırla
    setSelectedHour('');
    setSelectedMinute('');
    setFeedingTimeModalVisible(false);
  };

  // Yem verme saati bildirimi gönder
  const sendFeedingTimeNotification = useCallback((time: string) => {
    // Bildirim tercihi açık mı kontrol et
    if (notificationPreferences.appNotifications) {
      // Telefonu titreştir (ses efekti)
      Vibration.vibrate([0, 500, 200, 500]); // 500ms titreşim, 200ms bekle, 500ms titreşim
      
      // Alert göster
      Alert.alert(
        '⏰ Yem Verme Saati!',
        `Saat ${time} geldi! Hayvanları beslemeyi unutmayın.`,
        [
          { text: 'Tamam', style: 'default' },
          { text: '5 Dakika Sonra Hatırlat', style: 'default' }
        ]
      );
      
      console.log(`Yem verme saati bildirimi gönderildi: ${time}`);
    }
  }, [notificationPreferences.appNotifications]);

  // Yem verme saati kontrolü
  useEffect(() => {
    const checkFeedingTime = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Aktif yem verme saatlerini kontrol et
      feedingTimes.forEach((feedingTime: any) => {
        if (feedingTime.enabled && feedingTime.time === currentTime) {
          sendFeedingTimeNotification(feedingTime.time);
        }
      });
    };

    // Her dakika kontrol et
    const interval = setInterval(checkFeedingTime, 60000);
    
    return () => clearInterval(interval);
  }, [feedingTimes, notificationPreferences.appNotifications, sendFeedingTimeNotification]);

  const removeFeedingTime = (id: number) => {
    setFeedingTimes((prev: any[]) => prev.filter((time: any) => time.id !== id));
  };

  // Bildirimleri getir
  const fetchNotifications = async () => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) return;

      const db = getFirestore(app);
      const notificationsRef = collection(db, 'notifications');
      
      // Önce sadece userId ile filtrele, sonra client-side sırala
      const q = query(notificationsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const notificationsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Client-side sıralama (index gerektirmez)
      notificationsList.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter((n: any) => !n.read).length);
      
      console.log('Bildirimler başarıyla getirildi:', notificationsList.length);
    } catch (error) {
      console.error('Bildirimler getirilemedi:', error);
      // Kullanıcıya hata mesajı göster
      Alert.alert('Hata', 'Bildirimler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Bildirimleri okundu olarak işaretle
  const markNotificationsAsRead = async () => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) return;

      const db = getFirestore(app);
      const unreadNotifications = notifications.filter((n: any) => !n.read);
      
      if (unreadNotifications.length === 0) {
        console.log('Okunmamış bildirim yok');
        return;
      }
      
      console.log(`${unreadNotifications.length} bildirim okundu olarak işaretleniyor...`);
      
      for (const notification of unreadNotifications) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          readAt: Timestamp.now()
        });
      }
      
      setUnreadCount(0);
      setNotifications((prev: any[]) => prev.map((n: any) => ({ ...n, read: true })));
      
      console.log('Bildirimler başarıyla okundu olarak işaretlendi');
    } catch (error) {
      console.error('Bildirimler güncellenemedi:', error);
      Alert.alert('Hata', 'Bildirimler güncellenirken bir hata oluştu.');
    }
  };

  

  // Sayfa yüklendiğinde bildirimleri ve hızlı istatistikleri getir
  useEffect(() => {
    console.log('Ana sayfa yüklendi, kullanıcı kontrol ediliyor...');
    const auth = getAuth(app);
    const user = auth.currentUser;
    console.log('Ana sayfa kullanıcı durumu:', user ? `Giriş yapmış: ${user.uid}` : 'Giriş yapmamış');
    
    fetchNotifications();
    fetchQuickStats();
  }, []);

  // Hızlı istatistikleri getir
  const fetchQuickStats = async () => {
    try {
      console.log('Hızlı istatistikler yükleniyor...');
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        console.log('Kullanıcı giriş yapmamış, istatistikler yüklenemiyor');
        return;
      }

      const db = getFirestore(app);

      // Hayvan sayısı (sadece kullanıcıya ait)
      const hayvanQuery = query(collection(db, 'hayvanlar'), where('userId', '==', user.uid));
      const hayvanSnap = await getDocs(hayvanQuery);
      const hayvanCount = hayvanSnap.size || 0;
      console.log('Kullanıcıya ait hayvan sayısı:', hayvanCount);

      // Yem sayısı (sadece kullanıcıya ait)
      const yemQuery = query(collection(db, 'yemler'), where('userId', '==', user.uid));
      const yemSnap = await getDocs(yemQuery);
      const yemCount = yemSnap.size || 0;
      console.log('Kullanıcıya ait yem sayısı:', yemCount);

      // Aktif rasyon (kullanıcıya ait aktif feedingTimes)
      const ftQuery = query(collection(db, 'feedingTimes'), where('userId', '==', user.uid), where('enabled', '==', true));
      const ftSnap = await getDocs(ftQuery);
      const aktifRasyon = ftSnap.size || 0;
      console.log('Aktif rasyon sayısı:', aktifRasyon);

      const stats = { hayvan: hayvanCount, yem: yemCount, aktifRasyon };
      console.log('Hızlı istatistikler:', stats);
      setQuickStats(stats);
    } catch (e) {
      console.error('Hızlı istatistikler yüklenemedi:', e);
    }
  };

  // Çıkış yapma fonksiyonu
  const handleLogout = useCallback(async () => {
    console.log('Çıkış butonuna basıldı!'); // Debug log
    
    try {
      // Direkt çıkış yap, onay bekleme
      const auth = getAuth(app);
      console.log('Auth objesi alındı:', auth); // Debug log
      
      await signOut(auth);
      console.log('SignOut başarılı'); // Debug log
      
      // Başarılı çıkış sonrası giriş sayfasına yönlendir
      console.log('Giriş sayfasına yönlendiriliyor...'); // Debug log
      router.replace('/user-login');
      
    } catch (error) {
      console.error('Çıkış hatası:', error);
      // Hata durumunda da giriş sayfasına yönlendir
      router.replace('/user-login');
    }
  }, [router]);

  // Header'a çıkış butonu ekle
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerLogoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
          <Text style={styles.headerLogoutButtonText}>Çıkış</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleLogout]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
          
          {/* Dekoratif emojiler */}
          <Text style={styles.backgroundEmojiLeft}>🐄</Text>
          <Text style={styles.backgroundEmojiRight}>🐑</Text>
          <Text style={styles.backgroundEmojiTop1}>🌾</Text>
          <Text style={styles.backgroundEmojiTop2}>🍀</Text>
          <Text style={styles.backgroundEmojiTop3}>🌱</Text>
          <Text style={styles.backgroundEmojiBottom1}>🌽</Text>
          <Text style={styles.backgroundEmojiBottom2}>🧈</Text>
          <Text style={styles.backgroundEmojiBottom3}>🌻</Text>
        </View>
        
        {/* Logo */}
        <TouchableOpacity 
          style={styles.logoContainer}
          activeOpacity={0.8}
          onPress={() => router.push('/profilim')}
          accessibilityRole="imagebutton"
          accessibilityLabel="Profilim sayfasına git"
        >
          <Image 
            source={require('../assets/images/logo.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoLabel}>Profil</Text>
        </TouchableOpacity>
        
        {/* Başlık */}
        <Text style={styles.title}>
          🚜 Çiftlik Yönetim Sistemi
        </Text>
        <Text style={styles.subtitle}>
          Hayvanlarınızı ve yemlerinizi profesyonelce yönetin
        </Text>
        
        {/* Ana Menü Butonları */}
        <View style={styles.menuContainer}>
          {/* Hayvan Yönetimi */}
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: '#4CAF50' }]} 
            onPress={() => router.push('/hayvan-yonetimi')}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="paw" size={32} color="#ffffff" />
            </View>
            <Text style={styles.buttonTitle}>🐄 Hayvan Yönetimi</Text>
            <Text style={styles.buttonSubtitle}>
              Hayvan kayıt, arama, güncelleme
            </Text>
          </TouchableOpacity>
          
          {/* Yem Stok Yönetimi */}
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: '#FF9800' }]} 
            onPress={() => router.push('/yem-stok-yonetimi')}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="leaf" size={32} color="#ffffff" />
            </View>
            <Text style={styles.buttonTitle}>🌾 Yem Stok Yönetimi</Text>
            <Text style={styles.buttonSubtitle}>
              Yem stok takibi ve yönetimi
            </Text>
          </TouchableOpacity>
          
          {/* Rasyon Hesaplama */}
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: '#2196F3' }]} 
            onPress={() => router.push('/ration-choice')}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="calculator" size={32} color="#ffffff" />
            </View>
            <Text style={styles.buttonTitle}>🧮 Rasyon Hesaplama</Text>
            <Text style={styles.buttonSubtitle}>
              Hayvanlar için beslenme planı
            </Text>
          </TouchableOpacity>
          
          {/* Raporlar ve Analiz */}
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: '#9C27B0' }]} 
            onPress={() => router.push('/raporlar-analiz')}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="analytics" size={32} color="#ffffff" />
            </View>
            <Text style={styles.buttonTitle}>📊 Raporlar ve Analiz</Text>
            <Text style={styles.buttonSubtitle}>
              Çiftlik performans raporları
            </Text>
          </TouchableOpacity>
          
          {/* Yem Verme Saati */}
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: '#E91E63' }]} 
            onPress={() => setFeedingTimeModalVisible(true)}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="time" size={32} color="#ffffff" />
            </View>
            <Text style={styles.buttonTitle}>⏰ Yem Verme Saati</Text>
            <Text style={styles.buttonSubtitle}>
              {feedingTimes.filter((t: any) => t.enabled).length} aktif hatırlatıcı
            </Text>
          </TouchableOpacity>
          
          {/* Ayarlar */}
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: '#607D8B' }]} 
            onPress={() => router.push('/ayarlar')}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="settings" size={32} color="#ffffff" />
            </View>
            <Text style={styles.buttonTitle}>⚙️ Ayarlar</Text>
            <Text style={styles.buttonSubtitle}>
              Sistem ayarları ve profil
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Stok Özeti */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📈 Hızlı İstatistikler</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{quickStats.hayvan}</Text>
              <Text style={styles.statLabel}>Toplam Hayvan</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{quickStats.yem}</Text>
              <Text style={styles.statLabel}>Yem Çeşidi</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{quickStats.aktifRasyon}</Text>
              <Text style={styles.statLabel}>Aktif Rasyon</Text>
            </View>
          </View>
        </View>

        {/* Destek ve Bildirim Butonları */}
        <View style={styles.supportContainer}>
          <TouchableOpacity 
            style={styles.supportButton} 
            onPress={() => router.push('/destek-chat')}
          >
            <Text style={styles.supportButtonText}>
              🆘 Sorun Bildir / Destek Al
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={() => {
              console.log('Bildirim butonuna tıklandı');
              console.log('Mevcut bildirim sayısı:', notifications.length);
              console.log('Okunmamış bildirim sayısı:', unreadCount);
              setNotificationModalVisible(true);
              markNotificationsAsRead();
            }}
          >
            <Ionicons name="notifications" size={24} color="#ffffff" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>


        </View>
        
        
      </ScrollView>

      
      
      {/* Yem Verme Saati Modal */}
      <Modal visible={feedingTimeModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.feedingTimeModalCard}>
            {/* Header */}
            <View style={styles.feedingTimeHeader}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="time" size={32} color="#E91E63" />
              </View>
              <Text style={styles.feedingTimeTitle}>⏰ Yem Verme Saati</Text>
              <Text style={styles.feedingTimeSubtitle}>
                {feedingTimes.filter((t: any) => t.enabled).length} aktif hatırlatıcı
              </Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.feedingTimeScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.feedingTimeScrollContent}
              nestedScrollEnabled={true}
              scrollEnabled={true}
            >
              {/* Mevcut Saatler */}
              <View style={styles.feedingTimesList}>
                <Text style={styles.sectionTitle}>🕐 Mevcut Saatler</Text>
                {feedingTimes.map((time: any) => (
                  <View key={time.id} style={[
                    styles.feedingTimeItem,
                    time.enabled ? styles.feedingTimeItemActive : styles.feedingTimeItemInactive
                  ]}>
                    <View style={styles.timeInfo}>
                      <View style={styles.timeDisplay}>
                        <Ionicons name="time-outline" size={24} color={time.enabled ? '#E91E63' : '#999'} />
                        <Text style={[
                          styles.timeText,
                          time.enabled ? styles.timeTextActive : styles.timeTextInactive
                        ]}>
                          {time.time}
                        </Text>
                      </View>
                      <Text style={[
                        styles.timeLabel,
                        time.enabled ? styles.timeLabelActive : styles.timeLabelInactive
                      ]}>
                        {time.label}
                      </Text>
                    </View>
                    <View style={styles.timeActions}>
                      <TouchableOpacity 
                        style={[
                          styles.toggleButton,
                          time.enabled ? styles.toggleButtonActive : styles.toggleButtonInactive
                        ]}
                        onPress={() => toggleFeedingTime(time.id)}
                      >
                        <Ionicons 
                          name={time.enabled ? "checkmark-circle" : "ellipse-outline"} 
                          size={20} 
                          color={time.enabled ? '#ffffff' : '#999'} 
                        />
                        <Text style={[
                          styles.toggleButtonText,
                          time.enabled ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
                        ]}>
                          {time.enabled ? 'Aktif' : 'Pasif'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => removeFeedingTime(time.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

                          {/* Yeni Saat Ekleme */}
            <View style={styles.addTimeSection}>
              <View style={styles.addTimeHeader}>
                <Ionicons name="add-circle" size={24} color="#4CAF50" />
                <Text style={styles.addTimeTitle}>Yeni Saat Ekle</Text>
              </View>
              
                            {/* Saat ve Dakika Seçimi */}
              <View style={styles.timeSelectionContainer}>
                <Text style={styles.selectionLabel}>🕐 Saat ve Dakika Seçin</Text>
                
                {/* Büyük Saat Gösterimi */}
                <View style={styles.bigClockContainer}>
                  <View style={styles.clockFace}>
                    <Text style={styles.clockTime}>
                      {selectedHour && selectedMinute ? `${selectedHour}:${selectedMinute}` : '--:--'}
                    </Text>
                    <Text style={styles.clockLabel}>Seçilen Zaman</Text>
                  </View>
                </View>

                {/* Saat Seçimi Butonları */}
                <View style={styles.timeSelectionButtons}>
                  <Text style={styles.timeSectionTitle}>Saat Seçin</Text>
                  <View style={styles.hourButtonsContainer}>
                    {['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'].map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeButton,
                          selectedHour === hour && styles.timeButtonActive
                        ]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text style={[
                          styles.timeButtonText,
                          selectedHour === hour && styles.timeButtonTextActive
                        ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.timeSectionTitle}>Dakika Seçin</Text>
                  <View style={styles.minuteButtonsContainer}>
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.timeButton,
                          selectedMinute === minute && styles.timeButtonActive
                        ]}
                        onPress={() => setSelectedMinute(minute)}
                      >
                        <Text style={[
                          styles.timeButtonText,
                          selectedMinute === minute && styles.timeButtonTextActive
                        ]}>
                          {minute}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>



              {/* Ekleme Butonu */}
              <TouchableOpacity 
                style={styles.addTimeButtonLarge}
                onPress={addFeedingTime}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text style={styles.addTimeButtonLargeText}>⏰ Saat Ekle</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setFeedingTimeModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✅ Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bildirim Modal */}
      <Modal visible={notificationModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.notificationModalCard}>
            {/* Header */}
            <View style={styles.notificationModalHeader}>
              <Text style={styles.modalTitle}>🔔 Bildirimler</Text>
            </View>
            
            {/* Content */}
            <View style={styles.notificationModalContent}>
              {/* Debug bilgisi */}
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>Debug: {notifications.length} bildirim</Text>
                <Text style={styles.debugText}>Okunmamış: {unreadCount}</Text>
              </View>
              
              {notifications.length === 0 ? (
                <View style={styles.emptyNotificationContainer}>
                  <Text style={styles.noNotificationText}>
                    Henüz bildiriminiz yok.
                  </Text>
                </View>
              ) : (
                <ScrollView 
                  style={styles.notificationList} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.notificationListContent}
                >
                  {notifications.map((notification: any) => (
                    <View key={notification.id} style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification
                    ]}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>
                          {notification.read ? '📧' : '📬'} Admin Mesajı
                        </Text>
                        <Text style={styles.notificationDate}>
                          {formatDate(notification.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
            
            {/* Footer */}
            <View style={styles.notificationModalFooter}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setNotificationModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
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
    width: 100,
    height: 100,
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundShape2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: '#FF9800',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundShape3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 100,
    height: 100,
    backgroundColor: '#2196F3',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundShape4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: '#9C27B0',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundLine1: {
    position: 'absolute',
    top: 100,
    left: '50%',
    width: 1,
    height: '100%',
    backgroundColor: '#4CAF50',
    opacity: 0.1,
  },
  backgroundLine2: {
    position: 'absolute',
    top: '50%',
    left: 100,
    width: '100%',
    height: 1,
    backgroundColor: '#FF9800',
    opacity: 0.1,
  },
  backgroundEmojiLeft: {
    position: 'absolute',
    left: 20,
    top: 150,
    fontSize: 120,
    opacity: 0.08,
    color: '#4CAF50',
  },
  backgroundEmojiRight: {
    position: 'absolute',
    right: 20,
    bottom: 150,
    fontSize: 100,
    opacity: 0.08,
    color: '#FF9800',
  },
  backgroundEmojiTop1: {
    position: 'absolute',
    left: 50,
    top: 80,
    fontSize: 40,
    opacity: 0.06,
    color: '#4CAF50',
  },
  backgroundEmojiTop2: {
    position: 'absolute',
    left: 120,
    top: 60,
    fontSize: 35,
    opacity: 0.06,
    color: '#FF9800',
  },
  backgroundEmojiTop3: {
    position: 'absolute',
    left: 200,
    top: 90,
    fontSize: 45,
    opacity: 0.06,
    color: '#2196F3',
  },
  backgroundEmojiBottom1: {
    position: 'absolute',
    left: 40,
    bottom: 80,
    fontSize: 35,
    opacity: 0.06,
    color: '#4CAF50',
  },
  backgroundEmojiBottom2: {
    position: 'absolute',
    left: 100,
    bottom: 60,
    fontSize: 40,
    opacity: 0.06,
    color: '#FF9800',
  },
  backgroundEmojiBottom3: {
    position: 'absolute',
    left: 160,
    bottom: 90,
    fontSize: 30,
    opacity: 0.06,
    color: '#2196F3',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  headerLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e74c3c',
    marginRight: 16,
  },
  headerLogoutButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoLabel: {
    marginTop: 8,
    color: '#0a7ea4',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    color: '#2E7D32', 
    textAlign: 'center',
    zIndex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    zIndex: 1,
  },
  menuContainer: {
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1,
  },
  buttonIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    flex: 1,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    zIndex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  supportContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  supportButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  supportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notificationButton: {
    backgroundColor: '#3498db',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#333333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '85%',
    height: '65%',
    alignSelf: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  notificationModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  notificationModalContent: {
    flex: 1,
    padding: 20,
  },
  notificationModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  emptyNotificationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noNotificationText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  notificationList: {
    flex: 1,
  },
  notificationListContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  unreadNotification: {
    borderLeftColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  notificationDate: {
    fontSize: 12,
    color: '#666666',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    // iPhone'da daha iyi görünüm için
    marginTop: 16,
    marginHorizontal: 8,
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  
  // Yem Verme Saati Stilleri
  feedingTimeButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  feedingTimeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  feedingTimeSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
  },
  feedingTimeModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '95%', // iPhone'da daha geniş
    height: '80%', // iPhone'da daha yüksek
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // iPhone için optimize edilmiş
    marginHorizontal: 10,
    marginVertical: 20,
    alignSelf: 'center',
  },
  feedingTimesList: {
    marginVertical: 16,
    // iPhone'da daha iyi görünüm için
    paddingHorizontal: 8,
  },
  feedingTimeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
  },
  timeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  toggleButtonInactive: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  toggleButtonTextInactive: {
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  addTimeSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    // iPhone'da daha iyi görünüm için
    paddingHorizontal: 8,
  },
  addTimeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  labelInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addTimeButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
     addTimeButtonText: {
     color: '#ffffff',
     fontSize: 20,
     fontWeight: 'bold',
   },
   // Yeni güzel UI stilleri
     feedingTimeHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fce4ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedingTimeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 6,
    textAlign: 'center',
  },
   sectionTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#333',
     marginBottom: 16,
     textAlign: 'center',
   },
   feedingTimeItemActive: {
     backgroundColor: '#fce4ec',
     borderColor: '#E91E63',
     borderWidth: 2,
   },
   feedingTimeItemInactive: {
     backgroundColor: '#f8f9fa',
     borderColor: '#e0e0e0',
     borderWidth: 1,
     opacity: 0.7,
   },
   timeDisplay: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
     gap: 8,
   },
   timeTextActive: {
     color: '#E91E63',
     fontWeight: 'bold',
   },
   timeTextInactive: {
     color: '#999',
     fontWeight: 'normal',
   },
   timeLabelActive: {
     color: '#E91E63',
     fontWeight: '600',
   },
   timeLabelInactive: {
     color: '#999',
     fontWeight: 'normal',
   },
   addTimeHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 16,
     gap: 8,
   },
   inputContainer: {
     flex: 1,
   },
   inputLabel: {
     fontSize: 14,
     fontWeight: '600',
     color: '#333',
     marginBottom: 6,
   },
   // Yeni saat seçimi stilleri
   timeSelectionContainer: {
     marginBottom: 20,
   },
   selectionLabel: {
     fontSize: 16,
     fontWeight: '600',
     color: '#333',
     marginBottom: 12,
     textAlign: 'center',
   },
   timePickerRow: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     gap: 12,
   },
   timeSeparator: {
     fontSize: 24,
     fontWeight: 'bold',
     color: '#333',
     marginHorizontal: 8,
   },
   selectedTimeDisplay: {
     marginTop: 16,
     padding: 12,
     backgroundColor: '#e8f5e8',
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#4CAF50',
     alignItems: 'center',
   },
   selectedTimeText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#2E7D32',
   },
   timePickerButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#f8f9fa',
     paddingHorizontal: 16,
     paddingVertical: 12,
     borderRadius: 12,
     borderWidth: 1,
     borderColor: '#e0e0e0',
     gap: 8,
     // iPhone'da daha iyi görünüm için
     minWidth: 80,
     justifyContent: 'center',
   },
   timePickerButtonText: {
     fontSize: 14, // iPhone'da daha küçük font
     fontWeight: '600', // iPhone'da daha kalın
     color: '#333',
     flex: 1,
     textAlign: 'center',
     // iPhone'da daha iyi görünüm için
     paddingHorizontal: 4,
   },
   // Yeni saat seçimi stilleri
   bigClockContainer: {
     alignItems: 'center',
     marginVertical: 20,
     padding: 20,
   },
   clockFace: {
     backgroundColor: '#f8f9fa',
     borderRadius: 100,
     width: 120,
     height: 120,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 3,
     borderColor: '#E91E63',
     shadowColor: '#E91E63',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 8,
   },
   clockTime: {
     fontSize: 28,
     fontWeight: 'bold',
     color: '#E91E63',
     marginBottom: 4,
   },
   clockLabel: {
     fontSize: 12,
     color: '#666',
     textAlign: 'center',
   },
   timeSelectionButtons: {
     marginTop: 20,
   },
   timeSectionTitle: {
     fontSize: 16,
     fontWeight: '600',
     color: '#333',
     marginBottom: 12,
     textAlign: 'center',
   },
   hourButtonsContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'center',
     gap: 8,
     marginBottom: 20,
   },
   minuteButtonsContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'center',
     gap: 8,
     marginBottom: 20,
   },
   timeButton: {
     paddingHorizontal: 16,
     paddingVertical: 12,
     borderRadius: 20,
     borderWidth: 1,
     borderColor: '#e0e0e0',
     backgroundColor: '#f8f9fa',
     minWidth: 50,
     alignItems: 'center',
   },
   timeButtonActive: {
     backgroundColor: '#E91E63',
     borderColor: '#E91E63',
   },
   timeButtonText: {
     fontSize: 14,
     fontWeight: '500',
     color: '#666',
   },
   timeButtonTextActive: {
     color: '#ffffff',
   },

   addTimeButtonLarge: {
     backgroundColor: '#4CAF50',
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 16,
     paddingHorizontal: 24,
     borderRadius: 12,
     gap: 8,
     marginTop: 16,
   },
   addTimeButtonLargeText: {
     color: '#ffffff',
     fontSize: 16,
     fontWeight: 'bold',
   },
   // ScrollView stilleri
   feedingTimeScrollView: {
     flex: 1,
     marginBottom: 16,
     // iPhone'da scroll için gerekli
     minHeight: 200,
     maxHeight: 400,
   },
   feedingTimeScrollContent: {
     paddingBottom: 16,
     // iPhone'da scroll için gerekli
     flexGrow: 1,
   },
});

