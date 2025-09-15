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
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { app } from '../firebaseConfig';

interface Hayvan {
  id: string;
  kupeNo: string;
  cins: string;
  yas: number;
  agirlik: number;
  cinsiyet: 'Erkek' | 'Dişi';
  uretimTipi?: 'Et' | 'Süt';
  dogumTarihi: string;
  saglikDurumu: 'Sağlıklı' | 'Hasta';
  notlar: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function HayvanYonetimi() {
  const [hayvanlar, setHayvanlar] = useState<Hayvan[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editingHayvan, setEditingHayvan] = useState<Hayvan | null>(null);
  
  // Form state'leri
  const [kupeNo, setKupeNo] = useState('');
  const [cins, setCins] = useState('');
  const [yas, setYas] = useState('');
  const [agirlik, setAgirlik] = useState('');
  const [cinsiyet, setCinsiyet] = useState<'Erkek' | 'Dişi'>('Erkek');
  const [dogumTarihi, setDogumTarihi] = useState('');
  const [saglikDurumu, setSaglikDurumu] = useState<'Sağlıklı' | 'Hasta'>('Sağlıklı');
  const [notlar, setNotlar] = useState('');
  const [uretimTipi, setUretimTipi] = useState<'Et' | 'Süt'>('Süt');

  useEffect(() => {
    console.log('Hayvan yönetimi sayfası yüklendi');
    const auth = getAuth(app);
    const user = auth.currentUser;
    console.log('Hayvan yönetimi kullanıcı durumu:', user ? `Giriş yapmış: ${user.uid}` : 'Giriş yapmamış');
    
    fetchHayvanlar();
  }, []);

  const fetchHayvanlar = async () => {
    try {
      console.log('Hayvanlar yükleniyor...');
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      console.log('Kullanıcı:', user ? user.uid : 'Giriş yapmamış');
      
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı giriş yapmamış!');
        return;
      }

      const db = getFirestore(app);
      const hayvanlarRef = collection(db, 'hayvanlar');
      const q = query(hayvanlarRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      console.log('Firestore sorgusu tamamlandı, bulunan doküman sayısı:', querySnapshot.docs.length);
      
      const hayvanlarList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hayvan[];
      
      console.log('Hayvanlar listesi:', hayvanlarList);
      setHayvanlar(hayvanlarList);
    } catch (error) {
      console.error('Hayvanlar yüklenirken hata:', error);
      Alert.alert('Hata', 'Hayvanlar yüklenirken bir hata oluştu!');
    }
  };

  const resetForm = () => {
    setKupeNo('');
    setCins('');
    setYas('');
    setAgirlik('');
    setCinsiyet('Erkek');
    setDogumTarihi('');
    setSaglikDurumu('Sağlıklı');
    setNotlar('');
    setUretimTipi('Süt');
    setEditingHayvan(null);
  };

  const handleSubmit = async () => {
    if (!kupeNo.trim() || !cins.trim()) {
      Alert.alert('Uyarı', 'Lütfen gerekli alanları doldurun!');
      return;
    }

    try {
      console.log('Hayvan kaydediliyor...');
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      console.log('Kullanıcı:', user ? user.uid : 'Giriş yapmamış');
      
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı giriş yapmamış!');
        return;
      }

      const db = getFirestore(app);
      const hayvanData = {
        userId: user.uid,
        kupeNo: kupeNo.trim(),
        cins: cins.trim(),
        yas: parseInt(yas) || 0,
        agirlik: parseFloat(agirlik) || 0,
        cinsiyet,
        uretimTipi,
        dogumTarihi: dogumTarihi || new Date().toISOString().split('T')[0],
        saglikDurumu: saglikDurumu, // .trim() kaldırıldı çünkü zaten union type
        notlar: notlar.trim(),
        createdAt: editingHayvan ? editingHayvan.createdAt : new Date(),
        updatedAt: new Date(),
      };

      console.log('Kaydedilecek hayvan verisi:', hayvanData);

      if (editingHayvan) {
        // Güncelleme
        console.log('Hayvan güncelleniyor:', editingHayvan.id);
        await updateDoc(doc(db, 'hayvanlar', editingHayvan.id), hayvanData);
        Alert.alert('Başarılı', 'Hayvan bilgileri güncellendi!');
      } else {
        // Yeni kayıt
        console.log('Yeni hayvan ekleniyor...');
        const docRef = await addDoc(collection(db, 'hayvanlar'), hayvanData);
        console.log('Hayvan başarıyla eklendi, ID:', docRef.id);
        Alert.alert('Başarılı', 'Yeni hayvan kaydedildi!');
      }

      setModalVisible(false);
      resetForm();
      fetchHayvanlar();
    } catch (error) {
      console.error('Hayvan kaydedilemedi:', error);
      Alert.alert('Hata', 'Hayvan kaydedilirken bir hata oluştu!');
    }
  };

