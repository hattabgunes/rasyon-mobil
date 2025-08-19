import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal, Dimensions } from 'react-native';
import { useLayoutEffect } from 'react';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Bilimsel rasyon ihtiyacı fonksiyonları
function hesaplaBuyukbasRasyon(canliAgirlik: number, sutKg: number, gebelikAyi: number = 0) {
  const KM = +(canliAgirlik * 0.035).toFixed(2);
  const HP = +(364 + 90 * sutKg).toFixed(2);
  const NE = +(8.46 + 0.74 * sutKg).toFixed(2);
  const Ca = +(20 + 3.21 * sutKg).toFixed(2);
  const P = +(14 + 1.98 * sutKg).toFixed(2);
  let ekstraYem = 0;
  if (gebelikAyi === 7) ekstraYem = 1;
  else if (gebelikAyi === 8) ekstraYem = 1.5;
  else if (gebelikAyi === 9) ekstraYem = 2.5;
  return {
    tur: "Büyükbaş",
    ihtiyac: { KM, HP, NE, Ca, P },
    gebelikEkstraYem: ekstraYem
  };
}
function hesaplaKucukbasRasyon(canliAgirlik: number, sutKg: number, gebelikAyi: number = 0) {
  const KM = +(canliAgirlik * 0.045).toFixed(2);
  const HP = +(250 + 80 * sutKg).toFixed(2);
  const NE = +(6.5 + 0.65 * sutKg).toFixed(2);
  const Ca = +(15 + 2.5 * sutKg).toFixed(2);
  const P = +(10 + 1.6 * sutKg).toFixed(2);
  let ekstraYem = 0;
  if (gebelikAyi === 3) ekstraYem = 0.5;
  else if (gebelikAyi === 4) ekstraYem = 0.8;
  else if (gebelikAyi === 5) ekstraYem = 1.2;
  return {
    tur: "Küçükbaş",
    ihtiyac: { KM, HP, NE, Ca, P },
    gebelikEkstraYem: ekstraYem
  };
}
function hesaplaRasyon(hayvanTuru: string, agirlik: number, sut: number, gebelikAyi: number) {
  if (hayvanTuru === "buyukbas") {
    return hesaplaBuyukbasRasyon(agirlik, sut, gebelikAyi);
  } else if (hayvanTuru === "kucukbas") {
    return hesaplaKucukbasRasyon(agirlik, sut, gebelikAyi);
  } else {
    return { hata: "Geçersiz hayvan türü" };
  }
}

// Yem besin değerleri tablosu (1 kg için)
const feedOptions = [
  { label: 'Saman', value: 'saman', emoji: '🌾', KM: 0.85, HP: 25, NE: 1.2, Ca: 3, P: 1.5 },
  { label: 'Arpa', value: 'arpa', emoji: '🌱', KM: 0.87, HP: 110, NE: 2.0, Ca: 0.6, P: 3.5 },
  { label: 'Mısır Silajı', value: 'misir_silaji', emoji: '🌽', KM: 0.30, HP: 30, NE: 1.6, Ca: 1.0, P: 1.0 },
  { label: 'Yonca', value: 'yonca', emoji: '🍀', KM: 0.85, HP: 180, NE: 1.2, Ca: 15, P: 2.5 },
  { label: 'Buğday', value: 'bugday', emoji: '🌾', KM: 0.88, HP: 120, NE: 2.1, Ca: 0.5, P: 3.8 },
  { label: 'Pamuk Tohumu Küspesi', value: 'pamuk', emoji: '🧈', KM: 0.90, HP: 230, NE: 1.5, Ca: 1.5, P: 6.0 },
  { label: 'Ayçiçek Küspesi', value: 'aycicek', emoji: '🌻', KM: 0.90, HP: 320, NE: 1.4, Ca: 1.2, P: 6.5 },
  { label: 'Mısır', value: 'misir', emoji: '🌽', KM: 0.87, HP: 90, NE: 2.2, Ca: 0.3, P: 2.8 },
];

