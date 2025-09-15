import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';


interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    admin: number;
    normal: number;
  };
  userGrowth: {
    month: string;
    count: number;
  }[];
}

interface AnimalStats {
  totalAnimals: number;
  animalsByType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  averageWeight: number;
  healthStatus: {
    healthy: number;
    sick: number;
    percentage: number;
  };
}

interface RationStats {
  totalRations: number;
  averageCost: number;
  mostUsedFeeds: {
    name: string;
    usage: number;
    percentage: number;
  }[];
  costTrend: {
    month: string;
    cost: number;
  }[];
}

interface FeedStats {
  totalFeeds: number;
  totalStock: number;
  lowStockFeeds: number;
  averagePrice: number;
  priceChanges: {
    feed: string;
    oldPrice: number;
    newPrice: number;
    change: number;
  }[];
}

export default function AdminRaporlar() {
  const router = useRouter();
  
  // State'ler
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    usersByRole: { admin: 0, normal: 0 },
    userGrowth: []
  });
  
  const [animalStats, setAnimalStats] = useState<AnimalStats>({
    totalAnimals: 0,
    animalsByType: [],
    averageWeight: 0,
    healthStatus: { healthy: 0, sick: 0, percentage: 0 }
  });
  
  const [rationStats, setRationStats] = useState<RationStats>({
    totalRations: 0,
    averageCost: 0,
    mostUsedFeeds: [],
    costTrend: []
  });
  
  const [feedStats, setFeedStats] = useState<FeedStats>({
    totalFeeds: 0,
    totalStock: 0,
    lowStockFeeds: 0,
    averagePrice: 0,
    priceChanges: []
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

  useEffect(() => {
    loadAllStats();
  }, [selectedPeriod, loadAllStats]);

  const loadAllStats = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserStats(),
        loadAnimalStats(),
        loadRationStats(),
        loadFeedStats()
      ]);
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
      Alert.alert('Hata', 'İstatistikler yüklenirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newUsersThisMonth = users.filter(user => 
        user.createdAt && user.createdAt.toDate() >= thisMonth
      ).length;
      
      const usersByRole = {
        admin: users.filter(user => user.role === 'admin').length,
        normal: users.filter(user => user.role === 'normal').length
      };
      
      // Simüle edilmiş büyüme verisi
      const userGrowth = [
        { month: 'Oca', count: 45 },
        { month: 'Şub', count: 52 },
        { month: 'Mar', count: 48 },
        { month: 'Nis', count: 61 },
        { month: 'May', count: 58 },
        { month: 'Haz', count: 67 }
      ];
      
      setUserStats({
        totalUsers: users.length,
        activeUsers: users.filter(user => user.isActive).length,
        newUsersThisMonth,
        usersByRole,
        userGrowth
      });
    } catch (error) {
      console.error('Kullanıcı istatistikleri yüklenirken hata:', error);
    }
  };

  const loadAnimalStats = async () => {
    try {
      const animalsSnapshot = await getDocs(collection(db, 'hayvanlar'));
      const animals = animalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Hayvan türlerine göre gruplama
      const typeCounts: { [key: string]: number } = {};
      let totalWeight = 0;
      let healthyCount = 0;
      
      animals.forEach(animal => {
        const type = animal.cins || 'Bilinmeyen';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
        
        if (animal.agirlik) {
          totalWeight += parseFloat(animal.agirlik) || 0;
        }
        
        if (animal.saglikDurumu === 'Sağlıklı') {
          healthyCount++;
        }
      });
      
      const animalsByType = Object.entries(typeCounts).map(([type, count]) => ({
        type,
        count,
        percentage: (count / animals.length) * 100
      }));
      
      setAnimalStats({
        totalAnimals: animals.length,
        animalsByType,
        averageWeight: animals.length > 0 ? totalWeight / animals.length : 0,
        healthStatus: {
          healthy: healthyCount,
          sick: animals.length - healthyCount,
          percentage: animals.length > 0 ? (healthyCount / animals.length) * 100 : 0
        }
      });
    } catch (error) {
      console.error('Hayvan istatistikleri yüklenirken hata:', error);
    }
  };

  const loadRationStats = async () => {
    try {
      const rationsSnapshot = await getDocs(collection(db, 'rasyonlar'));
      const rations = rationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Simüle edilmiş veriler
      const mostUsedFeeds = [
        { name: 'Arpa', usage: 45, percentage: 25 },
        { name: 'Buğday', usage: 38, percentage: 21 },
        { name: 'Mısır', usage: 32, percentage: 18 },
        { name: 'Soya', usage: 28, percentage: 16 },
        { name: 'Yonca', usage: 22, percentage: 12 }
      ];
      
      const costTrend = [
        { month: 'Oca', cost: 1250 },
        { month: 'Şub', cost: 1320 },
        { month: 'Mar', cost: 1280 },
        { month: 'Nis', cost: 1350 },
        { month: 'May', cost: 1420 },
        { month: 'Haz', cost: 1380 }
      ];
      
      setRationStats({
        totalRations: rations.length,
        averageCost: 1350,
        mostUsedFeeds,
        costTrend
      });
    } catch (error) {
      console.error('Rasyon istatistikleri yüklenirken hata:', error);
    }
  };

  const loadFeedStats = async () => {
    try {
      const feedsSnapshot = await getDocs(collection(db, 'yemler'));
      const feeds = feedsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let totalStock = 0;
      let totalPrice = 0;
      let lowStockCount = 0;
      
      feeds.forEach(feed => {
        if (feed.miktar) {
          totalStock += parseFloat(feed.miktar) || 0;
        }
        if (feed.fiyat) {
          totalPrice += parseFloat(feed.fiyat) || 0;
        }
        if (feed.miktar && parseFloat(feed.miktar) < 50) {
          lowStockCount++;
        }
      });
      
      const priceChanges = [
        { feed: 'Arpa', oldPrice: 2.5, newPrice: 2.8, change: 12 },
        { feed: 'Buğday', oldPrice: 3.2, newPrice: 3.0, change: -6.25 },
        { feed: 'Mısır', oldPrice: 2.8, newPrice: 3.1, change: 10.7 },
        { feed: 'Soya', oldPrice: 4.5, newPrice: 4.2, change: -6.67 }
      ];
      
      setFeedStats({
        totalFeeds: feeds.length,
        totalStock,
        lowStockFeeds: lowStockCount,
        averagePrice: feeds.length > 0 ? totalPrice / feeds.length : 0,
        priceChanges
      });
    } catch (error) {
      console.error('Yem istatistikleri yüklenirken hata:', error);
    }
  };

  const exportReport = async (format: string) => {
    setLoading(true);
    try {
      // Simüle edilmiş dışa aktarma işlemi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('Başarılı', `${format.toUpperCase()} formatında rapor oluşturuldu!`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Rapor dışa aktarılırken hata:', error);
      Alert.alert('Hata', 'Rapor dışa aktarılırken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (title: string, value: string | number, subtitle: string, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderChart = (title: string, data: {label: string, value: number, color?: string}[]) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chart}>
        {data.map((item, index) => (
          <View key={index} style={styles.chartItem}>
            <View style={styles.chartBarContainer}>
              <View 
                style={[
                  styles.chartBar, 
                  { 
                    height: (item.value / Math.max(...data.map(d => d.value))) * 100,
                    backgroundColor: item.color || '#e74c3c'
                  }
                ]} 
              />
            </View>
            <Text style={styles.chartLabel}>{item.label}</Text>
            <Text style={styles.chartValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#e74c3c" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📊 Raporlar ve Analiz</Text>
          <TouchableOpacity onPress={() => setShowExportModal(true)} style={styles.exportButton}>
            <Ionicons name="download" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* Zaman Periyodu Seçimi */}
        <View style={styles.periodSelector}>
          {[
            { key: 'week', label: 'Hafta' },
            { key: 'month', label: 'Ay' },
            { key: 'quarter', label: 'Çeyrek' },
            { key: 'year', label: 'Yıl' }
          ].map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.activePeriodButton
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.activePeriodButtonText
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Kullanıcı İstatistikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Kullanıcı İstatistikleri</Text>
          
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Toplam Kullanıcı',
              userStats.totalUsers,
              'Kayıtlı kullanıcı sayısı',
              'people',
              '#2196F3'
            )}
            {renderStatCard(
              'Aktif Kullanıcı',
              userStats.activeUsers,
              'Aktif kullanıcı oranı',
              'person',
              '#4CAF50'
            )}
            {renderStatCard(
              'Bu Ay Yeni',
              userStats.newUsersThisMonth,
              'Yeni kayıtlar',
              'person-add',
              '#FF9800'
            )}
            {renderStatCard(
              'Admin Kullanıcı',
              userStats.usersByRole.admin,
              'Yönetici sayısı',
              'shield',
              '#e74c3c'
            )}
          </View>

          {/* Kullanıcı Büyüme Grafiği */}
          {renderChart(
            'Kullanıcı Büyüme Trendi',
            userStats.userGrowth.map(item => ({
              label: item.month,
              value: item.count,
              color: '#2196F3'
            }))
          )}
        </View>

        {/* Hayvan İstatistikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🐄 Hayvan Performans Analizi</Text>
          
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Toplam Hayvan',
              animalStats.totalAnimals,
              'Kayıtlı hayvan sayısı',
              'paw',
              '#9C27B0'
            )}
            {renderStatCard(
              'Ortalama Ağırlık',
              `${animalStats.averageWeight.toFixed(1)} kg`,
              'Ağırlık ortalaması',
              'scale',
              '#FF5722'
            )}
            {renderStatCard(
              'Sağlıklı Hayvan',
              `${animalStats.healthStatus.percentage.toFixed(1)}%`,
              'Sağlık oranı',
              'medical',
              '#4CAF50'
            )}
            {renderStatCard(
              'Hasta Hayvan',
              animalStats.healthStatus.sick,
              'Hasta sayısı',
              'warning',
              '#e74c3c'
            )}
          </View>

          {/* Hayvan Türü Dağılımı */}
          {animalStats.animalsByType.length > 0 && renderChart(
            'Hayvan Türü Dağılımı',
            animalStats.animalsByType.map(item => ({
              label: item.type,
              value: item.count,
              color: '#9C27B0'
            }))
          )}
        </View>

        {/* Rasyon İstatistikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌾 Rasyon Verimlilik Raporları</Text>
          
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Toplam Rasyon',
              rationStats.totalRations,
              'Oluşturulan rasyon sayısı',
              'leaf',
              '#4CAF50'
            )}
            {renderStatCard(
              'Ortalama Maliyet',
              `${rationStats.averageCost} ₺`,
              'Rasyon başına maliyet',
              'cash',
              '#FF9800'
            )}
            {renderStatCard(
              'En Çok Kullanılan',
              rationStats.mostUsedFeeds[0]?.name || 'N/A',
              'Yem türü',
              'star',
              '#e74c3c'
            )}
            {renderStatCard(
              'Kullanım Oranı',
              `${rationStats.mostUsedFeeds[0]?.percentage || 0}%`,
              'En popüler yem',
              'trending-up',
              '#2196F3'
            )}
          </View>

          {/* En Çok Kullanılan Yemler */}
          {rationStats.mostUsedFeeds.length > 0 && renderChart(
            'En Çok Kullanılan Yemler',
            rationStats.mostUsedFeeds.map(item => ({
              label: item.name,
              value: item.usage,
              color: '#4CAF50'
            }))
          )}

          {/* Maliyet Trendi */}
          {renderChart(
            'Rasyon Maliyet Trendi',
            rationStats.costTrend.map(item => ({
              label: item.month,
              value: item.cost,
              color: '#FF9800'
            }))
          )}
        </View>

        {/* Yem Stok İstatistikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Yem Stok Analizi</Text>
          
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Toplam Yem Türü',
              feedStats.totalFeeds,
              'Farklı yem çeşidi',
              'cube',
              '#607D8B'
            )}
            {renderStatCard(
              'Toplam Stok',
              `${feedStats.totalStock.toFixed(0)} kg`,
              'Toplam yem miktarı',
              'library',
              '#795548'
            )}
            {renderStatCard(
              'Düşük Stok',
              feedStats.lowStockFeeds,
              'Kritik seviye',
              'warning',
              '#e74c3c'
            )}
            {renderStatCard(
              'Ortalama Fiyat',
              `${feedStats.averagePrice.toFixed(2)} ₺`,
              'Kg başına fiyat',
              'pricetag',
              '#4CAF50'
            )}
          </View>

          {/* Fiyat Değişimleri */}
          <View style={styles.priceChangesContainer}>
            <Text style={styles.priceChangesTitle}>Fiyat Değişimleri</Text>
            {feedStats.priceChanges.map((change, index) => (
              <View key={index} style={styles.priceChangeItem}>
                <Text style={styles.priceChangeFeed}>{change.feed}</Text>
                <View style={styles.priceChangeValues}>
                  <Text style={styles.priceChangeOld}>{change.oldPrice} ₺</Text>
                  <Ionicons 
                    name={change.change > 0 ? "arrow-up" : "arrow-down"} 
                    size={16} 
                    color={change.change > 0 ? "#e74c3c" : "#4CAF50"} 
                  />
                  <Text style={styles.priceChangeNew}>{change.newPrice} ₺</Text>
                  <Text style={[
                    styles.priceChangePercent,
                    { color: change.change > 0 ? "#e74c3c" : "#4CAF50" }
                  ]}>
                    {change.change > 0 ? '+' : ''}{change.change.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Dışa Aktarma Modalı */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Rapor Dışa Aktar</Text>
              <TouchableOpacity 
                onPress={() => setShowExportModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Raporu hangi formatta dışa aktarmak istiyorsunuz?
              </Text>
              
              <View style={styles.formatOptions}>
                {[
                  { key: 'pdf', label: 'PDF', icon: 'document-text' },
                  { key: 'excel', label: 'Excel', icon: 'grid' },
                  { key: 'csv', label: 'CSV', icon: 'list' }
                ].map(format => (
                  <TouchableOpacity
                    key={format.key}
                    style={[
                      styles.formatOption,
                      exportFormat === format.key && styles.selectedFormatOption
                    ]}
                    onPress={() => setExportFormat(format.key)}
                  >
                    <Ionicons 
                      name={format.icon as any} 
                      size={24} 
                      color={exportFormat === format.key ? '#e74c3c' : '#666'} 
                    />
                    <Text style={[
                      styles.formatOptionText,
                      exportFormat === format.key && styles.selectedFormatOptionText
                    ]}>
                      {format.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => exportReport(exportFormat)}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Oluşturuluyor...' : 'Dışa Aktar'}
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
  exportButton: {
    padding: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activePeriodButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
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
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  chartContainer: {
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 10,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarContainer: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBar: {
    width: 30,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  priceChangesContainer: {
    marginTop: 20,
  },
  priceChangesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  priceChangeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceChangeFeed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priceChangeValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChangeOld: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  priceChangeNew: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  priceChangePercent: {
    fontSize: 12,
    fontWeight: '600',
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
  formatOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  formatOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
  },
  selectedFormatOption: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  formatOptionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedFormatOptionText: {
    color: '#e74c3c',
    fontWeight: '600',
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
