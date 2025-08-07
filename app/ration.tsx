import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, Timestamp } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { useLayoutEffect } from 'react';
import { useNavigation } from 'expo-router';

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
  const oneriler = [];
  
  // KM eksikse silaj öner
  if (eksikFazla.KM < -0.1) {
    const silaj = feedOptions.find(f => f.value === 'misir_silaji');
    if (silaj) {
      const ekSilaj = Math.abs(eksikFazla.KM) / silaj.KM;
      oneriler.push(`🌽 Mısır Silajı: +${ekSilaj.toFixed(2)} kg ekleyin`);
    }
  }
  
  // HP eksikse yonca veya küspe öner
  if (eksikFazla.HP < -1) {
    const yonca = feedOptions.find(f => f.value === 'yonca');
    const pamuk = feedOptions.find(f => f.value === 'pamuk');
    if (yonca) {
      const ekYonca = Math.abs(eksikFazla.HP) / yonca.HP;
      oneriler.push(`🍀 Yonca: +${ekYonca.toFixed(2)} kg ekleyin`);
    } else if (pamuk) {
      const ekPamuk = Math.abs(eksikFazla.HP) / pamuk.HP;
      oneriler.push(`🧈 Pamuk Küspesi: +${ekPamuk.toFixed(2)} kg ekleyin`);
    }
  }
  
  // NE eksikse arpa veya mısır öner
  if (eksikFazla.NE < -0.1) {
    const arpa = feedOptions.find(f => f.value === 'arpa');
    const misir = feedOptions.find(f => f.value === 'misir');
    if (arpa) {
      const ekArpa = Math.abs(eksikFazla.NE) / arpa.NE;
      oneriler.push(`🌱 Arpa: +${ekArpa.toFixed(2)} kg ekleyin`);
    } else if (misir) {
      const ekMisir = Math.abs(eksikFazla.NE) / misir.NE;
      oneriler.push(`🌽 Mısır: +${ekMisir.toFixed(2)} kg ekleyin`);
    }
  }
  
  // Ca eksikse yonca öner
  if (eksikFazla.Ca < -0.1) {
    const yonca = feedOptions.find(f => f.value === 'yonca');
    if (yonca) {
      const ekYonca = Math.abs(eksikFazla.Ca) / yonca.Ca;
      oneriler.push(`🍀 Yonca: +${ekYonca.toFixed(2)} kg ekleyin`);
    }
  }
  
  // P eksikse arpa veya küspe öner
  if (eksikFazla.P < -0.1) {
    const arpa = feedOptions.find(f => f.value === 'arpa');
    const pamuk = feedOptions.find(f => f.value === 'pamuk');
    if (arpa) {
      const ekArpa = Math.abs(eksikFazla.P) / arpa.P;
      oneriler.push(`🌱 Arpa: +${ekArpa.toFixed(2)} kg ekleyin`);
    } else if (pamuk) {
      const ekPamuk = Math.abs(eksikFazla.P) / pamuk.P;
      oneriler.push(`🧈 Pamuk Küspesi: +${ekPamuk.toFixed(2)} kg ekleyin`);
    }
  }
  
  return oneriler;
}