  const handleEdit = (hayvan: Hayvan) => {
    setEditingHayvan(hayvan);
    setKupeNo(hayvan.kupeNo);
    setCins(hayvan.cins);
    setYas(hayvan.yas.toString());
    setAgirlik(hayvan.agirlik.toString());
    setCinsiyet(hayvan.cinsiyet);
    setDogumTarihi(hayvan.dogumTarihi);
    setUretimTipi(hayvan.uretimTipi || 'Süt');
    setSaglikDurumu(hayvan.saglikDurumu);
    setNotlar(hayvan.notlar);
    setModalVisible(true);
  };

  const handleDelete = async (hayvan: Hayvan) => {
    Alert.alert(
      'Hayvanı Sil',
      `${hayvan.kupeNo} numaralı hayvanı silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore(app);
              await deleteDoc(doc(db, 'hayvanlar', hayvan.id));
              Alert.alert('Başarılı', 'Hayvan silindi!');
              fetchHayvanlar();
            } catch (error) {
              console.error('Hayvan silinemedi:', error);
              Alert.alert('Hata', 'Hayvan silinirken bir hata oluştu!');
            }
          }
        }
      ]
    );
  };

  const filteredHayvanlar = hayvanlar.filter((hayvan: any) =>
    hayvan.kupeNo.toLowerCase().includes(searchText.toLowerCase()) ||
    hayvan.cins.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderHayvanItem = ({ item }: { item: any }) => (
    <View style={styles.hayvanCard}>
      <View style={styles.hayvanHeader}>
        <Text style={styles.kupeNo}>🆔 {item.kupeNo}</Text>
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
      
      <View style={styles.hayvanInfo}>
          <Text style={styles.hayvanText}>🐄 <Text style={styles.label}>Cins:</Text> {item.cins}</Text>
          {item.uretimTipi && (
            <Text style={styles.hayvanText}>🥛🍖 <Text style={styles.label}>Tip:</Text> {item.uretimTipi}</Text>
          )}
          <Text style={styles.hayvanText}>📅 <Text style={styles.label}>Yaş:</Text> {item.yas} ay</Text>
          <Text style={styles.hayvanText}>⚖️ <Text style={styles.label}>Ağırlık:</Text> {item.agirlik} kg</Text>
          <Text style={styles.hayvanText}>👤 <Text style={styles.label}>Cinsiyet:</Text> {item.cinsiyet}</Text>
          <Text style={styles.hayvanText}>🏥 <Text style={styles.label}>Sağlık:</Text> {item.saglikDurumu || 'İyi'}</Text>
          {item.notlar && (
            <Text style={styles.hayvanText}>📝 <Text style={styles.label}>Notlar:</Text> {item.notlar}</Text>
          )}
        </View>
    </View>
  );


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🐄 Hayvan Yönetimi</Text>
          <Text style={styles.headerSubtitle}>Toplam: {hayvanlar.length} hayvan</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            console.log('Yeni hayvan ekleme modalı açılıyor...');
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
          <Text style={styles.addButtonText}>Yeni Hayvan</Text>
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Küpe no veya cins ile arama yapın..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999999"
        />
      </View>

      {/* Debug Bilgisi - Geliştirme için */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>Debug: Filtrelenmiş hayvan sayısı: {filteredHayvanlar.length}</Text>
          <Text style={styles.debugText}>Arama metni: &quot;{searchText}&quot;</Text>
        </View>
      )}

      {/* Hayvan Listesi */}
      <FlatList
        data={filteredHayvanlar}
        renderItem={renderHayvanItem}
        keyExtractor={(item: any) => item.id}
        style={styles.hayvanList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="paw" size={64} color="#cccccc" />
            <Text style={styles.emptyText}>
              {searchText ? 'Arama sonucu bulunamadı' : 'Henüz hayvan kaydı yok'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Farklı arama terimleri deneyin' : 'Yeni hayvan eklemek için + butonuna tıklayın'}
            </Text>
          </View>
        }
      />

      {/* Hayvan Ekleme/Düzenleme Modal */}
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
                {editingHayvan ? 'Hayvan Düzenle' : 'Yeni Hayvan Ekle'}
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
                <Text style={styles.inputLabel}>🆔 Küpe Numarası *</Text>
                <TextInput
                  style={styles.input}
                  value={kupeNo}
                  onChangeText={setKupeNo}
                  placeholder="Küpe numarasını girin"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🐄 Cins *</Text>
                <TextInput
                  style={styles.input}
                  value={cins}
                  onChangeText={setCins}
                  placeholder="Örn: İnek, Koyun, Keçi"
                />
              </View>


              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🥛🍖 Üretim Tipi</Text>
                <View style={styles.cinsiyetContainer}>
                  <TouchableOpacity
                    style={[styles.cinsiyetButton, uretimTipi === 'Süt' && styles.cinsiyetButtonActive]}
                    onPress={() => setUretimTipi('Süt')}
                  >
                    <Text style={[styles.cinsiyetButtonText, uretimTipi === 'Süt' && styles.cinsiyetButtonTextActive]}>Süt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cinsiyetButton, uretimTipi === 'Et' && styles.cinsiyetButtonActive]}
                    onPress={() => setUretimTipi('Et')}
                  >
                    <Text style={[styles.cinsiyetButtonText, uretimTipi === 'Et' && styles.cinsiyetButtonTextActive]}>Et</Text>
                  </TouchableOpacity>
                </View>
              </View>



              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>📅 Yaş (ay)</Text>
                  <TextInput
                    style={styles.input}
                    value={yas}
                    onChangeText={setYas}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>⚖️ Ağırlık (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={agirlik}
                    onChangeText={setAgirlik}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>👤 Cinsiyet</Text>
                <View style={styles.cinsiyetContainer}>
                  <TouchableOpacity
                    style={[
                      styles.cinsiyetButton,
                      cinsiyet === 'Erkek' && styles.cinsiyetButtonActive
                    ]}
                    onPress={() => setCinsiyet('Erkek')}
                  >
                    <Text style={[
                      styles.cinsiyetButtonText,
                      cinsiyet === 'Erkek' && styles.cinsiyetButtonTextActive
                    ]}>Erkek</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cinsiyetButton,
                      cinsiyet === 'Dişi' && styles.cinsiyetButtonActive
                    ]}
                    onPress={() => setCinsiyet('Dişi')}
                  >
                    <Text style={[
                      styles.cinsiyetButtonText,
                      cinsiyet === 'Dişi' && styles.cinsiyetButtonTextActive
                    ]}>Dişi</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🏥 Sağlık Durumu</Text>
                <View style={styles.saglikContainer}>
                  <TouchableOpacity
                    style={[
                      styles.saglikButton,
                      saglikDurumu === 'Sağlıklı' && styles.saglikButtonActive
                    ]}
                    onPress={() => setSaglikDurumu('Sağlıklı')}
                  >
                    <Text style={[
                      styles.saglikButtonText,
                      saglikDurumu === 'Sağlıklı' && styles.saglikButtonTextActive
                    ]}>✅ Sağlıklı</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saglikButton,
                      saglikDurumu === 'Hasta' && styles.saglikButtonActive
                    ]}
                    onPress={() => setSaglikDurumu('Hasta')}
                  >
                    <Text style={[
                      styles.saglikButtonText,
                      saglikDurumu === 'Hasta' && styles.saglikButtonTextActive
                    ]}>🏥 Hasta</Text>
                  </TouchableOpacity>
                </View>
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
                  {editingHayvan ? 'Güncelle' : 'Kaydet'}
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
  hayvanList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  hayvanCard: {
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
  hayvanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kupeNo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
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
  hayvanInfo: {
    gap: 6,
  },
  hayvanText: {
    fontSize: 14,
    color: '#333333',
  },
  label: {
    fontWeight: '600',
    color: '#666666',
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
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
  cinsiyetContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cinsiyetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  cinsiyetButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  cinsiyetButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  cinsiyetButtonTextActive: {
    color: '#ffffff',
  },
  saglikContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  saglikButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  saglikButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  saglikButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  saglikButtonTextActive: {
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
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
