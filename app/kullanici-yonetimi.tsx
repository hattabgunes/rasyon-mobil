import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Modal, 
  Alert, 
  Image,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  addDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  role: 'admin' | 'normal';
  createdAt: any;
  lastLogin?: any;
  profileImage?: string;
  totalAnimals?: number;
  totalRations?: number;
  lastActivity?: any;
}

export default function KullaniciYonetimi() {
  const router = useRouter();
  
  // State'ler
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  
  // Modal state'leri
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Yeni kullanıcı form state'leri
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'normal' | 'admin'>('normal');
  
  // İstatistik state'leri
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    averageAnimalsPerUser: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchText, selectedFilter, sortBy, sortOrder]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      // Her kullanıcı için hayvan ve rasyon sayılarını yükle
      const usersWithStats = await Promise.all(
        usersList.map(async (user) => {
          try {
            // Hayvan sayısını al
            const hayvanlarSnapshot = await getDocs(
              query(collection(db, 'hayvanlar'), where('userId', '==', user.id))
            );
            
            // Rasyon sayısını al
            const rasyonlarSnapshot = await getDocs(
              query(collection(db, 'rasyonlar'), where('userId', '==', user.id))
            );
            
            return {
              ...user,
              totalAnimals: hayvanlarSnapshot.size,
              totalRations: rasyonlarSnapshot.size
            };
          } catch (error) {
            console.error(`Kullanıcı ${user.id} istatistikleri yüklenirken hata:`, error);
            return {
              ...user,
              totalAnimals: 0,
              totalRations: 0
            };
          }
        })
      );
      
      setUsers(usersWithStats);
      calculateStats(usersWithStats);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      Alert.alert('Hata', 'Kullanıcılar yüklenirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersList: User[]) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    setStats({
      totalUsers: usersList.length,
      activeUsers: usersList.filter(u => u.isActive).length,
      newUsersThisMonth: usersList.filter(u => 
        u.createdAt && u.createdAt.toDate() >= thisMonth
      ).length,
      averageAnimalsPerUser: usersList.length > 0 
        ? usersList.reduce((sum, u) => sum + (u.totalAnimals || 0), 0) / usersList.length 
        : 0
    });
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Arama filtresi
    if (searchText.trim()) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Kategori filtresi
    switch (selectedFilter) {
      case 'active':
        filtered = filtered.filter(user => user.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(user => !user.isActive);
        break;
      case 'admin':
        filtered = filtered.filter(user => user.role === 'admin');
        break;
    }

    // Sıralama
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt?.toDate() || new Date(0);
          bValue = b.createdAt?.toDate() || new Date(0);
          break;
        case 'lastLogin':
          aValue = a.lastLogin?.toDate() || new Date(0);
          bValue = b.lastLogin?.toDate() || new Date(0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !isActive,
        updatedAt: new Date()
      });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive: !isActive } : user
      ));
      
      Alert.alert('Başarılı', `Kullanıcı ${!isActive ? 'aktif' : 'pasif'} yapıldı!`);
    } catch (error) {
      console.error('Kullanıcı durumu güncellenirken hata:', error);
      Alert.alert('Hata', 'Kullanıcı durumu güncellenirken bir hata oluştu!');
    }
  };

  const changeUserRole = async (userId: string, newRole: 'admin' | 'normal') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date()
      });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      Alert.alert('Başarılı', 'Kullanıcı rolü güncellendi!');
    } catch (error) {
      console.error('Kullanıcı rolü güncellenirken hata:', error);
      Alert.alert('Hata', 'Kullanıcı rolü güncellenirken bir hata oluştu!');
    }
  };

  const deleteUser = async (userId: string) => {
    Alert.alert(
      'Kullanıcıyı Sil',
      'Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', userId));
              setUsers(users.filter(user => user.id !== userId));
              Alert.alert('Başarılı', 'Kullanıcı silindi!');
            } catch (error) {
              console.error('Kullanıcı silinirken hata:', error);
              Alert.alert('Hata', 'Kullanıcı silinirken bir hata oluştu!');
            }
          }
        }
      ]
    );
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const bulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir kullanıcı seçin!');
      return;
    }

    Alert.alert(
      'Toplu İşlem',
      `Seçili ${selectedUsers.length} kullanıcıya "${action}" işlemi uygulanacak. Devam etmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Uygula',
          onPress: () => {
            // Toplu işlemleri burada uygula
            Alert.alert('Başarılı', `${action} işlemi uygulandı!`);
            setSelectedUsers([]);
            setShowBulkActions(false);
          }
        }
      ]
    );
  };

  const addNewUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      Alert.alert('Hata', 'İsim ve e-posta alanları zorunludur!');
      return;
    }

    try {
      const newUser = {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        phone: newUserPhone.trim(),
        role: newUserRole,
        isActive: true,
        createdAt: new Date(),
        totalAnimals: 0,
        totalRations: 0
      };

      await addDoc(collection(db, 'users'), newUser);
      
      Alert.alert('Başarılı', 'Yeni kullanıcı eklendi!');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserRole('normal');
      setShowAddUser(false);
      loadUsers();
    } catch (error) {
      console.error('Kullanıcı eklenirken hata:', error);
      Alert.alert('Hata', 'Kullanıcı eklenirken bir hata oluştu!');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedUsers.includes(item.id) && styles.selectedUserItem
      ]}
      onPress={() => {
        setSelectedUser(item);
        setShowUserDetail(true);
      }}
      onLongPress={() => toggleUserSelection(item.id)}
    >
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color="#666" />
          )}
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name || 'İsimsiz'}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userBadges}>
            {item.role === 'admin' && (
              <View style={[styles.badge, styles.adminBadge]}>
                <Text style={styles.badgeText}>Admin</Text>
              </View>
            )}
            {!item.isActive && (
              <View style={[styles.badge, styles.inactiveBadge]}>
                <Text style={styles.badgeText}>Pasif</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.userActions}>
        <Switch
          value={item.isActive}
          onValueChange={() => toggleUserStatus(item.id, item.isActive)}
          trackColor={{ false: '#767577', true: '#4CAF50' }}
          thumbColor={item.isActive ? '#ffffff' : '#f4f3f4'}
        />
      </View>
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
          <Text style={styles.headerTitle}>👥 Kullanıcı Yönetimi</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowAddUser(true)} style={styles.addButton}>
              <Ionicons name="add" size={24} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowStats(true)} style={styles.statsButton}>
              <Ionicons name="analytics" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>

        {/* İstatistik Kartları */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Aktif Kullanıcı</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.newUsersThisMonth}</Text>
            <Text style={styles.statLabel}>Bu Ay Yeni</Text>
          </View>
        </ScrollView>

        {/* Arama ve Filtreler */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Kullanıcı ara..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowBulkActions(true)}
          >
            <Ionicons name="options" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        {/* Filtre ve Sıralama Butonları */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'active', label: 'Aktif' },
            { key: 'inactive', label: 'Pasif' },
            { key: 'admin', label: 'Admin' }
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.activeFilterButton
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.activeFilterButtonText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sıralama Butonları */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
          {[
            { key: 'name', label: 'İsim' },
            { key: 'email', label: 'E-posta' },
            { key: 'createdAt', label: 'Kayıt Tarihi' },
            { key: 'lastLogin', label: 'Son Giriş' }
          ].map(sort => (
            <TouchableOpacity
              key={sort.key}
              style={[
                styles.sortButton,
                sortBy === sort.key && styles.activeSortButton
              ]}
              onPress={() => {
                if (sortBy === sort.key) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(sort.key);
                  setSortOrder('desc');
                }
              }}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === sort.key && styles.activeSortButtonText
              ]}>
                {sort.label} {sortBy === sort.key && (sortOrder === 'asc' ? '↑' : '↓')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Kullanıcı Listesi */}
        <View style={styles.userListContainer}>
          {filteredUsers.map((item) => (
            <View key={item.id}>
              {renderUserItem({ item })}
            </View>
          ))}
          
          {filteredUsers.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
            </View>
          )}
        </View>
      </View>

      {/* Kullanıcı Detay Modalı */}
      <Modal
        visible={showUserDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Kullanıcı Detayları</Text>
                  <TouchableOpacity 
                    onPress={() => setShowUserDetail(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.userDetailContainer}>
                    <View style={styles.userDetailAvatar}>
                      {selectedUser.profileImage ? (
                        <Image source={{ uri: selectedUser.profileImage }} style={styles.detailAvatarImage} />
                      ) : (
                        <Ionicons name="person" size={48} color="#666" />
                      )}
                    </View>
                    
                    <Text style={styles.detailUserName}>{selectedUser.name || 'İsimsiz'}</Text>
                    <Text style={styles.detailUserEmail}>{selectedUser.email}</Text>
                    
                    <View style={styles.detailInfo}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Rol:</Text>
                        <View style={styles.roleSelector}>
                          {['normal', 'admin'].map(role => (
                            <TouchableOpacity
                              key={role}
                              style={[
                                styles.roleButton,
                                selectedUser.role === role && styles.selectedRoleButton
                              ]}
                              onPress={() => changeUserRole(selectedUser.id, role as any)}
                            >
                              <Text style={[
                                styles.roleButtonText,
                                selectedUser.role === role && styles.selectedRoleButtonText
                              ]}>
                                {role === 'normal' ? 'Normal' : 'Admin'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Durum:</Text>
                        <Switch
                          value={selectedUser.isActive}
                          onValueChange={() => toggleUserStatus(selectedUser.id, selectedUser.isActive)}
                        />
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Kayıt Tarihi:</Text>
                        <Text style={styles.detailValue}>
                          {selectedUser.createdAt?.toDate().toLocaleDateString('tr-TR') || 'Bilinmiyor'}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Son Giriş:</Text>
                        <Text style={styles.detailValue}>
                          {selectedUser.lastLogin?.toDate().toLocaleDateString('tr-TR') || 'Hiç giriş yapmamış'}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Toplam Hayvan:</Text>
                        <Text style={styles.detailValue}>{selectedUser.totalAnimals || 0}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Toplam Rasyon:</Text>
                        <Text style={styles.detailValue}>{selectedUser.totalRations || 0}</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => deleteUser(selectedUser.id)}
                  >
                    <Ionicons name="trash" size={16} color="#ffffff" />
                    <Text style={styles.deleteButtonText}>Kullanıcıyı Sil</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Toplu İşlemler Modalı */}
      <Modal
        visible={showBulkActions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBulkActions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Toplu İşlemler</Text>
              <TouchableOpacity 
                onPress={() => setShowBulkActions(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bulkActionsContainer}>
              <Text style={styles.bulkActionsInfo}>
                {selectedUsers.length} kullanıcı seçildi
              </Text>
              
              <TouchableOpacity 
                style={styles.bulkActionButton}
                onPress={() => bulkAction('Admin Yap')}
              >
                <Ionicons name="shield" size={20} color="#e74c3c" />
                <Text style={styles.bulkActionText}>Admin Yap</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bulkActionButton}
                onPress={() => bulkAction('Normal Yap')}
              >
                <Ionicons name="person" size={20} color="#666" />
                <Text style={styles.bulkActionText}>Normal Yap</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bulkActionButton}
                onPress={() => bulkAction('Aktif Yap')}
              >
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.bulkActionText}>Aktif Yap</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bulkActionButton}
                onPress={() => bulkAction('Pasif Yap')}
              >
                <Ionicons name="close-circle" size={20} color="#e74c3c" />
                <Text style={styles.bulkActionText}>Pasif Yap</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bulkActionButton}
                onPress={() => bulkAction('Bildirim Gönder')}
              >
                <Ionicons name="notifications" size={20} color="#2196F3" />
                <Text style={styles.bulkActionText}>Bildirim Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* İstatistikler Modalı */}
      <Modal
        visible={showStats}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Kullanıcı İstatistikleri</Text>
              <TouchableOpacity 
                onPress={() => setShowStats(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.statsModalBody}>
              <View style={styles.statsGrid}>
                <View style={styles.statsItem}>
                  <Text style={styles.statsItemNumber}>{stats.totalUsers}</Text>
                  <Text style={styles.statsItemLabel}>Toplam Kullanıcı</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsItemNumber}>{stats.activeUsers}</Text>
                  <Text style={styles.statsItemLabel}>Aktif Kullanıcı</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsItemNumber}>{stats.newUsersThisMonth}</Text>
                  <Text style={styles.statsItemLabel}>Bu Ay Yeni</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsItemNumber}>{stats.averageAnimalsPerUser.toFixed(1)}</Text>
                  <Text style={styles.statsItemLabel}>Ortalama Hayvan</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsItemNumber}>
                    {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                  </Text>
                  <Text style={styles.statsItemLabel}>Aktif Oranı</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Kullanıcı Ekleme Modalı */}
      <Modal
        visible={showAddUser}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddUser(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ Yeni Kullanıcı Ekle</Text>
              <TouchableOpacity 
                onPress={() => setShowAddUser(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>İsim *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUserName}
                  onChangeText={setNewUserName}
                  placeholder="Kullanıcı adını girin..."
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-posta *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUserEmail}
                  onChangeText={setNewUserEmail}
                  placeholder="E-posta adresini girin..."
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefon</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUserPhone}
                  onChangeText={setNewUserPhone}
                  placeholder="Telefon numarasını girin..."
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rol</Text>
                <View style={styles.roleSelector}>
                  {[
                    { key: 'normal', label: 'Normal Kullanıcı' },
                    { key: 'admin', label: 'Admin' }
                  ].map(role => (
                    <TouchableOpacity
                      key={role.key}
                      style={[
                        styles.roleButton,
                        newUserRole === role.key && styles.selectedRoleButton
                      ]}
                      onPress={() => setNewUserRole(role.key as any)}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        newUserRole === role.key && styles.selectedRoleButtonText
                      ]}>
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddUser(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addUserButton]}
                onPress={addNewUser}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.addUserButtonText}>Kullanıcı Ekle</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: 8,
    marginRight: 8,
  },
  statsButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  activeFilterButton: {
    backgroundColor: '#e74c3c',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  sortContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeSortButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#ffffff',
  },
  userListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedUserItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
  },
  adminBadge: {
    backgroundColor: '#e74c3c',
  },
  inactiveBadge: {
    backgroundColor: '#999',
  },
  userActions: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
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
    maxHeight: '90%',
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
    maxHeight: 400,
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  addUserButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addUserButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  userDetailContainer: {
    alignItems: 'center',
  },
  userDetailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  detailUserName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailUserEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  detailInfo: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  roleSelector: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedRoleButton: {
    backgroundColor: '#e74c3c',
  },
  roleButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedRoleButtonText: {
    color: '#ffffff',
  },
  bulkActionsContainer: {
    padding: 20,
  },
  bulkActionsInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  bulkActionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  statsModalBody: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statsItemNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  statsItemLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