function ornekRasyonOner(hayvanIhtiyac: { KM: number; HP: number; NE: number; Ca: number; P: number }) {
  const hedefKM = hayvanIhtiyac.KM;
  const kabaYemOran = 0.65;
  const kesifYemOran = 0.35;
  
  // Kaba yem: %60 silaj, %40 yonca
  const silajKg = +(hedefKM * kabaYemOran * 0.6 / feedOptions[2].KM).toFixed(2);
  const yoncaKg = +(hedefKM * kabaYemOran * 0.4 / feedOptions[3].KM).toFixed(2);
  
  // Kesif yem: %50 arpa, %30 buğday, %20 mısır
  const arpaKg = +(hedefKM * kesifYemOran * 0.5 / feedOptions[1].KM).toFixed(2);
  const bugdayKg = +(hedefKM * kesifYemOran * 0.3 / feedOptions[4].KM).toFixed(2);
  const misirKg = +(hedefKM * kesifYemOran * 0.2 / feedOptions[7].KM).toFixed(2);
  
  // Toplam besin değerleri
  const toplam = { KM: 0, HP: 0, NE: 0, Ca: 0, P: 0 };
  [
    { kg: silajKg, yem: feedOptions[2] },
    { kg: yoncaKg, yem: feedOptions[3] },
    { kg: arpaKg, yem: feedOptions[1] },
    { kg: bugdayKg, yem: feedOptions[4] },
    { kg: misirKg, yem: feedOptions[7] },
  ].forEach(({ kg, yem }) => {
    toplam.KM += yem.KM * kg;
    toplam.HP += yem.HP * kg;
    toplam.NE += yem.NE * kg;
    toplam.Ca += yem.Ca * kg;
    toplam.P += yem.P * kg;
  });
  
  // Eksik/fazla
  const eksikFazla = {
    KM: +(toplam.KM - hayvanIhtiyac.KM).toFixed(2),
    HP: +(toplam.HP - hayvanIhtiyac.HP).toFixed(2),
    NE: +(toplam.NE - hayvanIhtiyac.NE).toFixed(2),
    Ca: +(toplam.Ca - hayvanIhtiyac.Ca).toFixed(2),
    P: +(toplam.P - hayvanIhtiyac.P).toFixed(2),
  };
  
  return {
    silajKg, yoncaKg, arpaKg, bugdayKg, misirKg, toplam, eksikFazla
  };
}

// Yem reçetesi ve besin değerleri tablosu
const yemTablosu = [
  { label: 'Saman', oran: 0.25, KM: 0.85, HP: 25, NE: 1.2 },
  { label: 'Yonca', oran: 0.25, KM: 0.85, HP: 180, NE: 1.2 },
  { label: 'Mısır Silajı', oran: 0.2, KM: 0.30, HP: 30, NE: 1.6 },
  { label: 'Arpa', oran: 0.15, KM: 0.87, HP: 110, NE: 2.0 },
  { label: 'Buğday', oran: 0.15, KM: 0.88, HP: 120, NE: 2.1 },
];

function ornekYemRecetesi(ihtiyac) {
  // Toplam KM ihtiyacına göre yemler dağıtılır
  let kalanKM = ihtiyac.KM;
  const recete = yemTablosu.map(yem => {
    const miktar = +(ihtiyac.KM * yem.oran / yem.KM).toFixed(2);
    kalanKM -= miktar * yem.KM;
    return { ...yem, miktar };
  });
  // Toplam besin değerleri
  const toplam = { KM: 0, HP: 0, NE: 0 };
  recete.forEach(yem => {
    toplam.KM += yem.KM * yem.miktar;
    toplam.HP += yem.HP * yem.miktar;
    toplam.NE += yem.NE * yem.miktar;
  });
  // Eksik/fazla
  const eksikFazla = {
    KM: +(toplam.KM - ihtiyac.KM).toFixed(2),
    HP: +(toplam.HP - ihtiyac.HP).toFixed(2),
    NE: +(toplam.NE - ihtiyac.NE).toFixed(2),
  };
  return { recete, toplam, eksikFazla };
}

const buyukbasAltTurler = [
  { label: 'Buzağı', value: 'buzagi' },
  { label: 'Düve', value: 'duve' },
  { label: 'Besi Danası', value: 'besi' },
  { label: 'Süt İneği', value: 'sutinegi' },
];

const kucukbasAltTurler = [
  { label: 'Kuzu', value: 'kuzu' },
  { label: 'Oğlak', value: 'oglak' },
  { label: 'Yetişkin Koyun', value: 'koyun' },
  { label: 'Yetişkin Keçi', value: 'keci' },
];

