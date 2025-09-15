import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from '../firebaseConfig';

interface Hayvan {
  id: string;
  kupeNo: string;
  cins: string;
  cinsiyet: string;
  yas: number;
  agirlik: number;
  saglikDurumu: string;
  uretimTipi: string;
  dogumTarihi: string;
  notlar: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

interface Yem {
  id: string;
  ad: string;
  kategori: string;
  miktar: number;
  birim: string;
  fiyat: number;
  tedarikci: string;
  sonGuncelleme: any;
  notlar: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export default function RaporlarAnaliz() {
  const [selectedSection, setSelectedSection] = useState<'hayvan' | 'yem'>('hayvan');
  const [hayvanData, setHayvanData] = useState<Hayvan[]>([]);
  const [yemData, setYemData] = useState<Yem[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [stats, setStats] = useState({
    toplamHayvan: 0,
    toplamYem: 0,
    aktifRasyon: 0,
    ortalamaYas: 0,
    ortalamaAgirlik: 0,
    saglikliHayvan: 0,
    hastaHayvan: 0
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Raporlar ve analiz verileri yükleniyor...');
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        console.log('Kullanıcı giriş yapmamış, raporlar yüklenemiyor');
        return;
      }

      console.log('Raporlar kullanıcı durumu:', `Giriş yapmış: ${user.uid}`);
      const db = getFirestore(app);
      
      // Hayvan verilerini getir (sadece kullanıcıya ait)
      const hayvanlarQuery = query(collection(db, 'hayvanlar'), where('userId', '==', user.uid));
      const hayvanlarSnapshot = await getDocs(hayvanlarQuery);
      const hayvanlar = hayvanlarSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hayvan[];
      console.log('Hayvan verileri yüklendi:', hayvanlar.length);
      setHayvanData(hayvanlar);

      // Yem verilerini getir (sadece kullanıcıya ait)
      const yemlerQuery = query(collection(db, 'yemler'), where('userId', '==', user.uid));
      const yemlerSnapshot = await getDocs(yemlerQuery);
      const yemler = yemlerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Yem[];
      console.log('Yem verileri yüklendi:', yemler.length);
      setYemData(yemler);

      // Feeding time verilerini getir (sadece kullanıcıya ait)
      const feedingTimesQuery = query(collection(db, 'feedingTimes'), where('userId', '==', user.uid));
      const feedingTimesSnapshot = await getDocs(feedingTimesQuery);
      const feedingTimes = feedingTimesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Feeding time verileri yüklendi:', feedingTimes.length);

      // İstatistikleri hesapla
      const toplamHayvan = hayvanlar.length;
      const toplamYem = yemler.length;
      const aktifRasyon = feedingTimes.filter((ft: any) => ft.enabled).length;
      
      // Hayvan istatistikleri
      const ortalamaYas = hayvanlar.length > 0 ? hayvanlar.reduce((sum, h) => sum + h.yas, 0) / hayvanlar.length : 0;
      const ortalamaAgirlik = hayvanlar.length > 0 ? hayvanlar.reduce((sum, h) => sum + h.agirlik, 0) / hayvanlar.length : 0;
      const saglikliHayvan = hayvanlar.filter(h => h.saglikDurumu === 'Sağlıklı').length;
      const hastaHayvan = hayvanlar.filter(h => h.saglikDurumu === 'Hasta').length;

      const newStats = {
        toplamHayvan,
        toplamYem,
        aktifRasyon,
        ortalamaYas: Math.round(ortalamaYas * 10) / 10,
        ortalamaAgirlik: Math.round(ortalamaAgirlik * 10) / 10,
        saglikliHayvan,
        hastaHayvan
      };

      console.log('Hesaplanan istatistikler:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getHayvanPerformans = () => {
    if (hayvanData.length === 0) return null;

    console.log('Hayvan performans hesaplanıyor, hayvan sayısı:', hayvanData.length);
    const toplamHayvan = hayvanData.length;
    const aktifHayvan = hayvanData.filter((h: any) => h.saglikDurumu === 'Sağlıklı').length;
    
    // Üretim tipine göre sayım
    const sütHayvanları = hayvanData.filter((h: any) => h.uretimTipi === 'Süt').length;
    const etHayvanları = hayvanData.filter((h: any) => h.uretimTipi === 'Et').length;
    
    // Ortalama yaş hesapla (yıl cinsinden)
    const toplamYas = hayvanData.reduce((sum: any, h: any) => sum + (h.yas || 0), 0);
    const ortalamaYas = toplamYas / toplamHayvan;

    // Sağlık durumu hesapla
    const saglikliHayvan = hayvanData.filter((h: any) => h.saglikDurumu === 'Sağlıklı').length;
    const hastaHayvan = hayvanData.filter((h: any) => h.saglikDurumu === 'Hasta').length;
    const saglikOrani = toplamHayvan > 0 ? ((saglikliHayvan / toplamHayvan) * 100).toFixed(1) : '0';

    // Ortalama ağırlık hesapla
    const toplamAgirlik = hayvanData.reduce((sum: any, h: any) => sum + (h.agirlik || 0), 0);
    const ortalamaAgirlik = toplamAgirlik / toplamHayvan;

    const performans = {
      toplamHayvan,
      aktifHayvan,
      sütHayvanları,
      etHayvanları,
      ortalamaYas: ortalamaYas.toFixed(1),
      ortalamaAgirlik: ortalamaAgirlik.toFixed(1),
      aktifOran: toplamHayvan > 0 ? ((aktifHayvan / toplamHayvan) * 100).toFixed(1) : '0',
      saglikliHayvan,
      hastaHayvan,
      saglikOrani
    };

    console.log('Hayvan performans sonuçları:', performans);
    return performans;
  };

  const getYemPerformans = () => {
    if (yemData.length === 0) return null;

    console.log('Yem performans hesaplanıyor, yem sayısı:', yemData.length);
    const toplamYemCesidi = yemData.length;
    const toplamStok = yemData.reduce((sum: any, y: any) => sum + (y.miktar || 0), 0);
    const toplamDeger = yemData.reduce((sum: any, y: any) => sum + ((y.miktar || 0) * (y.fiyat || 0)), 0);
    
    // Düşük stok uyarısı
    const dusukStok = yemData.filter((y: any) => (y.miktar || 0) <= 10).length;
    const stokYok = yemData.filter((y: any) => (y.miktar || 0) <= 0).length;

    const performans = {
      toplamYemCesidi,
      toplamStok: toplamStok.toFixed(1),
      toplamDeger: toplamDeger.toFixed(0),
      dusukStok,
      stokYok,
      ortalamaFiyat: toplamStok > 0 ? (toplamDeger / toplamStok).toFixed(2) : '0.00'
    };

    console.log('Yem performans sonuçları:', performans);
    return performans;
  };

  const showReportDetail = (report: any) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  const renderHayvanRaporlari = () => {
    const performans = getHayvanPerformans();
    
    if (!performans) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="paw" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Henüz hayvan verisi bulunamadı</Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionContent}>
        {/* Özet Kartları */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{performans.toplamHayvan}</Text>
            <Text style={styles.summaryLabel}>Toplam Hayvan</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{performans.aktifHayvan}</Text>
            <Text style={styles.summaryLabel}>Aktif Hayvan</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{performans.saglikOrani}%</Text>
            <Text style={styles.summaryLabel}>Sağlık Oranı</Text>
          </View>
        </View>

        {/* Detaylı Raporlar */}
        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>📊 Detaylı Hayvan Raporları</Text>
          
          <TouchableOpacity 
            style={styles.reportCard}
            onPress={() => showReportDetail({
              title: 'Hayvan Türü Dağılımı',
              data: {
                'Süt İnekleri': performans.sütHayvanları,
                'Et Hayvanları': performans.etHayvanları,
                'Diğer': performans.toplamHayvan - performans.sütHayvanları - performans.etHayvanları
              },
              type: 'chart'
            })}
          >
            <View style={styles.reportCardHeader}>
              <Ionicons name="pie-chart" size={24} color="#4CAF50" />
              <Text style={styles.reportCardTitle}>Hayvan Türü Dağılımı</Text>
            </View>
            <Text style={styles.reportCardDesc}>Süt ve et hayvanlarının oranları</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.reportCard}
            onPress={() => showReportDetail({
              title: 'Sağlık Durumu Analizi',
              data: {
                'Sağlıklı': performans.saglikliHayvan,
                'Hasta': performans.hastaHayvan
              },
              type: 'health'
            })}
          >
            <View style={styles.reportCardHeader}>
              <Ionicons name="medical" size={24} color="#FF9800" />
              <Text style={styles.reportCardTitle}>Sağlık Durumu</Text>
            </View>
            <Text style={styles.reportCardDesc}>Hayvanların sağlık durumu analizi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderYemRaporlari = () => {
    const performans = getYemPerformans();
    
    if (!performans) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="leaf" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Henüz yem verisi bulunamadı</Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionContent}>
        {/* Özet Kartları */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{performans.toplamYemCesidi}</Text>
            <Text style={styles.summaryLabel}>Yem Çeşidi</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{performans.toplamStok}</Text>
            <Text style={styles.summaryLabel}>Toplam Stok (kg)</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{performans.toplamDeger} ₺</Text>
            <Text style={styles.summaryLabel}>Toplam Değer</Text>
          </View>
        </View>

        {/* Stok Durumu */}
        <View style={styles.stockStatusContainer}>
          <Text style={styles.stockStatusTitle}>Stok Durumu</Text>
          <View style={styles.stockStatusRow}>
            <View style={[styles.stockStatusItem, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.stockStatusNumber}>{performans.toplamYemCesidi - performans.dusukStok - performans.stokYok}</Text>
              <Text style={styles.stockStatusLabel}>Normal Stok</Text>
            </View>
            <View style={[styles.stockStatusItem, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.stockStatusNumber}>{performans.dusukStok}</Text>
              <Text style={styles.stockStatusLabel}>Düşük Stok</Text>
            </View>
            <View style={[styles.stockStatusItem, { backgroundColor: '#f44336' }]}>
              <Text style={styles.stockStatusNumber}>{performans.stokYok}</Text>
              <Text style={styles.stockStatusLabel}>Stok Yok</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedSection === 'hayvan' && styles.activeTab]}
          onPress={() => setSelectedSection('hayvan')}
        >
          <Ionicons name="paw" size={20} color={selectedSection === 'hayvan' ? '#ffffff' : '#666'} />
          <Text style={[styles.tabText, selectedSection === 'hayvan' && styles.activeTabText]}>
            Hayvan Performans
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedSection === 'yem' && styles.activeTab]}
          onPress={() => setSelectedSection('yem')}
        >
          <Ionicons name="leaf" size={20} color={selectedSection === 'yem' ? '#ffffff' : '#666'} />
          <Text style={[styles.tabText, selectedSection === 'yem' && styles.activeTabText]}>
            Yem & Beslenme
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Raporlar yükleniyor...</Text>
          </View>
        ) : (
          <>
            {/* Genel İstatistikler */}
            <View style={styles.generalStatsSection}>
              <Text style={styles.sectionTitle}>📊 Genel İstatistikler</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.toplamHayvan}</Text>
                  <Text style={styles.statLabel}>Toplam Hayvan</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.toplamYem}</Text>
                  <Text style={styles.statLabel}>Yem Çeşidi</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.aktifRasyon}</Text>
                  <Text style={styles.statLabel}>Aktif Rasyon</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.ortalamaYas}</Text>
                  <Text style={styles.statLabel}>Ort. Yaş (Yıl)</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.ortalamaAgirlik}</Text>
                  <Text style={styles.statLabel}>Ort. Ağırlık (kg)</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.saglikliHayvan}</Text>
                  <Text style={styles.statLabel}>Sağlıklı Hayvan</Text>
                </View>
              </View>
            </View>

            {/* Seçili Bölüm */}
            {selectedSection === 'hayvan' ? renderHayvanRaporlari() : renderYemRaporlari()}
          </>
        )}
      </ScrollView>

      {/* Detay Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedReport?.title}</Text>
              <TouchableOpacity 
                onPress={() => setDetailModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {selectedReport?.type === 'chart' && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Dağılım Grafiği</Text>
                  {Object.entries(selectedReport.data).map(([key, value]: [string, any]) => (
                    <View key={key} style={styles.chartItem}>
                      <Text style={styles.chartLabel}>{key}</Text>
                      <View style={styles.chartBar}>
                        <View 
                          style={[
                            styles.chartBarFill, 
                            { width: `${(value / Object.values(selectedReport.data as Record<string, number>).reduce((a, b) => a + b, 0)) * 100}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.chartValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {selectedReport?.type === 'health' && (
                <View style={styles.healthContainer}>
                  <Text style={styles.healthTitle}>Sağlık Durumu</Text>
                  <View style={styles.healthStats}>
                    {Object.entries(selectedReport.data).map(([key, value]: [string, any]) => (
                      <View key={key} style={styles.healthItem}>
                        <Text style={styles.healthLabel}>{key}</Text>
                        <Text style={styles.healthValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.healthDesc}>
                    Toplam {Object.values(selectedReport.data as Record<string, number>).reduce((a, b) => a + b, 0)} hayvan
                  </Text>
                </View>
              )}
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
    backgroundColor: '#f8f9fa',
  },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#9C27B0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  generalStatsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  sectionContent: {
    flex: 1,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  stockStatusContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stockStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  stockStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockStatusItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  stockStatusNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  stockStatusLabel: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  reportSection: {
    marginTop: 20,
  },
  reportSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  reportCardDesc: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 14,
    color: '#333',
    width: 100,
  },
  chartBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    backgroundColor: '#9C27B0',
    borderRadius: 10,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },
  healthContainer: {
    marginBottom: 20,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  healthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  healthItem: {
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  healthDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
