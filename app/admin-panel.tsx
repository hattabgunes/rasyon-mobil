import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

export default function AdminPanel() {
  const router = useRouter();
  
  // Kullanıcı istatistikleri
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Kullanıcıları yükle
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(users);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Arka Plan Dekoratif Öğeleri */}
        <View style={styles.backgroundContainer}>
          {/* Sol üst köşe - Kırmızı tonlar */}
          <View style={styles.backgroundShape1} />
          <View style={styles.backgroundShape2} />
          
          {/* Sağ alt köşe - Mavi tonlar */}
          <View style={styles.backgroundShape3} />
          <View style={styles.backgroundShape4} />
          
          {/* Orta dekoratif çizgiler */}
          <View style={styles.backgroundLine1} />
          <View style={styles.backgroundLine2} />
          
          {/* Dekoratif emojiler */}
          <Text style={styles.backgroundEmojiLeft}>👨‍💼</Text>
          <Text style={styles.backgroundEmojiRight}>🔧</Text>
          <Text style={styles.backgroundEmojiTop1}>⚙️</Text>
          <Text style={styles.backgroundEmojiTop2}>📊</Text>
          <Text style={styles.backgroundEmojiTop3}>🔐</Text>
          <Text style={styles.backgroundEmojiBottom1}>👥</Text>
          <Text style={styles.backgroundEmojiBottom2}>📈</Text>
          <Text style={styles.backgroundEmojiBottom3}>🎯</Text>
        </View>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Başlık */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>👨‍💼 Admin Paneli</Text>
          <Text style={styles.subtitle}>Sistem Yönetim Merkezi</Text>
        </View>

        {/* İstatistik Kartları */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={32} color="#e74c3c" />
            </View>
            <Text style={styles.statNumber}>{allUsers.length}</Text>
            <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={32} color="#27ae60" />
            </View>
            <Text style={styles.statNumber}>{allUsers.filter(u => u.isActive).length}</Text>
            <Text style={styles.statLabel}>Aktif Kullanıcı</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="shield" size={32} color="#f39c12" />
            </View>
            <Text style={styles.statNumber}>{allUsers.filter(u => u.role === 'admin').length}</Text>
            <Text style={styles.statLabel}>Admin Kullanıcı</Text>
          </View>
        </View>

        {/* Ana Menü Butonları */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/kullanici-yonetimi')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="people" size={28} color="#e74c3c" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>👥 Kullanıcı Yönetimi</Text>
              <Text style={styles.menuDescription}>Kullanıcıları görüntüle, düzenle ve yönet</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/bildirim-yonetimi')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="notifications" size={28} color="#3498db" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>🔔 Bildirim Yönetimi</Text>
              <Text style={styles.menuDescription}>Bildirimleri gönder ve yönet</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/gelen-bildirimler')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="mail" size={28} color="#2980b9" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>📥 Gelen Bildirimler</Text>
              <Text style={styles.menuDescription}>Kullanıcı destek mesajlarını görüntüle</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/admin-destek')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="chatbubbles" size={28} color="#16a085" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>💬 Destek Sohbetleri</Text>
              <Text style={styles.menuDescription}>Kullanıcılarla yazış ve yanıtla</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/sistem-ayarlari')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="settings" size={28} color="#9b59b6" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>⚙️ Sistem Ayarları</Text>
              <Text style={styles.menuDescription}>Sistem konfigürasyonu</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/raporlar-analiz')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="analytics" size={28} color="#e67e22" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>📊 Raporlar & Analiz</Text>
              <Text style={styles.menuDescription}>Detaylı sistem raporları</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/ana-sayfa')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="home" size={28} color="#27ae60" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>🏠 Ana Sayfa</Text>
              <Text style={styles.menuDescription}>Kullanıcı ana sayfasını görüntüle</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </TouchableOpacity>
        </View>

        {/* Alt Bilgi */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>🔐 Güvenli Admin Paneli</Text>
          <Text style={styles.footerSubtext}>Sistem yönetimi için güvenli alan</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    minHeight: '100%',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundShape1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 100,
  },
  backgroundShape2: {
    position: 'absolute',
    top: 100,
    left: -30,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
    borderRadius: 60,
  },
  backgroundShape3: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 250,
    height: 250,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 125,
  },
  backgroundShape4: {
    position: 'absolute',
    bottom: 50,
    right: -20,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
    borderRadius: 50,
  },
  backgroundLine1: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  backgroundLine2: {
    position: 'absolute',
    top: '70%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  backgroundEmojiLeft: {
    position: 'absolute',
    top: '20%',
    left: 20,
    fontSize: 40,
    opacity: 0.1,
  },
  backgroundEmojiRight: {
    position: 'absolute',
    top: '60%',
    right: 20,
    fontSize: 40,
    opacity: 0.1,
  },
  backgroundEmojiTop1: {
    position: 'absolute',
    top: '10%',
    left: '30%',
    fontSize: 30,
    opacity: 0.1,
  },
  backgroundEmojiTop2: {
    position: 'absolute',
    top: '15%',
    right: '30%',
    fontSize: 30,
    opacity: 0.1,
  },
  backgroundEmojiTop3: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    fontSize: 30,
    opacity: 0.1,
  },
  backgroundEmojiBottom1: {
    position: 'absolute',
    bottom: '20%',
    left: '20%',
    fontSize: 30,
    opacity: 0.1,
  },
  backgroundEmojiBottom2: {
    position: 'absolute',
    bottom: '15%',
    right: '20%',
    fontSize: 30,
    opacity: 0.1,
  },
  backgroundEmojiBottom3: {
    position: 'absolute',
    bottom: '25%',
    left: '60%',
    fontSize: 30,
    opacity: 0.1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
    zIndex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
    zIndex: 1,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    zIndex: 1,
  },
  menuButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  menuDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  footerContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    zIndex: 1,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});