export default function Ration() {
  const [animalType, setAnimalType] = useState('buyukbas');
  const [altTur, setAltTur] = useState('buzagi');
  const [weight, setWeight] = useState('');
  const [milk, setMilk] = useState('');
  const [pregMonth, setPregMonth] = useState('0');
  const [age, setAge] = useState('');
  const [result, setResult] = useState<any>(null);
  const [kucukbasAltTur, setKucukbasAltTur] = useState('kuzu');

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Rasyon Hesaplama' });
  }, [navigation]);

  const handleCalculate = async () => {
    if (!weight) {
      Alert.alert('Uyarı', 'Canlı ağırlık giriniz!');
      return;
    }
    let ihtiyac, yem;
    if (animalType === 'buyukbas') {
      ihtiyac = hesaplaBuyukbasRasyonDetayli(altTur, parseInt(age) || 0, parseFloat(weight) || 0, parseFloat(milk) || 0, parseInt(pregMonth) || 0);
      yem = ornekRasyonOner(ihtiyac.ihtiyac);
    } else {
      ihtiyac = hesaplaKucukbasRasyonDetayli(kucukbasAltTur, parseInt(age) || 0, parseFloat(weight) || 0, parseFloat(milk) || 0);
      yem = ornekRasyonOner(ihtiyac.ihtiyac);
    }
    setResult({
      animalType,
      altTur: animalType === 'buyukbas' ? altTur : kucukbasAltTur,
      age,
      weight,
      milk,
      pregMonth,
      ihtiyac: ihtiyac.ihtiyac,
      yem: {
        recete: [
          { label: 'Mısır Silajı', miktar: yem.silajKg },
          { label: 'Yonca', miktar: yem.yoncaKg },
          { label: 'Arpa', miktar: yem.arpaKg },
          { label: 'Buğday', miktar: yem.bugdayKg },
          { label: 'Mısır', miktar: yem.misirKg },
        ],
        toplam: yem.toplam,
        eksikFazla: yem.eksikFazla
      }
    });
    // Firestore'a geçmiş kaydı ekle
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      console.log('Kullanıcı durumu:', user ? 'Giriş yapmış' : 'Giriş yapmamış');
      console.log('Kullanıcı ID:', user?.uid);
      
      if (user) {
        const db = getFirestore(app);
        console.log('Firestore bağlantısı kuruldu');
        
        const historyData = {
          userId: user.uid,
          type: 'yemsiz',
          animalType,
          weight: weight,
          milk: milk,
          pregMonth: pregMonth,
          age,
          result: { 
            ihtiyac: ihtiyac.ihtiyac, 
            altTur: animalType === 'buyukbas' ? altTur : kucukbasAltTur, 
            age, 
            weight, 
            milk, 
            pregMonth 
          },
          createdAt: Timestamp.now(),
        };
        
        console.log('Kaydedilecek veri:', historyData);
        
        const docRef = await addDoc(collection(db, 'history'), historyData);
        console.log('Rasyon başarıyla kaydedildi. Doküman ID:', docRef.id);
        Alert.alert('Başarılı', 'Rasyon kaydedildi!');
      } else {
        console.log('Kullanıcı giriş yapmamış');
        Alert.alert('Hata', 'Lütfen önce giriş yapın!');
      }
    } catch (e: any) { 
      console.error('Rasyon kaydetme hatası:', e);
      console.error('Hata detayı:', e.message);
      console.error('Hata kodu:', e.code);
      Alert.alert('Hata', 'Rasyon kaydedilemedi: ' + (e.message || 'Bilinmeyen hata'));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Gerçekçi Rasyon Hesaplama</Text>
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
                  style={[styles.emojiButton, altTur === tur.value && styles.emojiButtonActive]}
                  onPress={() => setAltTur(tur.value)}
                >
                  <Text style={styles.emoji}>{tur.value === 'buzagi' ? '🐮' : tur.value === 'duve' ? '🐄' : tur.value === 'besi' ? '🐂' : '🥛'}</Text>
                  <Text style={[styles.emojiLabel, altTur === tur.value && styles.emojiLabelActive]}>{tur.label}</Text>
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
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            value={age}
            onChangeText={(text) => {
              setAge(text);
              // Yaşa göre otomatik alt tür seçimi
              const yasNum = parseInt(text) || 0;
              if (animalType === 'buyukbas') {
                if (yasNum >= 0 && yasNum <= 6) {
                  setAltTur('buzagi');
                } else if (yasNum >= 7 && yasNum <= 15) {
                  setAltTur('dana');
                } else if (yasNum >= 16) {
                  setAltTur('okuz');
                }
              } else if (animalType === 'kucukbas') {
                if (yasNum >= 0 && yasNum <= 6) {
                  setKucukbasAltTur('kuzu');
                } else if (yasNum >= 7) {
                  setKucukbasAltTur('koyun');
                }
              }
            }}
            placeholder="Örn: 6"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
          <View style={{ backgroundColor: '#23263a', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#4F8EF7' }}>
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
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="Örn: 40"
          keyboardType="numeric"
          placeholderTextColor="#888"
        />
        {(animalType === 'buyukbas' && altTur === 'sutinegi') || (animalType === 'kucukbas' && (kucukbasAltTur === 'koyun' || kucukbasAltTur === 'keci')) ? (
          <>
            <Text style={styles.label}>Süt Verimi (kg/gün)</Text>
            <TextInput
              style={styles.input}
              value={milk}
              onChangeText={setMilk}
              placeholder="Yoksa 0 yazın"
              keyboardType="numeric"
              placeholderTextColor="#888"
            />
          </>
        ) : null}
        {animalType === 'buyukbas' && altTur === 'sutinegi' && (
          <>
            <Text style={styles.label}>Gebelik Ayı</Text>
            <TextInput
              style={styles.input}
              value={pregMonth}
              onChangeText={setPregMonth}
              placeholder="Yoksa 0 yazın"
              keyboardType="numeric"
              placeholderTextColor="#888"
            />
          </>
        )}
        <TouchableOpacity style={styles.button} onPress={handleCalculate}>
          <Text style={styles.buttonText}>✨ Hesapla ✨</Text>
        </TouchableOpacity>
      </View>
      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Rasyon Sonucu ({result.animalType === 'buyukbas' ? buyukbasAltTurler.find(t=>t.value===result.altTur)?.label : kucukbasAltTurler.find(t=>t.value===result.altTur)?.label})</Text>
          <Text style={styles.resultLine}>Yaş: <Text style={styles.resultVal}>{result.age} ay</Text></Text>
          <Text style={styles.resultLine}>Canlı Ağırlık: <Text style={styles.resultVal}>{result.weight} kg</Text></Text>
          {(result.animalType === 'buyukbas' && result.altTur === 'sutinegi') || (result.animalType === 'kucukbas' && (result.altTur === 'koyun' || result.altTur === 'keci')) ? (
            <Text style={styles.resultLine}>Süt Verimi: <Text style={styles.resultVal}>{result.milk} kg/gün</Text></Text>
          ) : null}
          {result.animalType === 'buyukbas' && result.altTur === 'sutinegi' && (
            <Text style={styles.resultLine}>Gebelik Ayı: <Text style={styles.resultVal}>{result.pregMonth}</Text></Text>
          )}
          <Text style={styles.resultLine}>Günlük İhtiyaç:</Text>
          <Text style={styles.resultLine}>  KM: <Text style={styles.resultVal}>{result.ihtiyac.KM} kg</Text></Text>
          <Text style={styles.resultLine}>  HP: <Text style={styles.resultVal}>{result.ihtiyac.HP} g</Text></Text>
          <Text style={styles.resultLine}>  NE: <Text style={styles.resultVal}>{result.ihtiyac.NE} Mcal</Text></Text>
          <Text style={styles.resultLine}>Aylık İhtiyaç:</Text>
          <Text style={styles.resultLine}>  KM: <Text style={styles.resultVal}>{(result.ihtiyac.KM*30).toFixed(1)} kg</Text></Text>
          <Text style={styles.resultLine}>  HP: <Text style={styles.resultVal}>{(result.ihtiyac.HP*30).toFixed(1)} g</Text></Text>
          <Text style={styles.resultLine}>  NE: <Text style={styles.resultVal}>{(result.ihtiyac.NE*30).toFixed(1)} Mcal</Text></Text>
          <Text style={styles.resultLine}>Yıllık İhtiyaç:</Text>
          <Text style={styles.resultLine}>  KM: <Text style={styles.resultVal}>{(result.ihtiyac.KM*365).toFixed(1)} kg</Text></Text>
          <Text style={styles.resultLine}>  HP: <Text style={styles.resultVal}>{(result.ihtiyac.HP*365).toFixed(1)} g</Text></Text>
          <Text style={styles.resultLine}>  NE: <Text style={styles.resultVal}>{(result.ihtiyac.NE*365).toFixed(1)} Mcal</Text></Text>
          <Text style={[styles.resultTitle, {marginTop: 12}]}>Örnek Yem Reçetesi</Text>
          {result.yem.recete.map((yem: any, i: number) => (
            <Text key={i} style={styles.resultLine}>{yem.label}: <Text style={styles.resultVal}>{yem.miktar} kg</Text></Text>
          ))}
          <Text style={styles.resultLine}>Toplam KM: <Text style={styles.resultVal}>{result.yem.toplam.KM.toFixed(2)} kg</Text></Text>
          <Text style={styles.resultLine}>Toplam HP: <Text style={styles.resultVal}>{result.yem.toplam.HP.toFixed(2)} g</Text></Text>
          <Text style={styles.resultLine}>Toplam NE: <Text style={styles.resultVal}>{result.yem.toplam.NE.toFixed(2)} Mcal</Text></Text>
          <Text style={[styles.resultLine, {marginTop: 8}]}>Eksik/Fazla:</Text>
          <Text style={[styles.resultLine, { color: Math.abs(result.yem.eksikFazla.KM) < 0.1 ? '#2e7d32' : '#e53935' }]}>KM: {result.yem.eksikFazla.KM} kg</Text>
          <Text style={[styles.resultLine, { color: Math.abs(result.yem.eksikFazla.HP) < 1 ? '#2e7d32' : '#e53935' }]}>HP: {result.yem.eksikFazla.HP} g</Text>
          <Text style={[styles.resultLine, { color: Math.abs(result.yem.eksikFazla.NE) < 0.1 ? '#2e7d32' : '#e53935' }]}>NE: {result.yem.eksikFazla.NE} Mcal</Text>
        </View>
      )}
      {result && result.hata && (
        <Text style={{ color: 'red', marginTop: 20 }}>{result.hata}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#181A20', paddingBottom: 40 },
  container: { flex: 1, alignItems: 'center', backgroundColor: '#181A20', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 18, color: '#4F8EF7', textAlign: 'center' },
  card: { backgroundColor: '#23263a', borderRadius: 16, padding: 22, marginBottom: 24, width: '100%', elevation: 3, borderWidth: 1, borderColor: '#4F8EF7' },
  label: { fontSize: 17, color: '#fff', marginBottom: 6, marginTop: 10 },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  emojiButton: { alignItems: 'center', marginHorizontal: 12, padding: 8, borderRadius: 8, backgroundColor: '#23263a', borderWidth: 1, borderColor: '#4F8EF7' },
  emojiButtonActive: { backgroundColor: '#4F8EF7' },
  emoji: { fontSize: 32 },
  emojiLabel: { color: '#fff', fontSize: 14, marginTop: 4 },
  emojiLabelActive: { color: '#fff', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#4F8EF7', borderRadius: 10, padding: 13, marginVertical: 8, backgroundColor: '#181A20', fontSize: 18, color: '#fff' },
  button: { backgroundColor: '#23263a', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 18, width: '100%', borderWidth: 1, borderColor: '#4F8EF7' },
  buttonText: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
  resultBox: { backgroundColor: '#23263a', borderRadius: 16, padding: 18, marginTop: 18, borderWidth: 1, borderColor: '#4F8EF7' },
  resultTitle: { fontSize: 19, fontWeight: 'bold', color: '#4F8EF7', marginBottom: 8 },
  resultLine: { fontSize: 16, color: '#f1f1f1', marginBottom: 2 },
  resultVal: { fontWeight: 'bold', color: '#ffe066' },
});