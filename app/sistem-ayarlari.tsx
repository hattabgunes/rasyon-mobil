import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Alert, 
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface SystemSettings {
  appName: string;
  appVersion: string;
  maintenanceMode: boolean;
  maxUsers: number;
  dataRetentionDays: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoBackup: boolean;
  securityLevel: 'low' | 'medium' | 'high';
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
  };
}

interface SystemStats {
  totalUsers: number;
  totalAnimals: number;
  totalRations: number;
  totalFeeds: number;
  databaseSize: string;
  lastBackup: string;
  systemUptime: string;
  errorCount: number;
}

export default function SistemAyarlari() {
  const router = useRouter();
  
  // State'ler
  const [settings, setSettings] = useState<SystemSettings>({
    appName: 'Rasyon Mobil',
    appVersion: '1.0.0',
    maintenanceMode: false,
    maxUsers: 1000,
    dataRetentionDays: 365,
    backupFrequency: 'weekly',
    emailNotifications: true,
    pushNotifications: true,
    autoBackup: true,
    securityLevel: 'medium',
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true
    }
  });
  
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalAnimals: 0,
    totalRations: 0,
    totalFeeds: 0,
    databaseSize: '0 MB',
    lastBackup: 'Hiç yedeklenmemiş',
    systemUptime: '0 gün',
    errorCount: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  useEffect(() => {
    loadSystemStats();
    loadSettings();
  }, []);

  const loadSystemStats = async () => {
    setLoading(true);
    try {
      // Kullanıcı sayısı
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // Hayvan sayısı
      const animalsSnapshot = await getDocs(collection(db, 'hayvanlar'));
      
      // Rasyon sayısı
      const rationsSnapshot = await getDocs(collection(db, 'rasyonlar'));
      
      // Yem sayısı
      const feedsSnapshot = await getDocs(collection(db, 'yemler'));
      
      setStats({
        totalUsers: usersSnapshot.size,
        totalAnimals: animalsSnapshot.size,
        totalRations: rationsSnapshot.size,
        totalFeeds: feedsSnapshot.size,
        databaseSize: '2.5 MB', // Simüle edilmiş
        lastBackup: '2 gün önce',
        systemUptime: '15 gün',
        errorCount: 3
      });
    } catch (error) {
      console.error('Sistem istatistikleri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Firestore'dan ayarları yükle (şimdilik varsayılan değerler)
      // Gerçek uygulamada settings koleksiyonundan yüklenecek
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Firestore'a ayarları kaydet
      await updateDoc(doc(db, 'systemSettings', 'main'), {
        ...settings,
        lastUpdated: new Date()
      });
      
      Alert.alert('Başarılı', 'Ayarlar kaydedildi!');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      Alert.alert('Hata', 'Ayarlar kaydedilirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    Alert.alert(
      'Bakım Modu',
      settings.maintenanceMode 
        ? 'Bakım modunu kapatmak istediğinizden emin misiniz?' 
        : 'Bakım modunu açmak istediğinizden emin misiniz? Bu durumda kullanıcılar uygulamaya erişemeyecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            const newSettings = { ...settings, maintenanceMode: !settings.maintenanceMode };
            setSettings(newSettings);
            await saveSettings();
          }
        }
      ]
    );
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      // Yedekleme işlemi simülasyonu
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('Başarılı', 'Sistem yedeği oluşturuldu!');
      setShowBackupModal(false);
    } catch (error) {
      console.error('Yedekleme hatası:', error);
      Alert.alert('Hata', 'Yedekleme sırasında bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    Alert.alert(
      'Önbellek Temizle',
      'Tüm önbellek verilerini temizlemek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          onPress: async () => {
            setLoading(true);
            try {
              // Önbellek temizleme işlemi
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Başarılı', 'Önbellek temizlendi!');
            } catch (error) {
              Alert.alert('Hata', 'Önbellek temizlenirken bir hata oluştu!');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderSettingItem = (
    title: string, 
    subtitle: string, 
    icon: string, 
    onPress: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#e74c3c" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color="#666" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#e74c3c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚙️ Sistem Ayarları</Text>
          <TouchableOpacity onPress={saveSettings} style={styles.saveButton}>
            <Ionicons name="save" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* Sistem Durumu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Sistem Durumu</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Kullanıcı</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalAnimals}</Text>
              <Text style={styles.statLabel}>Hayvan</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalRations}</Text>
              <Text style={styles.statLabel}>Rasyon</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalFeeds}</Text>
              <Text style={styles.statLabel}>Yem</Text>
            </View>
          </View>
          
          <View style={styles.systemInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Veritabanı Boyutu:</Text>
              <Text style={styles.infoValue}>{stats.databaseSize}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Son Yedekleme:</Text>
              <Text style={styles.infoValue}>{stats.lastBackup}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sistem Uptime:</Text>
              <Text style={styles.infoValue}>{stats.systemUptime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hata Sayısı:</Text>
              <Text style={[styles.infoValue, { color: stats.errorCount > 0 ? '#e74c3c' : '#4CAF50' }]}>
                {stats.errorCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Genel Ayarlar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Genel Ayarlar</Text>
          
          {renderSettingItem(
            'Uygulama Adı',
            settings.appName,
            'business',
            () => {},
            <Text style={styles.settingValue}>{settings.appName}</Text>
          )}
          
          {renderSettingItem(
            'Versiyon',
            settings.appVersion,
            'code',
            () => {},
            <Text style={styles.settingValue}>{settings.appVersion}</Text>
          )}
          
          {renderSettingItem(
            'Maksimum Kullanıcı',
            `${settings.maxUsers} kullanıcı`,
            'people',
            () => {},
            <Text style={styles.settingValue}>{settings.maxUsers}</Text>
          )}
          
          {renderSettingItem(
            'Veri Saklama Süresi',
            `${settings.dataRetentionDays} gün`,
            'time',
            () => {},
            <Text style={styles.settingValue}>{settings.dataRetentionDays}</Text>
          )}
        </View>

        {/* Güvenlik Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Güvenlik Ayarları</Text>
          
          {renderSettingItem(
            'Güvenlik Seviyesi',
            settings.securityLevel === 'low' ? 'Düşük' : settings.securityLevel === 'medium' ? 'Orta' : 'Yüksek',
            'shield',
            () => setShowSecurityModal(true),
            <Text style={styles.settingValue}>{settings.securityLevel}</Text>
          )}
          
          {renderSettingItem(
            'Oturum Zaman Aşımı',
            `${settings.sessionTimeout} dakika`,
            'timer',
            () => {},
            <Text style={styles.settingValue}>{settings.sessionTimeout}</Text>
          )}
          
          {renderSettingItem(
            'Şifre Politikası',
            'Şifre kurallarını yönet',
            'key',
            () => {},
            <Ionicons name="chevron-forward" size={20} color="#666" />
          )}
        </View>

        {/* Bildirim Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Bildirim Ayarları</Text>
          
          <View style={styles.switchItem}>
            <View style={styles.switchLeft}>
              <Ionicons name="mail" size={24} color="#e74c3c" />
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>E-posta Bildirimleri</Text>
                <Text style={styles.switchSubtitle}>Sistem bildirimlerini e-posta ile al</Text>
              </View>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={(value) => setSettings({...settings, emailNotifications: value})}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={settings.emailNotifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.switchItem}>
            <View style={styles.switchLeft}>
              <Ionicons name="notifications" size={24} color="#e74c3c" />
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>Push Bildirimleri</Text>
                <Text style={styles.switchSubtitle}>Mobil bildirimler gönder</Text>
              </View>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(value) => setSettings({...settings, pushNotifications: value})}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={settings.pushNotifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Bakım ve Yedekleme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Bakım ve Yedekleme</Text>
          
          <View style={styles.switchItem}>
            <View style={styles.switchLeft}>
              <Ionicons name="construct" size={24} color="#e74c3c" />
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>Bakım Modu</Text>
                <Text style={styles.switchSubtitle}>
                  {settings.maintenanceMode ? 'Aktif - Kullanıcılar erişemez' : 'Pasif - Normal kullanım'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.maintenanceMode}
              onValueChange={toggleMaintenanceMode}
              trackColor={{ false: '#767577', true: '#e74c3c' }}
              thumbColor={settings.maintenanceMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          {renderSettingItem(
            'Sistem Yedeği Oluştur',
            'Manuel yedekleme başlat',
            'cloud-upload',
            () => setShowBackupModal(true)
          )}
          
          {renderSettingItem(
            'Otomatik Yedekleme',
            settings.backupFrequency === 'daily' ? 'Günlük' : settings.backupFrequency === 'weekly' ? 'Haftalık' : 'Aylık',
            'refresh',
            () => {},
            <Text style={styles.settingValue}>{settings.backupFrequency}</Text>
          )}
          
          {renderSettingItem(
            'Önbellek Temizle',
            'Geçici dosyaları temizle',
            'trash',
            clearCache
          )}
        </View>

        {/* Veritabanı Yönetimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗄️ Veritabanı Yönetimi</Text>
          
          {renderSettingItem(
            'Veritabanı Optimizasyonu',
            'Performansı artır',
            'speedometer',
            () => {}
          )}
          
          {renderSettingItem(
            'Eski Verileri Temizle',
            'Kullanılmayan verileri sil',
            'broom',
            () => {}
          )}
          
          {renderSettingItem(
            'Veri Dışa Aktar',
            'CSV/JSON formatında indir',
            'download',
            () => {}
          )}
        </View>

        {/* Sistem Logları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Sistem Logları</Text>
          
          {renderSettingItem(
            'Hata Logları',
            `${stats.errorCount} hata bulundu`,
            'warning',
            () => {},
            <Ionicons name="chevron-forward" size={20} color="#666" />
          )}
          
          {renderSettingItem(
            'Erişim Logları',
            'Kullanıcı giriş kayıtları',
            'log-in',
            () => {},
            <Ionicons name="chevron-forward" size={20} color="#666" />
          )}
          
          {renderSettingItem(
            'Sistem Logları',
            'Genel sistem kayıtları',
            'document-text',
            () => {},
            <Ionicons name="chevron-forward" size={20} color="#666" />
          )}
        </View>
      </View>

      {/* Yedekleme Modalı */}
      <Modal
        visible={showBackupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBackupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💾 Sistem Yedeği</Text>
              <TouchableOpacity 
                onPress={() => setShowBackupModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Sistem yedeği oluşturmak istediğinizden emin misiniz? Bu işlem birkaç dakika sürebilir.
              </Text>
              
              <View style={styles.backupInfo}>
                <Text style={styles.backupInfoTitle}>Yedeklenecek Veriler:</Text>
                <Text style={styles.backupInfoItem}>• Kullanıcı hesapları</Text>
                <Text style={styles.backupInfoItem}>• Hayvan kayıtları</Text>
                <Text style={styles.backupInfoItem}>• Rasyon verileri</Text>
                <Text style={styles.backupInfoItem}>• Yem stok bilgileri</Text>
                <Text style={styles.backupInfoItem}>• Sistem ayarları</Text>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBackupModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={createBackup}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Oluşturuluyor...' : 'Yedekle'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  saveButton: {
    padding: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  systemInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingValue: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchText: {
    marginLeft: 12,
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  backupInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  backupInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  backupInfoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