function eksikYemOner(eksikFazla: { KM: number; HP: number; NE: number; Ca: number; P: number }, feedOptions: any[]) {
  // Sadece eksik olanlar için öneri yap
  const oneriler = [];
  // Öncelik: KM için silaj, HP için yonca, NE için arpa, Ca için yonca, P için arpa
  if (eksikFazla.KM < -0.1) {
    const silaj = feedOptions.find(f => f.value === 'misir_silaji');
    if (silaj) {
      const ekSilaj = Math.abs(eksikFazla.KM) / silaj.KM;
      oneriler.push(`🌽 Mısır Silajı: +${ekSilaj.toFixed(2)} kg ekleyin`);
    }
  }
  if (eksikFazla.HP < -1) {
    const yonca = feedOptions.find(f => f.value === 'yonca');
    if (yonca) {
      const ekYonca = Math.abs(eksikFazla.HP) / yonca.HP;
      oneriler.push(`🍀 Yonca: +${ekYonca.toFixed(2)} kg ekleyin`);
    }
  }
  if (eksikFazla.NE < -0.1) {
    const arpa = feedOptions.find(f => f.value === 'arpa');
    if (arpa) {
      const ekArpa = Math.abs(eksikFazla.NE) / arpa.NE;
      oneriler.push(`🌱 Arpa: +${ekArpa.toFixed(2)} kg ekleyin`);
    }
  }
  if (eksikFazla.Ca < -0.1) {
    const yonca = feedOptions.find(f => f.value === 'yonca');
    if (yonca) {
      const ekYonca = Math.abs(eksikFazla.Ca) / yonca.Ca;
      oneriler.push(`🍀 Yonca: +${ekYonca.toFixed(2)} kg ekleyin`);
    }
  }
  if (eksikFazla.P < -0.1) {
    const arpa = feedOptions.find(f => f.value === 'arpa');
    if (arpa) {
      const ekArpa = Math.abs(eksikFazla.P) / arpa.P;
      oneriler.push(`🌱 Arpa: +${ekArpa.toFixed(2)} kg ekleyin`);
    }
  }
  return oneriler;
}

const buyukbasAltTurler: { label: string; value: string }[] = [
  { label: 'Buzağı', value: 'buzagi' },
  { label: 'Düve', value: 'duve' },
  { label: 'Besi Danası', value: 'besi' },
  { label: 'Süt İneği', value: 'sutinegi' },
];
const kucukbasAltTurler: { label: string; value: string }[] = [
  { label: 'Kuzu', value: 'kuzu' },
  { label: 'Oğlak', value: 'oglak' },
  { label: 'Yetişkin Koyun', value: 'koyun' },
  { label: 'Yetişkin Keçi', value: 'keci' },
];
// Bilimsel Büyükbaş Rasyon Hesaplama
function hesaplaBuyukbasRasyonDetayli(altTur: string, yas: number, canliAgirlik: number, sutKg: number = 0, gebelikAyi: number = 0) {
  let KM, HP, NE, Ca, P;
  
  if (altTur === 'buzagi') {
    // 0-6 ay buzağı
    KM = +(canliAgirlik * 0.025).toFixed(2); // Canlı ağırlığın %2.5'i
    HP = +(canliAgirlik * 0.18).toFixed(2); // Canlı ağırlığın %18'i (g/kg)
    NE = +(canliAgirlik * 0.08).toFixed(2); // Canlı ağırlığın 0.08 Mcal/kg'sı
    Ca = +(canliAgirlik * 0.008).toFixed(2); // Canlı ağırlığın %0.8'i (g/kg)
    P = +(canliAgirlik * 0.005).toFixed(2); // Canlı ağırlığın %0.5'i (g/kg)
  } else if (altTur === 'dana') {
    // 6-15 ay dana
    KM = +(canliAgirlik * 0.03).toFixed(2); // Canlı ağırlığın %3'ü
    HP = +(canliAgirlik * 0.15).toFixed(2); // Canlı ağırlığın %15'i (g/kg)
    NE = +(canliAgirlik * 0.1).toFixed(2); // Canlı ağırlığın 0.1 Mcal/kg'sı
    Ca = +(canliAgirlik * 0.006).toFixed(2); // Canlı ağırlığın %0.6'sı (g/kg)
    P = +(canliAgirlik * 0.004).toFixed(2); // Canlı ağırlığın %0.4'ü (g/kg)
  } else if (altTur === 'okuz') {
    // 15+ ay öküz
    KM = +(canliAgirlik * 0.025).toFixed(2); // Canlı ağırlığın %2.5'i
    HP = +(canliAgirlik * 0.12).toFixed(2); // Canlı ağırlığın %12'si (g/kg)
    NE = +(canliAgirlik * 0.08).toFixed(2); // Canlı ağırlığın 0.08 Mcal/kg'sı
    Ca = +(canliAgirlik * 0.005).toFixed(2); // Canlı ağırlığın %0.5'i (g/kg)
    P = +(canliAgirlik * 0.003).toFixed(2); // Canlı ağırlığın %0.3'ü (g/kg)
  } else if (altTur === 'sutinegi') {
    // Süt inekleri
    KM = +(canliAgirlik * 0.035).toFixed(2); // Canlı ağırlığın %3.5'i
    HP = +(canliAgirlik * 0.12 + sutKg * 85).toFixed(2); // Bakım + süt üretimi
    NE = +(canliAgirlik * 0.08 + sutKg * 0.7).toFixed(2); // Bakım + süt üretimi
    Ca = +(canliAgirlik * 0.005 + sutKg * 3.2).toFixed(2); // Bakım + süt üretimi
    P = +(canliAgirlik * 0.003 + sutKg * 2.0).toFixed(2); // Bakım + süt üretimi
    
    // Gebelik ekstra ihtiyacı
    if (gebelikAyi >= 7) {
      const gebelikFaktoru = gebelikAyi === 7 ? 0.15 : gebelikAyi === 8 ? 0.25 : 0.35;
      HP += +(HP * gebelikFaktoru).toFixed(2);
      NE += +(NE * gebelikFaktoru).toFixed(2);
      Ca += +(Ca * gebelikFaktoru).toFixed(2);
      P += +(P * gebelikFaktoru).toFixed(2);
    }
  } else {
    // Besi danası
    KM = +(canliAgirlik * 0.03).toFixed(2);
    HP = +(canliAgirlik * 0.14).toFixed(2);
    NE = +(canliAgirlik * 0.09).toFixed(2);
    Ca = +(canliAgirlik * 0.006).toFixed(2);
    P = +(canliAgirlik * 0.004).toFixed(2);
  }
  
  return {
    tur: altTur,
    yas: yas,
    ihtiyac: { KM, HP, NE, Ca, P },
    canliAgirlik: canliAgirlik
  };
}

