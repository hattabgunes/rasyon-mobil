import React, { useLayoutEffect, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, AppState, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, collection, Timestamp, query, where, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tarih formatlama fonksiyonu
function formatDate(ts: any) {
  if (!ts) return '-';
  if (typeof ts === 'string') return ts;
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR');
  return '-';
}

export default function RationChoice() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const isAdmin = params.admin === 'true';
  

  


  // Bildirimleri getiren güvenli no-op fonksiyon (bu ekranda badge kullanılmıyor)
  const fetchNotifications = async () => {
    try {
      // Gerekirse burada kullanıcı bildirimlerini çekebilirsiniz.
      // Şu an için sadece hata önleyici ve log amaçlı tutuluyor.
      return;
    } catch (err) {
      console.log('fetchNotifications error:', err);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isAdmin ? '⚙️ Süper Admin Paneli' : '🐄 Rasyon Seçimi',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: isAdmin ? '#e74c3c' : '#0a7ea4',
      },
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: isAdmin ? '#e74c3c' : '#0a7ea4',
      },
      headerLeft: () => (
        <View style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push('/ana-sayfa')}
            style={{
              backgroundColor: isAdmin ? '#e74c3c' : '#0a7ea4',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginRight: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Ionicons name="home" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
              {isAdmin ? '🏠 Ana Sayfa' : '🏠 Ana Sayfa'}
            </Text>
          </TouchableOpacity>
          {isAdmin && (
            <View style={{
              backgroundColor: '#e74c3c',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginRight: 8
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                ⚙️ ADMIN
              </Text>
            </View>
          )}
        </View>
      ),
      headerRight: () => (
        <View style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push('/profilim')}
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: 12,
              padding: 8,
              borderWidth: 1,
              borderColor: isAdmin ? '#e74c3c' : '#0a7ea4',
              marginRight: 8,
              shadowColor: isAdmin ? '#e74c3c' : '#0a7ea4',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Ionicons name="person-circle" size={24} color={isAdmin ? '#e74c3c' : '#0a7ea4'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: '#e53935',
              borderRadius: 12,
              padding: 8,
              borderWidth: 1,
              borderColor: '#ff6b6b',
              shadowColor: '#e53935',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isAdmin]);

  // Sayfa odaklandığında bildirimleri getir
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && !isAdmin) {
        fetchNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAdmin]);





  const handleLogout = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.replace('/user-login');
  };

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
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
          {/* Sol tarafta büyük inek emoji */}
          <Text style={styles.backgroundEmojiLeft}>🐄</Text>
          
          {/* Sağ tarafta büyük kuzu emoji */}
          <Text style={styles.backgroundEmojiRight}>🐑</Text>
          
          {/* Üstte küçük dekoratif emojiler */}
          <Text style={styles.backgroundEmojiTop1}>🌾</Text>
          <Text style={styles.backgroundEmojiTop2}>🍀</Text>
          <Text style={styles.backgroundEmojiTop3}>🌱</Text>
          
          {/* Altta küçük dekoratif emojiler */}
          <Text style={styles.backgroundEmojiBottom1}>🌽</Text>
          <Text style={styles.backgroundEmojiBottom2}>🧈</Text>
          <Text style={styles.backgroundEmojiBottom3}>🌻</Text>
        </View>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        

        
        <Text style={styles.title}>
          {isAdmin ? 'Ne yapmak istersin?' : 'Ne yapmak istersin?'}
        </Text>
        
        {/* Admin butonu - sadece süper admin için */}
        {isAdmin && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#e74c3c' }]} 
            onPress={() => router.push('/admin-panel')}
          >
            <Text style={styles.buttonText}>
              ⚙️ Admin Paneli
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            console.log('Rasyon hesaplama sayfasına yönlendiriliyor...');
            router.push('/ration');
          }}
        >
          <Text style={styles.buttonText}>
            🐄 Rasyon Hesaplama
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            router.push('/ration-by-feed');
          }}
        >
          <Text style={styles.buttonText}>
            🌾 Elimdeki Yemlerle Hesapla
          </Text>
        </TouchableOpacity>
        

        

      </View>
      

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: { 
    flexGrow: 1, 
    alignItems: 'center', 
    padding: 20,
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
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    backgroundColor: '#0a7ea4',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundShape2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: '#0a7ea4',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundShape3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 100,
    height: 100,
    backgroundColor: '#2ecc71',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundShape4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: '#2ecc71',
    borderRadius: 50,
    opacity: 0.1,
  },
  backgroundLine1: {
    position: 'absolute',
    top: 100,
    left: '50%',
    width: 1,
    height: '100%',
    backgroundColor: '#0a7ea4',
    opacity: 0.1,
  },
  backgroundLine2: {
    position: 'absolute',
    top: '50%',
    left: 100,
    width: '100%',
    height: 1,
    backgroundColor: '#0a7ea4',
    opacity: 0.1,
  },
  backgroundEmojiLeft: {
    position: 'absolute',
    left: 20,
    top: 150,
    fontSize: 120,
    opacity: 0.08,
    color: '#0a7ea4',
  },
  backgroundEmojiRight: {
    position: 'absolute',
    right: 20,
    bottom: 150,
    fontSize: 100,
    opacity: 0.08,
    color: '#2ecc71',
  },
  backgroundEmojiTop1: {
    position: 'absolute',
    left: 50,
    top: 80,
    fontSize: 40,
    opacity: 0.06,
    color: '#ffe066',
  },
  backgroundEmojiTop2: {
    position: 'absolute',
    left: 120,
    top: 60,
    fontSize: 35,
    opacity: 0.06,
    color: '#2ecc71',
  },
  backgroundEmojiTop3: {
    position: 'absolute',
    left: 200,
    top: 90,
    fontSize: 45,
    opacity: 0.06,
    color: '#ffe066',
  },
  backgroundEmojiBottom1: {
    position: 'absolute',
    left: 40,
    bottom: 80,
    fontSize: 35,
    opacity: 0.06,
    color: '#ffe066',
  },
  backgroundEmojiBottom2: {
    position: 'absolute',
    left: 100,
    bottom: 60,
    fontSize: 40,
    opacity: 0.06,
    color: '#ff9800',
  },
  backgroundEmojiBottom3: {
    position: 'absolute',
    left: 160,
    bottom: 90,
    fontSize: 30,
    opacity: 0.06,
    color: '#ffe066',
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    marginBottom: 40, 
    color: '#0a7ea4', 
    textAlign: 'center',
    zIndex: 1,
  },
  button: { 
    backgroundColor: '#0a7ea4', 
    paddingVertical: 22, 
    paddingHorizontal: 32, 
    borderRadius: 12, 
    marginVertical: 18, 
    width: 280, 
    alignItems: 'center', 
    elevation: 3, 
    borderWidth: 1, 
    borderColor: '#0a7ea4',
    zIndex: 1,
  },
  buttonText: { 
    color: '#ffffff', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  
  // Kullanım süresi stilleri
  usageInfo: {
    backgroundColor: '#fff3cd',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ffc107',
    zIndex: 1,
    shadowColor: '#ffc107',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  usageText: {
    color: '#856404',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  daysLeft: {
    color: '#d63384',
    fontWeight: 'bold',
    fontSize: 18,
  },
  expiredText: {
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  premiumText: {
    color: '#856404',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Buton stilleri
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#cccccc',
  },
  buttonTextDisabled: {
    color: '#666666',
  },
  
  // Premium buton stilleri
  premiumButton: {
    backgroundColor: '#ffd700',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
    width: 280,
    alignItems: 'center',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ffd700',
    zIndex: 1,
  },
  premiumButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  // Yenileme butonu stilleri
  refreshButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Destek sistemi stilleri
  supportButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    width: 280,
    alignItems: 'center',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    zIndex: 1,
  },
  supportButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Modal stilleri
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#11181C',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#ff6b6b',
  },
  cancelButtonText: {
    color: '#687076',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Bildirim sistemi stilleri
  notificationButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#0a7ea4',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Bildirim modal stilleri
  noNotificationText: {
    fontSize: 16,
    color: '#687076',
    textAlign: 'center',
    marginVertical: 40,
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unreadNotification: {
    backgroundColor: '#e8f4fd',
    borderColor: '#0a7ea4',
    borderWidth: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#11181C',
  },
  notificationDate: {
    fontSize: 12,
    color: '#687076',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#11181C',
    lineHeight: 20,
  },
  
  // Bildirim modal özel stilleri
  notificationModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '85%',
    height: '65%',
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  notificationModalHeader: {
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  notificationModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  notificationModalFooter: {
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  
  // Yeni eklenen stiller
  emptyNotificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  notificationListContent: {
    paddingBottom: 10,
  },
  closeButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});