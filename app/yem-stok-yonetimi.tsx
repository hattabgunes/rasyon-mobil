import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert, 
  Modal,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { app } from '../firebaseConfig';

interface Yem {
  id: string;
  ad: string;
  kategori: string;
  miktar: number;
  birim: string;
  fiyat: number;
  tedarikci: string;
  sonGuncelleme: Date;
  notlar: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function YemStokYonetimi() {
  const router = useRouter();
  const [yemler, setYemler] = useState<Yem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editingYem, setEditingYem] = useState<Yem | null>(null);
  const [stokInputValues, setStokInputValues] = useState<{ [key: string]: string }>({});
  
  // Form state'leri
  const [ad, setAd] = useState('');
  const [kategori, setKategori] = useState('');
  const [miktar, setMiktar] = useState('');
  const [birim, setBirim] = useState('kg');
  const [fiyat, setFiyat] = useState('');
  const [tedarikci, setTedarikci] = useState('');
  const [notlar, setNotlar] = useState('');

  const birimler = ['kg', 'ton', 'litre', 'adet'];
  const kategoriler = ['Kaba Yem', 'Kesif Yem', 'Mineral', 'Vitamin', 'Diğer'];

  useEffect(() => {
    fetchYemler();
  }, []);

  const fetchYemler = async () => {
    setLoading(true);
    try {
      console.log('Yemler yükleniyor...');
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      console.log('Yem stok kullanıcı durumu:', user ? `Giriş yapmış: ${user.uid}` : 'Giriş yapmamış');
      
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı giriş yapmamış!');
        return;
      }

      const db = getFirestore(app);
      const yemlerRef = collection(db, 'yemler');
      const q = query(yemlerRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      console.log('Yem sorgusu tamamlandı, bulunan doküman sayısı:', querySnapshot.docs.length);
      
      const yemlerList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Yem[];
      
      console.log('Yemler listesi:', yemlerList);
      setYemler(yemlerList);
    } catch (error) {
      console.error('Yemler getirilemedi:', error);
      Alert.alert('Hata', 'Yemler yüklenirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAd('');
    setKategori('');
    setMiktar('');
    setBirim('kg');
    setFiyat('');
    setTedarikci('');
    setNotlar('');
    setEditingYem(null);
  };

  const handleSubmit = async () => {
    if (!ad.trim() || !kategori.trim() || !miktar.trim()) {
      Alert.alert('Uyarı', 'Lütfen gerekli alanları doldurun!');
      return;
    }

    try {
      console.log('Yem kaydediliyor...');
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      console.log('Yem ekleme kullanıcı durumu:', user ? `Giriş yapmış: ${user.uid}` : 'Giriş yapmamış');
      
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı giriş yapmamış!');
        return;
      }

      const db = getFirestore(app);
      const yemData = {
        userId: user.uid,
        ad: ad.trim(),
        kategori: kategori.trim(),
        miktar: parseFloat(miktar) || 0,
        birim,
        fiyat: parseFloat(fiyat) || 0,
        tedarikci: tedarikci.trim(),
        notlar: notlar.trim(),
        sonGuncelleme: new Date(),
        createdAt: editingYem ? editingYem.createdAt : new Date(),
        updatedAt: new Date(),
      };

      console.log('Kaydedilecek yem verisi:', yemData);

      if (editingYem) {
        // Güncelleme
        console.log('Yem güncelleniyor:', editingYem.id);
        await updateDoc(doc(db, 'yemler', editingYem.id), yemData);
        Alert.alert('Başarılı', 'Yem bilgileri güncellendi!');
      } else {
        // Yeni kayıt
        console.log('Yeni yem ekleniyor...');
        const docRef = await addDoc(collection(db, 'yemler'), yemData);
        console.log('Yem başarıyla eklendi, ID:', docRef.id);
        Alert.alert('Başarılı', 'Yeni yem kaydedildi!');
      }

      setModalVisible(false);
      resetForm();
      fetchYemler();
    } catch (error) {
      console.error('Yem kaydedilemedi:', error);
      Alert.alert('Hata', 'Yem kaydedilirken bir hata oluştu!');
    }
  };

  const handleEdit = (yem: Yem) => {
    setEditingYem(yem);
    setAd(yem.ad);
    setKategori(yem.kategori);
    setMiktar(yem.miktar.toString());
    setBirim(yem.birim);
    setFiyat(yem.fiyat.toString());
    setTedarikci(yem.tedarikci);
    setNotlar(yem.notlar);
    setModalVisible(true);
  };

  const handleDelete = async (yem: Yem) => {
    Alert.alert(
      'Yemi Sil',
      `${yem.ad} yemini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore(app);
              await deleteDoc(doc(db, 'yemler', yem.id));
              Alert.alert('Başarılı', 'Yem silindi!');
              fetchYemler();
            } catch (error) {
              console.error('Yem silinemedi:', error);
              Alert.alert('Hata', 'Yem silinirken bir hata oluştu!');
            }
          }
        }
      ]
    );
  };

  const handleStokGuncelle = async (yem: Yem, yeniMiktar: number, yeniFiyat: number) => {
    try {
      const db = getFirestore(app);
      await updateDoc(doc(db, 'yemler', yem.id), {
        miktar: yeniMiktar,
        fiyat: yeniFiyat,
        sonGuncelleme: new Date(),
        updatedAt: new Date(),
      });
      Alert.alert('Başarılı', 'Stok miktarı ve fiyat güncellendi!');
      fetchYemler();
    } catch (error) {
      console.error('Stok güncellenemedi:', error);
      Alert.alert('Hata', 'Stok güncellenirken bir hata oluştu!');
    }
  };

  const filteredYemler = yemler.filter(yem =>
    yem.ad.toLowerCase().includes(searchText.toLowerCase()) ||
    yem.kategori.toLowerCase().includes(searchText.toLowerCase()) ||
    yem.tedarikci.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStokDurumu = (yem: Yem) => {
    if (yem.miktar <= 0) {
      return { color: '#f44336', text: 'Stok Yok' };
    } else if (yem.miktar <= 10) {
      return { color: '#ff9800', text: 'Düşük Stok' };
    } else {
      return { color: '#4caf50', text: 'Yeterli Stok' };
    }
  };

  const renderYemItem = ({ item }: { item: Yem }) => {
    const stokDurumu = getStokDurumu(item);
    
    return (
      <View style={styles.yemCard}>
        <View style={styles.yemHeader}>
          <View style={styles.yemBaslik}>
            <Text style={styles.yemAd}>🌾 {item.ad}</Text>
            <View style={[styles.stokDurumu, { backgroundColor: stokDurumu.color }]}>
              <Text style={styles.stokDurumuText}>{stokDurumu.text}</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]} 
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="pencil" size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]} 
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.yemInfo}>
          <Text style={styles.yemText}>🏷️ <Text style={styles.label}>Kategori:</Text> {item.kategori}</Text>
          <Text style={styles.yemText}>📊 <Text style={styles.label}>Miktar:</Text> {item.miktar} {item.birim}</Text>
          <Text style={styles.yemText}>💰 <Text style={styles.label}>Fiyat:</Text> {item.fiyat} ₺/{item.birim}</Text>
          <Text style={styles.yemText}>💵 <Text style={styles.label}>Toplam Değer:</Text> {(item.miktar * item.fiyat).toFixed(2)} ₺</Text>
          <Text style={styles.yemText}>🏢 <Text style={styles.label}>Tedarikçi:</Text> {item.tedarikci || 'Belirtilmemiş'}</Text>
          {item.notlar && (
            <Text style={styles.yemText}>📝 <Text style={styles.label}>Notlar:</Text> {item.notlar}</Text>
          )}
        </View>

        <View style={styles.stokGuncelleme}>
          <Text style={styles.stokGuncellemeLabel}>Stok Güncelleme:</Text>
          
          {/* Miktar Güncelleme */}
          <View style={styles.stokGuncellemeRow}>
            <Text style={styles.inputLabel}>📊 Yeni Miktar:</Text>
            <TextInput
              style={styles.stokInput}
              placeholder="Yeni miktar"
              keyboardType="numeric"
              value={stokInputValues[item.id] || item.miktar.toString()}
              onChangeText={(text) => {
                setStokInputValues(prev => ({
                  ...prev,
                  [item.id]: text
                }));
              }}
            />
            <Text style={styles.birimText}>{item.birim}</Text>
          </View>

          {/* Fiyat Güncelleme */}
          <View style={styles.stokGuncellemeRow}>
            <Text style={styles.inputLabel}>💰 Yeni Fiyat (₺):</Text>
            <TextInput
              style={styles.stokInput}
              placeholder="Yeni fiyat"
              keyboardType="numeric"
              value={stokInputValues[`${item.id}_fiyat`] || item.fiyat.toString()}
              onChangeText={(text) => {
                setStokInputValues(prev => ({
                  ...prev,
                  [`${item.id}_fiyat`]: text
                }));
              }}
            />
            <Text style={styles.birimText}>₺/{item.birim}</Text>
          </View>

          {/* Güncelleme Butonu */}
          <View style={styles.stokGuncellemeRow}>
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={() => {
                const inputMiktar = stokInputValues[item.id] || item.miktar.toString();
                const inputFiyat = stokInputValues[`${item.id}_fiyat`] || item.fiyat.toString();
                const yeniMiktar = parseFloat(inputMiktar) || 0;
                const yeniFiyat = parseFloat(inputFiyat) || 0;
                
                if (yeniMiktar >= 0 && yeniFiyat >= 0) {
                  handleStokGuncelle(item, yeniMiktar, yeniFiyat);
                  // Input değerlerini temizle
                  setStokInputValues(prev => ({
                    ...prev,
                    [item.id]: '',
                    [`${item.id}_fiyat`]: ''
                  }));
                }
              }}
            >
              <Text style={styles.updateButtonText}>Stok ve Fiyat Güncelle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🌾 Yem Stok Yönetimi</Text>
          <Text style={styles.headerSubtitle}>Stok takibi ve yönetimi</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Yem adı, kategori veya tedarikçi ile arama yapın..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999999"
        />
      </View>

      {/* Stok Özeti */}
      <View style={styles.stokOzeti}>
        <Text style={styles.stokOzetiTitle}>📈 Stok Özeti</Text>
        <View style={styles.stokOzetiRow}>
          <View style={styles.stokOzetiCard}>
            <Text style={styles.stokOzetiNumber}>{yemler.length}</Text>
            <Text style={styles.stokOzetiLabel}>Toplam Yem</Text>
          </View>
          <View style={styles.stokOzetiCard}>
            <Text style={styles.stokOzetiNumber}>
              {yemler.filter(y => y.miktar <= 0).length}
            </Text>
            <Text style={styles.stokOzetiLabel}>Stok Yok</Text>
          </View>
          <View style={styles.stokOzetiCard}>
            <Text style={styles.stokOzetiNumber}>
              {yemler.reduce((total, y) => total + (y.miktar * y.fiyat), 0).toFixed(0)}
            </Text>
            <Text style={styles.stokOzetiLabel}>Toplam Değer (₺)</Text>
          </View>
        </View>
      </View>

      {/* Yem Listesi */}
      <FlatList
        data={filteredYemler}
        renderItem={renderYemItem}
        keyExtractor={(item) => item.id}
        style={styles.yemList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf" size={64} color="#cccccc" />
            <Text style={styles.emptyText}>
              {searchText ? 'Arama sonucu bulunamadı' : 'Henüz yem kaydı yok'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Farklı arama terimleri deneyin' : 'Yeni yem eklemek için + butonuna tıklayın'}
            </Text>
          </View>
        }
      />

      {/* Yem Ekleme/Düzenleme Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingYem ? 'Yem Düzenle' : 'Yeni Yem Ekle'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🌾 Yem Adı *</Text>
                <TextInput
                  style={styles.input}
                  value={ad}
                  onChangeText={setAd}
                  placeholder="Yem adını girin"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🏷️ Kategori *</Text>
                <View style={styles.pickerContainer}>
                  {kategoriler.map((kat) => (
                    <TouchableOpacity
                      key={kat}
                      style={[
                        styles.pickerOption,
                        kategori === kat && styles.pickerOptionActive
                      ]}
                      onPress={() => setKategori(kat)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        kategori === kat && styles.pickerOptionTextActive
                      ]}>{kat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>📊 Miktar *</Text>
                  <TextInput
                    style={styles.input}
                    value={miktar}
                    onChangeText={setMiktar}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>📏 Birim</Text>
                  <View style={styles.pickerContainer}>
                    {birimler.map((bir) => (
                      <TouchableOpacity
                        key={bir}
                        style={[
                          styles.pickerOption,
                          birim === bir && styles.pickerOptionActive
                        ]}
                        onPress={() => setBirim(bir)}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          birim === bir && styles.pickerOptionTextActive
                        ]}>{bir}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>💰 Fiyat (₺)</Text>
                <TextInput
                  style={styles.input}
                  value={fiyat}
                  onChangeText={setFiyat}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🏢 Tedarikçi</Text>
                <TextInput
                  style={styles.input}
                  value={tedarikci}
                  onChangeText={setTedarikci}
                  placeholder="Tedarikçi firması"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📝 Notlar</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notlar}
                  onChangeText={setNotlar}
                  placeholder="Ek notlar..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSubmit}
              >
                <Text style={styles.saveButtonText}>
                  {editingYem ? 'Güncelle' : 'Kaydet'}
                </Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 12,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333333',
  },
  stokOzeti: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stokOzetiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 16,
  },
  stokOzetiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stokOzetiCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  stokOzetiNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  stokOzetiLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  yemList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  yemCard: {
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
  yemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  yemBaslik: {
    flex: 1,
  },
  yemAd: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
  },
  stokDurumu: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  stokDurumuText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  yemInfo: {
    gap: 6,
    marginBottom: 16,
  },
  yemText: {
    fontSize: 14,
    color: '#333333',
  },
  label: {
    fontWeight: '600',
    color: '#666666',
  },
  stokGuncelleme: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  stokGuncellemeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
    minWidth: 80,
  },
  stokGuncellemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stokInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
    color: '#333333',
    marginRight: 8,
  },
  birimText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'center',
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '90%',
    elevation: 8,
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
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#333333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  pickerOptionActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  pickerOptionTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#FF9800',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