// Bilimsel Küçükbaş Rasyon Hesaplama
function hesaplaKucukbasRasyonDetayli(altTur: string, yas: number, canliAgirlik: number, sutKg: number = 0) {
  let KM, HP, NE, Ca, P;
  
  if (altTur === 'kuzu') {
    // 0-6 ay kuzu
    KM = +(canliAgirlik * 0.035).toFixed(2); // Canlı ağırlığın %3.5'i
    HP = +(canliAgirlik * 0.16).toFixed(2); // Canlı ağırlığın %16'sı (g/kg)
    NE = +(canliAgirlik * 0.07).toFixed(2); // Canlı ağırlığın 0.07 Mcal/kg'sı
    Ca = +(canliAgirlik * 0.007).toFixed(2); // Canlı ağırlığın %0.7'si (g/kg)
    P = +(canliAgirlik * 0.004).toFixed(2); // Canlı ağırlığın %0.4'ü (g/kg)
  } else if (altTur === 'koyun') {
    // 6+ ay koyun
    KM = +(canliAgirlik * 0.04).toFixed(2); // Canlı ağırlığın %4'ü
    HP = +(canliAgirlik * 0.12 + sutKg * 70).toFixed(2); // Bakım + süt üretimi
    NE = +(canliAgirlik * 0.06 + sutKg * 0.6).toFixed(2); // Bakım + süt üretimi
    Ca = +(canliAgirlik * 0.004 + sutKg * 2.5).toFixed(2); // Bakım + süt üretimi
    P = +(canliAgirlik * 0.003 + sutKg * 1.6).toFixed(2); // Bakım + süt üretimi
  } else {
    // Keçi
    KM = +(canliAgirlik * 0.04).toFixed(2);
    HP = +(canliAgirlik * 0.13 + sutKg * 75).toFixed(2);
    NE = +(canliAgirlik * 0.065 + sutKg * 0.65).toFixed(2);
    Ca = +(canliAgirlik * 0.0045 + sutKg * 2.8).toFixed(2);
    P = +(canliAgirlik * 0.003 + sutKg * 1.8).toFixed(2);
  }
  
  return {
    tur: altTur,
    yas: yas,
    ihtiyac: { KM, HP, NE, Ca, P },
    canliAgirlik: canliAgirlik
  };
}

