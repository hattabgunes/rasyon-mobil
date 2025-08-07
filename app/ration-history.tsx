import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useNavigation } from 'expo-router';

function formatDate(ts: any) {
  if (!ts) return '-';
  if (typeof ts === 'string') return ts;
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
  return '-';
}

export default function RationHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Rasyon Kayıtlarım' });
  }, [navigation]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) {
        console.log('Kullanıcı giriş yapmamış');
        setHistory([]);
        setLoading(false);
        return;
      }
      
      const db = getFirestore(app);
      const q = query(
        collection(db, 'history'), 
        where('userId', '==', user.uid), 
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      console.log('Çekilen rasyon sayısı:', list.length);
      console.log('Kullanıcı ID:', user.uid);
      setHistory(list);
    } catch (e: any) {
      console.error('Rasyon geçmişi çekme hatası:', e);
      setHistory([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Rasyon Kayıtlarım</Text>
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={fetchHistory}
        disabled={loading}
      >
        <Text style={styles.refreshButtonText}>
          {loading ? 'Yükleniyor...' : '🔄 Yenile'}
        </Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color="#4F8EF7" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.type}>{item.type === 'yemli' ? '🍽️ Yemli Hesaplama' : '✨ Otomatik Hesaplama'}</Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              <Text style={styles.info}>Tür: {item.animalType === 'buyukbas' ? 'Büyükbaş' : 'Küçükbaş'}</Text>
              <Text style={styles.info}>Ağırlık: {item.weight} kg</Text>
              {item.age && <Text style={styles.info}>Yaş: {item.age} ay</Text>}
              {item.milk && parseFloat(item.milk) > 0 && <Text style={styles.info}>Süt: {item.milk} kg/gün</Text>}
              {item.pregMonth && parseInt(item.pregMonth) > 0 && <Text style={styles.info}>Gebelik Ayı: {item.pregMonth}</Text>}
              {item.feeds && item.feeds.length > 0 && (
                <Text style={styles.info}>Yemler: {item.feeds.map((f: any) => `${f.feed}: ${f.amount} kg`).join(', ')}</Text>
              )}
              {item.result && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.historyTitle}>Rasyon Sonucu:</Text>
                  {item.result.ihtiyac && (
                    <>
                      <Text style={styles.historyDetail}>KM: {item.result.ihtiyac.KM} kg</Text>
                      <Text style={styles.historyDetail}>HP: {item.result.ihtiyac.HP} g</Text>
                      <Text style={styles.historyDetail}>NE: {item.result.ihtiyac.NE} Mcal</Text>
                      {item.result.ihtiyac.Ca && <Text style={styles.historyDetail}>Ca: {item.result.ihtiyac.Ca} g</Text>}
                      {item.result.ihtiyac.P && <Text style={styles.historyDetail}>P: {item.result.ihtiyac.P} g</Text>}
                    </>
                  )}
                  {item.result.toplam && (
                    <>
                      <Text style={styles.historySubtitle}>Toplam Besin Değerleri:</Text>
                      <Text style={styles.historyDetail}>KM: {item.result.toplam.KM} kg</Text>
                      <Text style={styles.historyDetail}>HP: {item.result.toplam.HP} g</Text>
                      <Text style={styles.historyDetail}>NE: {item.result.toplam.NE} Mcal</Text>
                    </>
                  )}
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={{ marginTop: 30, color: '#888' }}>Henüz rasyon hesabı yapılmadı.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#181A20', padding: 16 },
  mainTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 18, color: '#4F8EF7', textAlign: 'center' },
  card: { backgroundColor: '#23263a', borderRadius: 16, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#4F8EF7' },
  type: { fontSize: 18, fontWeight: 'bold', color: '#4F8EF7', marginBottom: 4 },
  date: { fontSize: 14, color: '#bbb', marginBottom: 6 },
  info: { fontSize: 15, color: '#fff', marginBottom: 2 },
  historyTitle: { fontSize: 17, fontWeight: 'bold', color: '#4F8EF7', marginTop: 8 },
  historySubtitle: { fontSize: 15, fontWeight: 'bold', color: '#4F8EF7', marginTop: 6 },
  historyDetail: { fontSize: 14, color: '#fff', marginBottom: 2 },
  refreshButton: {
    backgroundColor: '#4F8EF7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});