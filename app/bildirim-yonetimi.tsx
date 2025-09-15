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
  FlatList 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  where 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'normal';
  isActive: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'all' | 'admin' | 'normal';
  targetUsers: string[];
  timestamp: any;
  status: 'sent' | 'read';
  from: string;
}

export default function BildirimYonetimi() {
  const router = useRouter();
  
  // State'ler
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state'leri
  const [showSendModal, setShowSendModal] = useState(false);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  
  // Form state'leri
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'all' | 'admin' | 'normal'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
    loadNotifications();
  }, []);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setAllUsers(users);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const notificationsSnapshot = await getDocs(
        query(collection(db, 'notifications'), orderBy('timestamp', 'desc'))
      );
      const notificationsList = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    }
  };

  const sendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert('Hata', 'Başlık ve mesaj alanları boş olamaz!');
      return;
    }

    setLoading(true);
    try {
      const targetUsers = notificationType === 'all' 
        ? allUsers.map(u => u.id) 
        : notificationType === 'admin' 
          ? allUsers.filter(u => u.role === 'admin').map(u => u.id)
          : selectedUsers;

      const notificationData = {
        title: notificationTitle.trim(),
        message: notificationMessage.trim(),
        type: notificationType,
        targetUsers: targetUsers,
        timestamp: new Date(),
        status: 'sent',
        from: 'admin'
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      
      Alert.alert('Başarılı', 'Bildirim başarıyla gönderildi!');
      setNotificationTitle('');
      setNotificationMessage('');
      setSelectedUsers([]);
      setShowSendModal(false);
      loadNotifications();
    } catch (error) {
      console.error('Bildirim gönderilirken hata:', error);
      Alert.alert('Hata', 'Bildirim gönderilirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'notifications', notificationId));
              Alert.alert('Başarılı', 'Bildirim silindi!');
              loadNotifications();
            } catch (error) {
              console.error('Bildirim silinirken hata:', error);
              Alert.alert('Hata', 'Bildirim silinirken bir hata oluştu!');
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

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'all': return 'Tüm Kullanıcılar';
      case 'admin': return 'Sadece Adminler';
      case 'normal': return 'Seçili Kullanıcılar';
      default: return type;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'all': return '#3498db';
      case 'admin': return '#e74c3c';
      case 'normal': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <View style={[
            styles.typeBadge, 
            { backgroundColor: getNotificationTypeColor(item.type) }
          ]}>
            <Text style={styles.typeBadgeText}>
              {getNotificationTypeText(item.type)}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <Ionicons name="trash" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.notificationMessage}>{item.message}</Text>
      
      <View style={styles.notificationFooter}>
        <Text style={styles.notificationDate}>
          {item.timestamp?.toDate().toLocaleDateString('tr-TR')} - {item.timestamp?.toDate().toLocaleTimeString('tr-TR')}
        </Text>
        <Text style={styles.targetCount}>
          {item.targetUsers.length} kullanıcıya gönderildi
        </Text>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>🔔 Bildirim Yönetimi</Text>
          <Text style={styles.headerSubtitle}>Kullanıcılara bildirim gönder</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowSendModal(true)}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* İstatistik Kartları */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{notifications.length}</Text>
          <Text style={styles.statLabel}>Toplam Bildirim</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{allUsers.length}</Text>
          <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {notifications.filter(n => n.type === 'all').length}
          </Text>
          <Text style={styles.statLabel}>Genel Bildirim</Text>
        </View>
      </View>

      {/* Bildirim Listesi */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>Henüz bildirim yok</Text>
            <Text style={styles.emptySubtext}>Yeni bildirim göndermek için + butonuna tıklayın</Text>
          </View>
        }
      />

      {/* Bildirim Gönderme Modalı */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📤 Yeni Bildirim Gönder</Text>
              <TouchableOpacity 
                onPress={() => setShowSendModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📝 Başlık *</Text>
                <TextInput
                  style={styles.textInput}
                  value={notificationTitle}
                  onChangeText={setNotificationTitle}
                  placeholder="Bildirim başlığını girin..."
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>💬 Mesaj *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={notificationMessage}
                  onChangeText={setNotificationMessage}
                  placeholder="Bildirim mesajını girin..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🎯 Hedef Kitle</Text>
                <View style={styles.typeSelector}>
                  {[
                    { key: 'all', label: 'Tüm Kullanıcılar', icon: 'people' },
                    { key: 'admin', label: 'Sadece Adminler', icon: 'shield' },
                    { key: 'normal', label: 'Seçili Kullanıcılar', icon: 'person' }
                  ].map(type => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeOption,
                        notificationType === type.key && styles.typeOptionActive
                      ]}
                      onPress={() => setNotificationType(type.key as any)}
                    >
                      <Ionicons 
                        name={type.icon as any} 
                        size={20} 
                        color={notificationType === type.key ? '#ffffff' : '#666'} 
                      />
                      <Text style={[
                        styles.typeOptionText,
                        notificationType === type.key && styles.typeOptionTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {notificationType === 'normal' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>👥 Kullanıcı Seç</Text>
                  <ScrollView style={styles.usersList} nestedScrollEnabled>
                    {allUsers.map(user => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.userOption,
                          selectedUsers.includes(user.id) && styles.userOptionSelected
                        ]}
                        onPress={() => toggleUserSelection(user.id)}
                      >
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{user.name}</Text>
                          <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        {selectedUsers.includes(user.id) && (
                          <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSendModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]}
                onPress={sendNotification}
                disabled={loading}
              >
                <Ionicons name="send" size={16} color="#ffffff" />
                <Text style={styles.sendButtonText}>
                  {loading ? 'Gönderiliyor...' : 'Gönder'}
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
    backgroundColor: '#3498db',
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
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
    color: '#3498db',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationCard: {
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
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  deleteButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  targetCount: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    color: '#3498db',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
    padding: 20,
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  typeOptionActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: '#ffffff',
  },
  usersList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  sendButton: {
    backgroundColor: '#3498db',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});