export default function RationByFeed() {
  const [animalType, setAnimalType] = useState('buyukbas');
  const [buyukbasAltTur, setBuyukbasAltTur] = useState('buzagi');
  const [kucukbasAltTur, setKucukbasAltTur] = useState('kuzu');
  const [weight, setWeight] = useState('');
  const [milk, setMilk] = useState('');
  const [pregMonth, setPregMonth] = useState('0');
  const [age, setAge] = useState('');
  const [feeds, setFeeds] = useState([{ feed: 'saman', amount: '' }]);
  const [result, setResult] = useState<any>(null);
  
  // Modal state'leri
  const [modalVisible, setModalVisible] = useState(false);
  const [activeInput, setActiveInput] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalLabel, setModalLabel] = useState('');
  const [modalFeedIndex, setModalFeedIndex] = useState(-1);

  const handleFeedChange = (index: number, key: string, value: string) => {
    const newFeeds = [...feeds];
    (newFeeds[index] as any)[key] = value;
    setFeeds(newFeeds);
  };

  const addFeed = () => {
    setFeeds([...feeds, { feed: 'saman', amount: '' }]);
  };

  const removeFeed = (index: number) => {
    if (feeds.length === 1) return;
    setFeeds(feeds.filter((_, i) => i !== index));
  };

  const openModal = (inputType: string, label: string, currentValue: string, feedIndex: number = -1) => {
    setActiveInput(inputType);
    setModalLabel(label);
    setModalValue(currentValue);
    setModalFeedIndex(feedIndex);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalValue('');
    setActiveInput('');
    setModalFeedIndex(-1);
  };

  const saveModalValue = () => {
    if (activeInput === 'age') {
      setAge(modalValue);
      // Yaşa göre otomatik alt tür seçimi
      const yasNum = parseInt(modalValue) || 0;
      if (animalType === 'buyukbas') {
        if (yasNum >= 0 && yasNum <= 6) {
          setBuyukbasAltTur('buzagi');
        } else if (yasNum >= 7 && yasNum <= 15) {
          setBuyukbasAltTur('dana');
        } else if (yasNum >= 16) {
          setBuyukbasAltTur('okuz');
        }
      } else if (animalType === 'kucukbas') {
        if (yasNum >= 0 && yasNum <= 6) {
          setKucukbasAltTur('kuzu');
        } else if (yasNum >= 7) {
          setKucukbasAltTur('koyun');
        }
      }
    }
    if (activeInput === 'weight') setWeight(modalValue);
    if (activeInput === 'milk') setMilk(modalValue);
    if (activeInput === 'pregMonth') setPregMonth(modalValue);
    if (activeInput === 'feedAmount' && modalFeedIndex >= 0) {
      const newFeeds = [...feeds];
      newFeeds[modalFeedIndex].amount = modalValue;
      setFeeds(newFeeds);
    }
    closeModal();
  };

  const handleCalculate = () => {
    if (!weight) {
      Alert.alert('Uyarı', 'Canlı ağırlık giriniz!');
      return;
    }
    if (feeds.some(f => !f.amount)) {
      Alert.alert('Uyarı', 'Tüm yem miktarlarını giriniz!');
      return;
    }
    let ihtiyac;
    if (animalType === 'buyukbas') {
      ihtiyac = hesaplaBuyukbasRasyonDetayli(buyukbasAltTur, parseInt(age) || 0, parseFloat(weight) || 0, parseFloat(milk) || 0, parseInt(pregMonth) || 0);
    } else {
      ihtiyac = hesaplaKucukbasRasyonDetayli(kucukbasAltTur, parseInt(age) || 0, parseFloat(weight) || 0, parseFloat(milk) || 0);
    }
    // Girilen yemlerin toplam besin değerlerini hesapla
    let toplam = { KM: 0, HP: 0, NE: 0, Ca: 0, P: 0 };
    feeds.forEach(f => {
      const yem = feedOptions.find(opt => opt.value === f.feed);
      const miktar = parseFloat(f.amount) || 0;
      if (yem) {
        toplam.KM += yem.KM * miktar;
        toplam.HP += yem.HP * miktar;
        toplam.NE += yem.NE * miktar;
        toplam.Ca += yem.Ca * miktar;
        toplam.P += yem.P * miktar;
      }
    });
    const eksikFazla = {
      KM: +(toplam.KM - ihtiyac.ihtiyac.KM).toFixed(2),
      HP: +(toplam.HP - ihtiyac.ihtiyac.HP).toFixed(2),
      NE: +(toplam.NE - ihtiyac.ihtiyac.NE).toFixed(2),
      Ca: +(toplam.Ca - ihtiyac.ihtiyac.Ca).toFixed(2),
      P: +(toplam.P - ihtiyac.ihtiyac.P).toFixed(2),
    };
    setResult({
      tur: ihtiyac.tur,
      yas: ihtiyac.yas,
      ihtiyac: ihtiyac.ihtiyac,
      toplam,
      eksikFazla,
      canliAgirlik: ihtiyac.canliAgirlik
    });
  };

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: '🍽️ Yemle Rasyon Hesaplama',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0a7ea4',
      },
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#0a7ea4',
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginLeft: 16,
            backgroundColor: '#f8f9fa',
            borderRadius: 12,
            padding: 8,
            borderWidth: 1,
            borderColor: '#0a7ea4',
            shadowColor: '#0a7ea4',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0a7ea4" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>🍽️ Elindeki Yemlerle Rasyon Hesapla</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Hayvan Türü</Text>
        <View style={styles.emojiRow}>
          <TouchableOpacity style={[styles.emojiButton, animalType === 'buyukbas' && styles.emojiButtonActive]} onPress={() => setAnimalType('buyukbas')}>
            <Text style={styles.emoji}>🐄</Text>
            <Text style={[styles.emojiLabel, animalType === 'buyukbas' && styles.emojiLabelActive]}>Büyükbaş</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.emojiButton, animalType === 'kucukbas' && styles.emojiButtonActive]} onPress={() => setAnimalType('kucukbas')}>
            <Text style={styles.emoji}>🐑</Text>
            <Text style={[styles.emojiLabel, animalType === 'kucukbas' && styles.emojiLabelActive]}>Küçükbaş</Text>
          </TouchableOpacity>
        </View>
        {animalType === 'buyukbas' && (
          <>
            <Text style={styles.label}>Alt Tür</Text>
            <View style={styles.emojiRow}>
              {buyukbasAltTurler.map(tur => (
                <TouchableOpacity
                  key={tur.value}
                  style={[styles.emojiButton, buyukbasAltTur === tur.value && styles.emojiButtonActive]}
                  onPress={() => setBuyukbasAltTur(tur.value)}
                >
                  <Text style={styles.emoji}>{tur.value === 'buzagi' ? '🐮' : tur.value === 'duve' ? '🐄' : tur.value === 'besi' ? '🐂' : '🥛'}</Text>
                  <Text style={[styles.emojiLabel, buyukbasAltTur === tur.value && styles.emojiLabelActive]}>{tur.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {animalType === 'kucukbas' && (
          <>
            <Text style={styles.label}>Alt Tür</Text>
            <View style={styles.emojiRow}>
              {kucukbasAltTurler.map(tur => (
                <TouchableOpacity
                  key={tur.value}
                  style={[styles.emojiButton, kucukbasAltTur === tur.value && styles.emojiButtonActive]}
                  onPress={() => setKucukbasAltTur(tur.value)}
                >
                  <Text style={styles.emoji}>{tur.value === 'kuzu' ? '🐑' : tur.value === 'oglak' ? '🐐' : tur.value === 'koyun' ? '🐏' : '🐐'}</Text>
                  <Text style={[styles.emojiLabel, kucukbasAltTur === tur.value && styles.emojiLabelActive]}>{tur.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        <Text style={styles.label}>Yaş (ay)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity 
            style={[styles.inputTouchable, { flex: 1, marginRight: 10 }]} 
            onPress={() => openModal('age', 'Yaş (ay)', age)}
          >
            <Text style={styles.inputText}>{age || 'Örn: 6'}</Text>
            <Text style={styles.inputIcon}>✏️</Text>
          </TouchableOpacity>
          <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#0a7ea4' }}>
            <Text style={{ fontSize: 24 }}>
              {(() => {
                const yasNum = parseInt(age) || 0;
                if (animalType === 'buyukbas') {
                  if (yasNum >= 0 && yasNum <= 6) return '🐮';
                  if (yasNum >= 7 && yasNum <= 15) return '🐄';
                  if (yasNum >= 16) return '🐂';
                  return '🐄';
                } else if (animalType === 'kucukbas') {
                  if (yasNum >= 0 && yasNum <= 6) return '🐑';
                  if (yasNum >= 7) return '🐏';
                  return '🐑';
                }
                return '🐄';
              })()}
            </Text>
          </View>
        </View>
        <Text style={styles.label}>Canlı Ağırlık (kg)</Text>
        <TouchableOpacity 
          style={styles.inputTouchable} 
          onPress={() => openModal('weight', 'Canlı Ağırlık (kg)', weight)}
        >
          <Text style={styles.inputText}>{weight || 'Örn: 40'}</Text>
          <Text style={styles.inputIcon}>✏️</Text>
        </TouchableOpacity>
        {(animalType === 'buyukbas' && buyukbasAltTur === 'sutinegi') || (animalType === 'kucukbas' && (kucukbasAltTur === 'koyun' || kucukbasAltTur === 'keci')) ? (
          <>
            <Text style={styles.label}>Süt Verimi (kg/gün)</Text>
            <TouchableOpacity 
              style={styles.inputTouchable} 
              onPress={() => openModal('milk', 'Süt Verimi (kg/gün)', milk)}
            >
              <Text style={styles.inputText}>{milk || 'Yoksa 0 yazın'}</Text>
              <Text style={styles.inputIcon}>✏️</Text>
            </TouchableOpacity>
          </>
        ) : null}
        {animalType === 'buyukbas' && buyukbasAltTur === 'sutinegi' && (
          <>
            <Text style={styles.label}>Gebelik Ayı</Text>
            <TouchableOpacity 
              style={styles.inputTouchable} 
              onPress={() => openModal('pregMonth', 'Gebelik Ayı', pregMonth)}
            >
              <Text style={styles.inputText}>{pregMonth || 'Yoksa 0 yazın'}</Text>
              <Text style={styles.inputIcon}>✏️</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={[styles.label, { marginTop: 18 }]}>Elindeki Yemler</Text>
        {feeds.map((f, i) => (
          <View key={i} style={styles.feedRow}>
            <TouchableOpacity
              style={styles.feedPicker}
              onPress={() => {}}
              activeOpacity={1}
            >
              <Text style={styles.feedEmoji}>{feedOptions.find(opt => opt.value === f.feed)?.emoji}</Text>
              <Text style={styles.feedName}>{feedOptions.find(opt => opt.value === f.feed)?.label}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <TouchableOpacity 
                style={styles.feedInputTouchable} 
                onPress={() => openModal('feedAmount', 'Yem Miktarı (kg)', f.amount, i)}
              >
                <Text style={styles.feedInputText}>{f.amount || 'kg'}</Text>
                <Text style={styles.feedInputIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.removeFeed} onPress={() => removeFeed(i)}>
              <Text style={{ fontSize: 22, color: '#e53935' }}>✖</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feedDropdown}
              onPress={() => {
                const current = feedOptions.findIndex(opt => opt.value === f.feed);
                const next = (current + 1) % feedOptions.length;
                const newFeeds = [...feeds];
                newFeeds[i].feed = feedOptions[next].value;
                setFeeds(newFeeds);
              }}
            >
              <Text style={{ fontSize: 18, color: '#4F8EF7' }}>🔄</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addFeed} onPress={addFeed}>
          <Text style={styles.addFeedText}>+ Yem Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCalculate}>
          <Text style={styles.buttonText}>✨ Hesapla ✨</Text>
        </TouchableOpacity>
      </View>
      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Rasyon Sonucu ({result.tur === 'buzagi' ? 'Buzağı' : result.tur === 'dana' ? 'Dana' : result.tur === 'okuz' ? 'Öküz' : result.tur === 'sutinegi' ? 'Süt İneği' : result.tur === 'kuzu' ? 'Kuzu' : result.tur === 'koyun' ? 'Koyun' : 'Keçi'})</Text>
          <Text style={styles.resultLine}>Yaş: <Text style={styles.resultVal}>{result.yas} ay</Text></Text>
          <Text style={styles.resultLine}>Canlı Ağırlık: <Text style={styles.resultVal}>{result.canliAgirlik} kg</Text></Text>
          <Text style={styles.resultLine}>İhtiyaç (KM): <Text style={styles.resultVal}>{result.ihtiyac.KM} kg</Text></Text>
          <Text style={styles.resultLine}>İhtiyaç (HP): <Text style={styles.resultVal}>{result.ihtiyac.HP} g</Text></Text>
          <Text style={styles.resultLine}>İhtiyaç (NE): <Text style={styles.resultVal}>{result.ihtiyac.NE} Mcal</Text></Text>
          <Text style={styles.resultLine}>İhtiyaç (Ca): <Text style={styles.resultVal}>{result.ihtiyac.Ca} g</Text></Text>
          <Text style={styles.resultLine}>İhtiyaç (P): <Text style={styles.resultVal}>{result.ihtiyac.P} g</Text></Text>
          <Text style={[styles.resultLine, { marginTop: 10 }]}>Toplam (KM): <Text style={styles.resultVal}>{result.toplam.KM.toFixed(2)} kg</Text></Text>
          <Text style={styles.resultLine}>Toplam (HP): <Text style={styles.resultVal}>{result.toplam.HP.toFixed(2)} g</Text></Text>
          <Text style={styles.resultLine}>Toplam (NE): <Text style={styles.resultVal}>{result.toplam.NE.toFixed(2)} Mcal</Text></Text>
          <Text style={styles.resultLine}>Toplam (Ca): <Text style={styles.resultVal}>{result.toplam.Ca.toFixed(2)} g</Text></Text>
          <Text style={styles.resultLine}>Toplam (P): <Text style={styles.resultVal}>{result.toplam.P.toFixed(2)} g</Text></Text>
          <Text style={[styles.resultLine, { marginTop: 10 }]}>Eksik/Fazla (KM): <Text style={[styles.resultVal, { color: Math.abs(result.eksikFazla.KM) < 0.1 ? '#2e7d32' : '#e53935' }]}>{result.eksikFazla.KM} kg</Text></Text>
          <Text style={styles.resultLine}>Eksik/Fazla (HP): <Text style={[styles.resultVal, { color: Math.abs(result.eksikFazla.HP) < 1 ? '#2e7d32' : '#e53935' }]}>{result.eksikFazla.HP} g</Text></Text>
          <Text style={styles.resultLine}>Eksik/Fazla (NE): <Text style={[styles.resultVal, { color: Math.abs(result.eksikFazla.NE) < 0.1 ? '#2e7d32' : '#e53935' }]}>{result.eksikFazla.NE} Mcal</Text></Text>
          <Text style={styles.resultLine}>Eksik/Fazla (Ca): <Text style={[styles.resultVal, { color: Math.abs(result.eksikFazla.Ca) < 0.1 ? '#2e7d32' : '#e53935' }]}>{result.eksikFazla.Ca} g</Text></Text>
          <Text style={styles.resultLine}>Eksik/Fazla (P): <Text style={[styles.resultVal, { color: Math.abs(result.eksikFazla.P) < 0.1 ? '#2e7d32' : '#e53935' }]}>{result.eksikFazla.P} g</Text></Text>
          {Object.values(result.eksikFazla).every(val => typeof val === 'number' && Math.abs(val) < 0.1) ? (
            <Text style={{ color: '#2e7d32', fontWeight: 'bold', marginTop: 10 }}>Rasyonunuz tam ve dengeli! ✅</Text>
          ) : (
            <>
              <Text style={{ color: '#e53935', fontWeight: 'bold', marginTop: 10 }}>Rasyonunuz eksik veya dengesiz!</Text>
              {eksikYemOner(result.eksikFazla, feedOptions).map((oner, idx) => (
                <Text key={idx} style={{ color: '#e53935', fontWeight: 'bold', marginTop: 2 }}>{oner}</Text>
              ))}
            </>
          )}
        </View>
      )}

      {/* Modal Input */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalLabel}</Text>
            <TextInput
              style={styles.modalInput}
              value={modalValue}
              onChangeText={setModalValue}
              placeholder="Değer giriniz..."
              placeholderTextColor="#888"
              keyboardType="numeric"
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={closeModal}>
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSave} onPress={saveModalValue}>
                <Text style={styles.modalButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#ffffff', paddingBottom: 40 },
  container: { flex: 1, alignItems: 'center', backgroundColor: '#ffffff', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 18, color: '#0a7ea4', textAlign: 'center' },
  card: { backgroundColor: '#f8f9fa', borderRadius: 16, padding: 22, marginBottom: 24, width: '100%', elevation: 3, borderWidth: 1, borderColor: '#0a7ea4', shadowColor: '#0a7ea4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  label: { fontSize: 17, color: '#11181C', marginBottom: 6, marginTop: 10, fontWeight: '600' },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  emojiButton: { alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#f8f9fa', marginHorizontal: 4, minWidth: 80, borderWidth: 1, borderColor: '#0a7ea4' },
  emojiButtonActive: { backgroundColor: '#0a7ea4', shadowColor: '#0a7ea4', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  emoji: { fontSize: 28 },
  emojiLabel: { fontSize: 15, color: '#11181C', marginTop: 2, fontWeight: '500' },
  emojiLabelActive: { color: '#ffffff', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#0a7ea4', borderRadius: 10, padding: 13, marginVertical: 8, backgroundColor: '#f8f9fa', fontSize: 18, color: '#11181C' },
  feedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  feedPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 8, padding: 8, marginRight: 8, borderWidth: 1, borderColor: '#0a7ea4' },
  feedEmoji: { fontSize: 22, marginRight: 6 },
  feedName: { color: '#11181C', fontSize: 15 },
  feedInput: { borderWidth: 1, borderColor: '#0a7ea4', borderRadius: 8, padding: 8, backgroundColor: '#f8f9fa', color: '#11181C', width: 70, fontSize: 16 },
  removeFeed: { marginLeft: 8 },
  feedDropdown: { marginLeft: 4, padding: 4 },
  addFeed: { backgroundColor: '#0a7ea4', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18, alignItems: 'center', marginTop: 10, shadowColor: '#0a7ea4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  addFeedText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  button: { backgroundColor: '#0a7ea4', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 18, width: '100%', borderWidth: 1, borderColor: '#0a7ea4', shadowColor: '#0a7ea4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  buttonText: { color: '#ffffff', fontSize: 19, fontWeight: 'bold' },
  resultBox: { backgroundColor: '#f8f9fa', borderRadius: 16, padding: 18, marginTop: 18, borderWidth: 1, borderColor: '#0a7ea4', shadowColor: '#0a7ea4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  resultTitle: { fontSize: 19, fontWeight: 'bold', color: '#0a7ea4', marginBottom: 8 },
  resultLine: { fontSize: 16, color: '#11181C', marginBottom: 2 },
  resultVal: { fontWeight: 'bold', color: '#ff9800' },
  
  // Modal ve Input Styles
  inputTouchable: { 
    borderWidth: 1, 
    borderColor: '#0a7ea4', 
    borderRadius: 10, 
    padding: 13, 
    marginVertical: 8, 
    backgroundColor: '#f8f9fa', 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  inputText: { 
    fontSize: 18, 
    color: '#11181C',
    flex: 1
  },
  inputIcon: { 
    fontSize: 20,
    marginLeft: 10
  },
  feedInputTouchable: { 
    borderWidth: 1, 
    borderColor: '#0a7ea4', 
    borderRadius: 8, 
    padding: 8, 
    backgroundColor: '#f8f9fa', 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 70
  },
  feedInputText: { 
    fontSize: 16, 
    color: '#11181C',
    flex: 1
  },
  feedInputIcon: { 
    fontSize: 16,
    marginLeft: 5
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    width: width * 0.8,
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#0a7ea4',
    elevation: 10,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0a7ea4',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#0a7ea4',
    borderRadius: 15,
    padding: 20,
    fontSize: 24,
    color: '#11181C',
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtonCancel: {
    backgroundColor: '#e53935',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    flex: 0.45,
    alignItems: 'center',
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonSave: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    flex: 0.45,
    alignItems: 'center',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});