import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import React, { useLayoutEffect, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { app } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

// Bilimsel Büyükbaş Rasyon Hesaplama - Güncellenmiş Formüller
function hesaplaBuyukbasRasyonDetayli(altTur: string, yas: number, canliAgirlik: number, sutKg: number = 0, gebelikAyi: number = 0, agirlikArtisi: number = 0) {
  let KM, HP, NE, Ca, P;
  
  if (altTur === 'buzagi') {
    // 0-6 ay buzağı - Gerçekçi formül
    const bakimKM = +(canliAgirlik * 0.025).toFixed(2); // Canlı ağırlığın %2.5'i
    const artisKM = +(agirlikArtisi * 0.3).toFixed(2); // Ağırlık artışı için ek KM
    KM = +(bakimKM + artisKM).toFixed(2);
    
    const bakimHP = +(canliAgirlik * 0.15).toFixed(2); // Canlı ağırlığın %15'i (g/kg)
    const artisHP = +(agirlikArtisi * 8).toFixed(2); // Ağırlık artışı için ek HP
    HP = +(bakimHP + artisHP).toFixed(2);
    
    const bakimNE = +(canliAgirlik * 0.08).toFixed(2); // Canlı ağırlığın 0.08 Mcal/kg'sı
    const artisNE = +(agirlikArtisi * 0.5).toFixed(2); // Ağırlık artışı için ek NE
    NE = +(bakimNE + artisNE).toFixed(2);
    
    const bakimCa = +(canliAgirlik * 0.006).toFixed(2); // Canlı ağırlığın %0.6'ı (g/kg)
    const artisCa = +(agirlikArtisi * 0.8).toFixed(2); // Ağırlık artışı için ek Ca
    Ca = +(bakimCa + artisCa).toFixed(2);
    
    const bakimP = +(canliAgirlik * 0.004).toFixed(2); // Canlı ağırlığın %0.4'ü (g/kg)
    const artisP = +(agirlikArtisi * 0.6).toFixed(2); // Ağırlık artışı için ek P
    P = +(bakimP + artisP).toFixed(2);
    
  } else if (altTur === 'duve') {
    // 6-15 ay düve - Detaylı formül
    const bakimKM = +(canliAgirlik * 0.03).toFixed(2);
    const artisKM = +(agirlikArtisi * 2.8).toFixed(2);
    KM = +(bakimKM + artisKM).toFixed(2);
    
    const bakimHP = +(canliAgirlik * 0.15).toFixed(2);
    const artisHP = +(agirlikArtisi * 300).toFixed(2);
    HP = +(bakimHP + artisHP).toFixed(2);
    
    const bakimNE = +(canliAgirlik * 0.1).toFixed(2);
    const artisNE = +(agirlikArtisi * 4.8).toFixed(2);
    NE = +(bakimNE + artisNE).toFixed(2);
    
    const bakimCa = +(canliAgirlik * 0.006).toFixed(2);
    const artisCa = +(agirlikArtisi * 8).toFixed(2);
    Ca = +(bakimCa + artisCa).toFixed(2);
    
    const bakimP = +(canliAgirlik * 0.004).toFixed(2);
    const artisP = +(agirlikArtisi * 5).toFixed(2);
    P = +(bakimP + artisP).toFixed(2);
    
  } else if (altTur === 'besi') {
    // Besi danası - Gerçekçi formül
    const bakimKM = +(canliAgirlik * 0.025).toFixed(2); // Bakım için KM
    const artisKM = +(agirlikArtisi * 0.5).toFixed(2); // Ağırlık artışı için KM
    KM = +(bakimKM + artisKM).toFixed(2);
    
    const bakimHP = +(canliAgirlik * 0.08).toFixed(2); // Bakım için HP
    const artisHP = +(agirlikArtisi * 8).toFixed(2); // Ağırlık artışı için HP
    HP = +(bakimHP + artisHP).toFixed(2);
    
    const bakimNE = +(canliAgirlik * 0.08).toFixed(2); // Bakım için NE
    const artisNE = +(agirlikArtisi * 0.6).toFixed(2); // Ağırlık artışı için NE
    NE = +(bakimNE + artisNE).toFixed(2);
    
    const bakimCa = +(canliAgirlik * 0.005).toFixed(2); // Bakım için Ca
    const artisCa = +(agirlikArtisi * 0.6).toFixed(2); // Ağırlık artışı için Ca
    Ca = +(bakimCa + artisCa).toFixed(2);
    
    const bakimP = +(canliAgirlik * 0.003).toFixed(2); // Bakım için P
    const artisP = +(agirlikArtisi * 0.4).toFixed(2); // Ağırlık artışı için P
    P = +(bakimP + artisP).toFixed(2);
    
  } else if (altTur === 'okuz') {
    // Öküz - Detaylı formül
    const bakimKM = +(canliAgirlik * 0.025).toFixed(2);
    const artisKM = +(agirlikArtisi * 2.2).toFixed(2);
    KM = +(bakimKM + artisKM).toFixed(2);
    
    const bakimHP = +(canliAgirlik * 0.12).toFixed(2);
    const artisHP = +(agirlikArtisi * 250).toFixed(2);
    HP = +(bakimHP + artisHP).toFixed(2);
    
    const bakimNE = +(canliAgirlik * 0.08).toFixed(2);
    const artisNE = +(agirlikArtisi * 4.0).toFixed(2);
    NE = +(bakimNE + artisNE).toFixed(2);
    
    const bakimCa = +(canliAgirlik * 0.005).toFixed(2);
    const artisCa = +(agirlikArtisi * 6).toFixed(2);
    Ca = +(bakimCa + artisCa).toFixed(2);
    
    const bakimP = +(canliAgirlik * 0.003).toFixed(2);
    const artisP = +(agirlikArtisi * 3.5).toFixed(2);
    P = +(bakimP + artisP).toFixed(2);
    
  } else if (altTur === 'boga') {
    // Boğa - Detaylı formül
    const bakimKM = +(canliAgirlik * 0.03).toFixed(2);
    const artisKM = +(agirlikArtisi * 2.5).toFixed(2);
    KM = +(bakimKM + artisKM).toFixed(2);
    
    const bakimHP = +(canliAgirlik * 0.13).toFixed(2);
    const artisHP = +(agirlikArtisi * 270).toFixed(2);
    HP = +(bakimHP + artisHP).toFixed(2);
    
    const bakimNE = +(canliAgirlik * 0.09).toFixed(2);
    const artisNE = +(agirlikArtisi * 4.2).toFixed(2);
    NE = +(bakimNE + artisNE).toFixed(2);
    
    const bakimCa = +(canliAgirlik * 0.006).toFixed(2);
    const artisCa = +(agirlikArtisi * 7.5).toFixed(2);
    Ca = +(bakimCa + artisCa).toFixed(2);
    
    const bakimP = +(canliAgirlik * 0.004).toFixed(2);
    const artisP = +(agirlikArtisi * 4.8).toFixed(2);
    P = +(bakimP + artisP).toFixed(2);
    
  } else if (altTur === 'sutinegi') {
    // Süt inekleri - Gerçekçi formül
    const bakimKM = +(canliAgirlik * 0.02).toFixed(2); // Bakım için KM
    const sutKM = +(sutKg * 0.2).toFixed(2); // Süt üretimi için KM
    KM = +(bakimKM + sutKM).toFixed(2);
    
    const bakimHP = +(canliAgirlik * 0.06).toFixed(2); // Bakım için HP
    const sutHP = +(sutKg * 1.5).toFixed(2); // Süt üretimi için HP
    HP = +(bakimHP + sutHP).toFixed(2);
    
    const bakimNE = +(canliAgirlik * 0.08).toFixed(2); // Bakım için NE
    const sutNE = +(sutKg * 0.7).toFixed(2); // Süt üretimi için NE
    NE = +(bakimNE + sutNE).toFixed(2);
    
    const bakimCa = +(canliAgirlik * 0.004).toFixed(2); // Bakım için Ca
    const sutCa = +(sutKg * 0.08).toFixed(2); // Süt üretimi için Ca
    Ca = +(bakimCa + sutCa).toFixed(2);
    
    const bakimP = +(canliAgirlik * 0.003).toFixed(2); // Bakım için P
    const sutP = +(sutKg * 0.05).toFixed(2); // Süt üretimi için P
    P = +(bakimP + sutP).toFixed(2);
    
    // Gebelik ekstra ihtiyacı
    if (gebelikAyi >= 7) {
      const gebelikFaktoru = gebelikAyi === 7 ? 0.15 : gebelikAyi === 8 ? 0.25 : 0.35;
      HP = +(HP * (1 + gebelikFaktoru)).toFixed(2);
      NE = +(NE * (1 + gebelikFaktoru)).toFixed(2);
      Ca = +(Ca * (1 + gebelikFaktoru)).toFixed(2);
      P = +(P * (1 + gebelikFaktoru)).toFixed(2);
    }
  } else {
    // Varsayılan - Besi danası
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
    canliAgirlik: canliAgirlik,
    agirlikArtisi: agirlikArtisi
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

function ornekYemRecetesi(ihtiyac: { KM: number; HP: number; NE: number }) {
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
  { label: 'Buzağı (0-6 ay)', value: 'buzagi', emoji: '🐮', aciklama: 'Sütten kesim öncesi' },
  { label: 'Düve (6-15 ay)', value: 'duve', emoji: '🐄', aciklama: 'Genç dişi sığır' },
  { label: 'Besi Danası', value: 'besi', emoji: '🐂', aciklama: 'Et üretimi için' },
  { label: 'Süt İneği', value: 'sutinegi', emoji: '🥛', aciklama: 'Süt üretimi için' },
  { label: 'Öküz', value: 'okuz', emoji: '🐃', aciklama: 'Besi amaçlı erkek' },
  { label: 'Boğa', value: 'boga', emoji: '🐂', aciklama: 'Damızlık erkek' },
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
  const [weightGain, setWeightGain] = useState('');
  const [result, setResult] = useState<any>(null);
  const [kucukbasAltTur, setKucukbasAltTur] = useState('kuzu');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', description: '' });
  const [showYemModal, setShowYemModal] = useState(false);
  const [availableYemler, setAvailableYemler] = useState<any[]>([]);
  const [selectedYemler, setSelectedYemler] = useState<any[]>([]);
  const [customRationMode, setCustomRationMode] = useState(false);
  
  // Modal state'leri
  const [modalVisible, setModalVisible] = useState(false);
  const [activeInput, setActiveInput] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalLabel, setModalLabel] = useState('');

  const navigation = useNavigation();
  const router = useRouter();
  
  useLayoutEffect(() => {
    navigation.setOptions({
      title: '🧮 Rasyon Hesaplama',
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
        <View style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push('/ana-sayfa')}
            style={{
              backgroundColor: '#0a7ea4',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginRight: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Ionicons name="home" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
              🏠 Ana Sayfa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: 12,
              padding: 8,
              borderWidth: 1,
              borderColor: '#0a7ea4',
              shadowColor: '#0a7ea4',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#0a7ea4" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleCalculate = () => {
    if (!weight) {
      Alert.alert('Uyarı', 'Canlı ağırlık giriniz!');
      return;
    }
    let ihtiyac, yem;
    if (animalType === 'buyukbas') {
      ihtiyac = hesaplaBuyukbasRasyonDetayli(
        altTur, 
        parseInt(age) || 0, 
        parseFloat(weight) || 0, 
        parseFloat(milk) || 0, 
        parseInt(pregMonth) || 0,
        parseFloat(weightGain) || 0
      );
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
      weightGain,
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
  };

  const openModal = (inputType: string, label: string, currentValue: string) => {
    setActiveInput(inputType);
    setModalLabel(label);
    setModalValue(currentValue);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalValue('');
    setActiveInput('');
  };

  const saveModalValue = () => {
    if (activeInput === 'age') {
      setAge(modalValue);
      // Yaşa göre otomatik alt tür seçimi
      const yasNum = parseInt(modalValue) || 0;
      if (animalType === 'buyukbas') {
        if (yasNum >= 0 && yasNum <= 6) {
          setAltTur('buzagi');
        } else if (yasNum >= 7 && yasNum <= 15) {
          setAltTur('duve');
        } else if (yasNum >= 16) {
          setAltTur('besi');
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
    if (activeInput === 'weightGain') setWeightGain(modalValue);
    closeModal();
  };

  const showInfo = (type: string) => {
    const infoData = {
      KM: {
        title: 'Kuru Madde (KM)',
        description: 'Yemdeki su çıkarıldıktan sonra kalan kısım. Hayvanın günlük kuru madde ihtiyacı, canlı ağırlığının %2-4\'ü arasındadır. Bu, hayvanın temel beslenme ihtiyacını karşılar.'
      },
      HP: {
        title: 'Ham Protein (HP)',
        description: 'Yemdeki toplam protein miktarı. Protein, kas gelişimi, süt üretimi ve vücut onarımı için gereklidir. Genç hayvanlar daha fazla proteine ihtiyaç duyar.'
      },
      NE: {
        title: 'Net Enerji (NE)',
        description: 'Hayvanın gerçekten kullanabileceği enerji miktarı. Metabolik enerjiden sindirim kayıpları çıkarılarak hesaplanır. Büyüme ve süt üretimi için kritik öneme sahiptir.'
      },
      Ca: {
        title: 'Kalsiyum (Ca)',
        description: 'Kemik ve diş gelişimi için gerekli mineral. Süt üretimi sırasında özellikle önemlidir. Eksikliği kemik zayıflığına, fazlası böbrek taşına neden olabilir.'
      },
      P: {
        title: 'Fosfor (P)',
        description: 'Kemik oluşumu ve enerji metabolizması için gerekli mineral. Kalsiyum ile birlikte çalışır. Eksikliği büyüme geriliğine, fazlası böbrek problemlerine yol açabilir.'
      }
    };
    
    setInfoContent(infoData[type as keyof typeof infoData]);
    setShowInfoModal(true);
  };

  const loadAvailableYemler = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(app);
      const yemlerRef = collection(db, 'yemler');
      const q = query(yemlerRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const yemler = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Yem besin değerleri (örnek değerler - gerçek uygulamada veritabanından gelecek)
        KM: 0.85, // %85 kuru madde
        HP: 12.0, // %12 ham protein
        NE: 1.5,  // 1.5 Mcal/kg
        Ca: 1.2,  // 1.2 g/kg
        P: 0.8    // 0.8 g/kg
      }));
      
      setAvailableYemler(yemler);
    } catch (error) {
      console.error('Yemler yüklenirken hata:', error);
      Alert.alert('Hata', 'Yemler yüklenirken bir hata oluştu');
    }
  };

  const toggleYemSelection = (yem: any) => {
    setSelectedYemler((prev: any[]) => {
      const exists = prev.find((item: any) => item.id === yem.id);
      if (exists) {
        return prev.filter((item: any) => item.id !== yem.id);
      } else {
        return [...prev, yem];
      }
    });
  };

  const calculateCustomRation = () => {
    if (selectedYemler.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir yem seçin');
      return;
    }

    const yas = parseInt(age) || 0;
    const canliAgirlik = parseFloat(weight) || 0;
    const sutKg = parseFloat(milk) || 0;
    const gebelikAyi = parseInt(pregMonth) || 0;
    const agirlikArtisi = parseFloat(weightGain) || 0;

    if (animalType === 'buyukbas') {
      const hesaplama = hesaplaBuyukbasRasyonDetayli(altTur, yas, canliAgirlik, sutKg, gebelikAyi, agirlikArtisi);
      
      // Seçilen yemlerle özel rasyon hesaplama
      const customRation = {
        ...hesaplama,
        customYemler: selectedYemler,
        customMode: true
      };
      
      setResult(customRation);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {/* Arka Plan Dekoratif Öğeleri */}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundShape1} />
        <View style={styles.backgroundShape2} />
        <View style={styles.backgroundShape3} />
        <View style={styles.backgroundShape4} />
        <View style={styles.backgroundLine1} />
        <View style={styles.backgroundLine2} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>🧮 Rasyon Hesaplama</Text>
        <Text style={styles.subtitle}>Hayvan bilgilerini girin, güzel bir öneri hazırlayalım</Text>
        <View style={styles.titleDecoration}>
          <Text style={styles.decorationText}>✨</Text>
          <Text style={styles.decorationText}>🌟</Text>
          <Text style={styles.decorationText}>✨</Text>
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hayvan Türü</Text>
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
                  <Text style={styles.emoji}>{tur.emoji}</Text>
                  <Text style={[styles.emojiLabel, altTur === tur.value && styles.emojiLabelActive]}>{tur.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionSubtitle}>
              {buyukbasAltTurler.find(t => t.value === altTur)?.aciklama}
            </Text>
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
        <Text style={styles.sectionTitle}>Yaş (ay)</Text>
        <TouchableOpacity 
          style={styles.inputTouchable} 
          onPress={() => openModal('age', 'Yaş (ay)', age)}
        >
          <Text style={styles.inputText}>{age || 'Örn: 6'}</Text>
          <Text style={styles.inputIcon}>✏️</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
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
        <Text style={styles.sectionTitle}>Canlı Ağırlık (kg)</Text>
        <TouchableOpacity 
          style={styles.inputTouchable} 
          onPress={() => openModal('weight', 'Canlı Ağırlık (kg)', weight)}
        >
          <Text style={styles.inputText}>{weight || 'Örn: 40'}</Text>
          <Text style={styles.inputIcon}>✏️</Text>
        </TouchableOpacity>
        
        {(altTur === 'buzagi' || altTur === 'duve' || altTur === 'besi' || altTur === 'okuz' || altTur === 'boga') && (
          <>
            <Text style={styles.sectionTitle}>Günlük Ağırlık Artışı (kg)</Text>
            <TouchableOpacity 
              style={styles.inputTouchable} 
              onPress={() => openModal('weightGain', 'Günlük Ağırlık Artışı (kg)', weightGain)}
            >
              <Text style={styles.inputText}>{weightGain || 'Örn: 0.8'}</Text>
              <Text style={styles.inputIcon}>✏️</Text>
            </TouchableOpacity>
          </>
        )}
        {(animalType === 'buyukbas' && altTur === 'sutinegi') || (animalType === 'kucukbas' && (kucukbasAltTur === 'koyun' || kucukbasAltTur === 'keci')) ? (
          <>
            <Text style={styles.sectionTitle}>Süt Verimi (kg/gün)</Text>
            <TouchableOpacity 
              style={styles.inputTouchable} 
              onPress={() => openModal('milk', 'Süt Verimi (kg/gün)', milk)}
            >
              <Text style={styles.inputText}>{milk || 'Yoksa 0 yazın'}</Text>
              <Text style={styles.inputIcon}>✏️</Text>
            </TouchableOpacity>
          </>
        ) : null}
        {animalType === 'buyukbas' && altTur === 'sutinegi' && (
          <>
            <Text style={styles.sectionTitle}>Gebelik Ayı</Text>
            <TouchableOpacity 
              style={styles.inputTouchable} 
              onPress={() => openModal('pregMonth', 'Gebelik Ayı', pregMonth)}
            >
              <Text style={styles.inputText}>{pregMonth || 'Ibka 0 yazın'}</Text>
              <Text style={styles.inputIcon}>✏️</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleCalculate}>
            <View style={styles.buttonGradient}>
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconContainer}>
                  <Ionicons name="calculator" size={26} color="#ffffff" />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonText}>🧮 Hesapla</Text>
                  <Text style={styles.buttonSubtext}>Rasyonu Hesapla</Text>
                </View>
                <View style={styles.buttonArrowContainer}>
                  <Ionicons name="arrow-forward" size={22} color="#ffffff" />
                </View>
              </View>
              <View style={styles.buttonShine} />
              <View style={styles.buttonParticles}>
                <Text style={styles.particle}>✨</Text>
                <Text style={styles.particle}>🌟</Text>
                <Text style={styles.particle}>✨</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.customButton]} 
            onPress={() => {
              loadAvailableYemler();
              setShowYemModal(true);
            }}
          >
            <View style={[styles.buttonGradient, styles.customButtonGradient]}>
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconContainer}>
                  <Ionicons name="leaf" size={26} color="#ffffff" />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonText}>🌾 Elimdeki Yemlerle</Text>
                  <Text style={styles.buttonSubtext}>Özel Rasyon Hesapla</Text>
                </View>
                <View style={styles.buttonArrowContainer}>
                  <Ionicons name="arrow-forward" size={22} color="#ffffff" />
                </View>
              </View>
              <View style={styles.buttonShine} />
              <View style={styles.buttonParticles}>
                <Text style={styles.particle}>🌾</Text>
                <Text style={styles.particle}>🥕</Text>
                <Text style={styles.particle}>🌾</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {result && (
        <View style={styles.resultBox}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>📦 Rasyon Sonucu</Text>
            <Text style={styles.resultSubtitle}>
              {result.animalType === 'buyukbas' ? buyukbasAltTurler.find(t=>t.value===result.altTur)?.label : kucukbasAltTurler.find(t=>t.value===result.altTur)?.label}
            </Text>
            <View style={styles.resultDecoration}>
              <Text style={styles.decorationText}>🎯</Text>
              <Text style={styles.decorationText}>📊</Text>
              <Text style={styles.decorationText}>🎯</Text>
            </View>
          </View>
          <Text style={styles.resultLine}>Yaş: <Text style={styles.resultVal}>{result.age} ay</Text></Text>
          <Text style={styles.resultLine}>Canlı Ağırlık: <Text style={styles.resultVal}>{result.weight} kg</Text></Text>
          {(result.altTur === 'buzagi' || result.altTur === 'duve' || result.altTur === 'besi' || result.altTur === 'okuz' || result.altTur === 'boga') && (
            <Text style={styles.resultLine}>Günlük Ağırlık Artışı: <Text style={styles.resultVal}>{result.weightGain} kg/gün</Text></Text>
          )}
          {(result.animalType === 'buyukbas' && result.altTur === 'sutinegi') || (result.animalType === 'kucukbas' && (result.altTur === 'koyun' || result.altTur === 'keci')) ? (
            <Text style={styles.resultLine}>Süt Verimi: <Text style={styles.resultVal}>{result.milk} kg/gün</Text></Text>
          ) : null}
          {result.animalType === 'buyukbas' && result.altTur === 'sutinegi' && (
            <Text style={styles.resultLine}>Gebelik Ayı: <Text style={styles.resultVal}>{result.pregMonth}</Text></Text>
          )}
          <Text style={styles.resultDivider}>────────────────────────</Text>
          <Text style={styles.resultLine}>Günlük İhtiyaç:</Text>
          <View style={styles.resultItemRow}>
            <Text style={styles.resultLine}>  KM: <Text style={styles.resultVal}>{result.ihtiyac.KM} kg</Text></Text>
            <TouchableOpacity onPress={() => showInfo('KM')} style={styles.infoButton}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.resultItemRow}>
            <Text style={styles.resultLine}>  HP: <Text style={styles.resultVal}>{result.ihtiyac.HP} g</Text></Text>
            <TouchableOpacity onPress={() => showInfo('HP')} style={styles.infoButton}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.resultItemRow}>
            <Text style={styles.resultLine}>  NE: <Text style={styles.resultVal}>{result.ihtiyac.NE} Mcal</Text></Text>
            <TouchableOpacity onPress={() => showInfo('NE')} style={styles.infoButton}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.resultLine}>Aylık İhtiyaç:</Text>
          <Text style={styles.resultLine}>  KM: <Text style={styles.resultVal}>{(result.ihtiyac.KM*30).toFixed(1)} kg</Text></Text>
          <Text style={styles.resultLine}>  HP: <Text style={styles.resultVal}>{(result.ihtiyac.HP*30).toFixed(1)} g</Text></Text>
          <Text style={styles.resultLine}>  NE: <Text style={styles.resultVal}>{(result.ihtiyac.NE*30).toFixed(1)} Mcal</Text></Text>
          <Text style={styles.resultLine}>Yıllık İhtiyaç:</Text>
          <Text style={styles.resultLine}>  KM: <Text style={styles.resultVal}>{(result.ihtiyac.KM*365).toFixed(1)} kg</Text></Text>
          <Text style={styles.resultLine}>  HP: <Text style={styles.resultVal}>{(result.ihtiyac.HP*365).toFixed(1)} g</Text></Text>
          <Text style={styles.resultLine}>  NE: <Text style={styles.resultVal}>{(result.ihtiyac.NE*365).toFixed(1)} Mcal</Text></Text>
          <Text style={[styles.resultTitle, {marginTop: 12}]}>🧾 Örnek Yem Reçetesi</Text>
          {result.yem.recete.map((yem: any, i: number) => (
            <Text key={i} style={styles.resultLine}>{yem.label}: <Text style={styles.resultVal}>{yem.miktar} kg</Text></Text>
          ))}
          <Text style={styles.resultLine}>Toplam KM: <Text style={styles.resultVal}>{result.yem.toplam.KM.toFixed(2)} kg</Text></Text>
          <Text style={styles.resultLine}>Toplam HP: <Text style={styles.resultVal}>{result.yem.toplam.HP.toFixed(2)} g</Text></Text>
          <Text style={styles.resultLine}>Toplam NE: <Text style={styles.resultVal}>{result.yem.toplam.NE.toFixed(2)} Mcal</Text></Text>
          <View style={styles.resultItemRow}>
            <Text style={styles.resultLine}>  Ca: <Text style={styles.resultVal}>{result.ihtiyac.Ca} g</Text></Text>
            <TouchableOpacity onPress={() => showInfo('Ca')} style={styles.infoButton}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.resultItemRow}>
            <Text style={styles.resultLine}>  P: <Text style={styles.resultVal}>{result.ihtiyac.P} g</Text></Text>
            <TouchableOpacity onPress={() => showInfo('P')} style={styles.infoButton}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.resultLine}>Aylık İhtiyaç:</Text>
          <Text style={styles.resultLine}>  KM: <Text style={styles.resultVal}>{(result.ihtiyac.KM*30).toFixed(1)} kg</Text></Text>
          <Text style={styles.resultLine}>  HP: <Text style={styles.resultVal}>{(result.ihtiyac.HP*30).toFixed(1)} g</Text></Text>
          <Text style={styles.resultLine}>  NE: <Text style={styles.resultVal}>{(result.ihtiyac.NE*30).toFixed(1)} Mcal</Text></Text>
          <Text style={styles.resultLine}>  Ca: <Text style={styles.resultVal}>{(result.ihtiyac.Ca*30).toFixed(1)} g</Text></Text>
          <Text style={styles.resultLine}>  P: <Text style={styles.resultVal}>{(result.ihtiyac.P*30).toFixed(1)} g</Text></Text>
          <Text style={styles.resultLine}>Yıllık İhtiyaç:</Text>
          <Text style={styles.resultLine}>  KM: <Text style={styles.resultVal}>{(result.ihtiyac.KM*365).toFixed(1)} kg</Text></Text>
          <Text style={styles.resultLine}>  HP: <Text style={styles.resultVal}>{(result.ihtiyac.HP*365).toFixed(1)} g</Text></Text>
          <Text style={styles.resultLine}>  NE: <Text style={styles.resultVal}>{(result.ihtiyac.NE*365).toFixed(1)} Mcal</Text></Text>
          <Text style={styles.resultLine}>  Ca: <Text style={styles.resultVal}>{(result.ihtiyac.Ca*365).toFixed(1)} g</Text></Text>
          <Text style={styles.resultLine}>  P: <Text style={styles.resultVal}>{(result.ihtiyac.P*365).toFixed(1)} g</Text></Text>
          <Text style={[styles.resultTitle, {marginTop: 12}]}>🧾 Günlük Yem Reçetesi</Text>
          {result.yem.recete.map((yem: any, i: number) => (
            <Text key={i} style={styles.resultLine}>{yem.label}: <Text style={styles.resultVal}>{yem.miktar} kg/gün</Text></Text>
          ))}
          <Text style={styles.resultLine}>Toplam KM: <Text style={styles.resultVal}>{result.yem.toplam.KM.toFixed(2)} kg/gün</Text></Text>
          <Text style={styles.resultLine}>Toplam HP: <Text style={styles.resultVal}>{result.yem.toplam.HP.toFixed(2)} g/gün</Text></Text>
          <Text style={styles.resultLine}>Toplam NE: <Text style={styles.resultVal}>{result.yem.toplam.NE.toFixed(2)} Mcal/gün</Text></Text>
          
          <Text style={[styles.resultTitle, {marginTop: 16}]}>📅 Aylık Yem Reçetesi (30 gün)</Text>
          {result.yem.recete.map((yem: any, i: number) => (
            <Text key={i} style={styles.resultLine}>{yem.label}: <Text style={styles.resultVal}>{(yem.miktar*30).toFixed(1)} kg/ay</Text></Text>
          ))}
          <Text style={styles.resultLine}>Toplam KM: <Text style={styles.resultVal}>{(result.yem.toplam.KM*30).toFixed(1)} kg/ay</Text></Text>
          <Text style={styles.resultLine}>Toplam HP: <Text style={styles.resultVal}>{(result.yem.toplam.HP*30).toFixed(1)} g/ay</Text></Text>
          <Text style={styles.resultLine}>Toplam NE: <Text style={styles.resultVal}>{(result.yem.toplam.NE*30).toFixed(1)} Mcal/ay</Text></Text>
          
          <Text style={[styles.resultTitle, {marginTop: 16}]}>📆 Yıllık Yem Reçetesi (365 gün)</Text>
          {result.yem.recete.map((yem: any, i: number) => (
            <Text key={i} style={styles.resultLine}>{yem.label}: <Text style={styles.resultVal}>{(yem.miktar*365).toFixed(1)} kg/yıl</Text></Text>
          ))}
          <Text style={styles.resultLine}>Toplam KM: <Text style={styles.resultVal}>{(result.yem.toplam.KM*365).toFixed(1)} kg/yıl</Text></Text>
          <Text style={styles.resultLine}>Toplam HP: <Text style={styles.resultVal}>{(result.yem.toplam.HP*365).toFixed(1)} g/yıl</Text></Text>
          <Text style={styles.resultLine}>Toplam NE: <Text style={styles.resultVal}>{(result.yem.toplam.NE*365).toFixed(1)} Mcal/yıl</Text></Text>
          
          <Text style={[styles.resultLine, {marginTop: 16}]}>Eksik/Fazla Analizi (Günlük):</Text>
          <Text style={[styles.resultLine, { color: Math.abs(result.yem.eksikFazla.KM) < 0.1 ? '#2e7d32' : '#e53935' }]}>KM: {result.yem.eksikFazla.KM} kg/gün</Text>
          <Text style={[styles.resultLine, { color: Math.abs(result.yem.eksikFazla.HP) < 1 ? '#2e7d32' : '#e53935' }]}>HP: {result.yem.eksikFazla.HP} g/gün</Text>
          <Text style={[styles.resultLine, { color: Math.abs(result.yem.eksikFazla.NE) < 0.1 ? '#2e7d32' : '#e53935' }]}>NE: {result.yem.eksikFazla.NE} Mcal/gün</Text>
        </View>
      )}
      {result && result.hata && (
        <Text style={{ color: 'red', marginTop: 20 }}>{result.hata}</Text>
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

      {/* Bilgi Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showInfoModal}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>{infoContent.title}</Text>
              <TouchableOpacity 
                onPress={() => setShowInfoModal(false)}
                style={styles.infoModalCloseButton}
              >
                <Text style={styles.infoModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.infoModalDescription}>{infoContent.description}</Text>
            <TouchableOpacity 
              style={styles.infoModalOkButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoModalOkText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Yem Seçimi Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showYemModal}
        onRequestClose={() => setShowYemModal(false)}
      >
        <View style={styles.yemModalOverlay}>
          <View style={styles.yemModalContent}>
            <View style={styles.yemModalHeader}>
              <Text style={styles.yemModalTitle}>🌾 Elimdeki Yemler</Text>
              <TouchableOpacity 
                onPress={() => setShowYemModal(false)}
                style={styles.yemModalCloseButton}
              >
                <Text style={styles.yemModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.yemListContainer}>
              {availableYemler.map((yem: any) => (
                <TouchableOpacity
                  key={yem.id}
                  style={[
                    styles.yemItem,
                    selectedYemler.find((item: any) => item.id === yem.id) && styles.yemItemSelected
                  ]}
                  onPress={() => toggleYemSelection(yem)}
                >
                  <View style={styles.yemItemContent}>
                    <Text style={styles.yemItemName}>{yem.ad}</Text>
                    <Text style={styles.yemItemCategory}>{yem.kategori}</Text>
                    <Text style={styles.yemItemAmount}>{yem.miktar} {yem.birim}</Text>
                  </View>
                  <View style={styles.yemItemCheckbox}>
                    {selectedYemler.find((item: any) => item.id === yem.id) && (
                      <Text style={styles.yemItemCheckmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.yemModalFooter}>
              <Text style={styles.selectedYemCount}>
                {selectedYemler.length} yem seçildi
              </Text>
              <TouchableOpacity 
                style={[styles.yemModalButton, selectedYemler.length === 0 && styles.yemModalButtonDisabled]}
                onPress={() => {
                  if (selectedYemler.length > 0) {
                    calculateCustomRation();
                    setShowYemModal(false);
                  }
                }}
                disabled={selectedYemler.length === 0}
              >
                <Text style={styles.yemModalButtonText}>Rasyonu Hesapla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { 
    flexGrow: 1, 
    backgroundColor: '#f5f7fb',
    paddingBottom: 40 
  },
  container: { 
    flex: 1, 
    alignItems: 'center', 
    backgroundColor: 'transparent', 
    padding: 20 
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20
  },
  title: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    marginTop: 20, 
    marginBottom: 12, 
    color: '#ffffff', 
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6
  },
  subtitle: { 
    fontSize: 18, 
    color: '#2c3e50', 
    textAlign: 'center', 
    marginBottom: 16,
    fontWeight: '600',
    lineHeight: 24
  },
  titleDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  decorationText: {
    fontSize: 24,
    marginHorizontal: 8,
    color: 'rgba(255,255,255,0.8)'
  },
  card: { 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 24, 
    padding: 28, 
    marginBottom: 24, 
    width: '100%', 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12,
    borderWidth: 0,
    backdropFilter: 'blur(10px)'
  },
  label: { 
    fontSize: 18, 
    color: '#2c3e50', 
    marginBottom: 8, 
    marginTop: 12, 
    fontWeight: '700' 
  },
  sectionTitle: { 
    fontSize: 18, 
    color: '#0a7ea4', 
    marginBottom: 8, 
    marginTop: 16, 
    fontWeight: '800',
    textAlign: 'center'
  },
  sectionSubtitle: { 
    fontSize: 13, 
    color: '#7f8c8d', 
    marginBottom: 12, 
    fontStyle: 'italic', 
    textAlign: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.2)'
  },
  emojiRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 20,
    flexWrap: 'wrap'
  },
  emojiButton: { 
    alignItems: 'center', 
    marginHorizontal: 6, 
    marginVertical: 6,
    padding: 16, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.8)', 
    borderWidth: 2, 
    borderColor: 'rgba(52, 152, 219, 0.3)',
    minWidth: 80,
    elevation: 4,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  emojiButtonActive: { 
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
    elevation: 8,
    shadowOpacity: 0.3,
    transform: [{ scale: 1.02 }]
  },
  emoji: { 
    fontSize: 36,
    marginBottom: 4
  },
  emojiLabel: { 
    color: '#2c3e50', 
    fontSize: 12, 
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center'
  },
  emojiLabelActive: { 
    color: '#ffffff', 
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  inputTouchable: { 
    borderWidth: 2, 
    borderColor: 'rgba(52, 152, 219, 0.3)', 
    borderRadius: 16, 
    padding: 18, 
    marginVertical: 10, 
    backgroundColor: '#ffffff', 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 0
  },
  inputText: { 
    fontSize: 18, 
    color: '#2c3e50',
    flex: 1,
    fontWeight: '500'
  },
  inputIcon: { 
    fontSize: 24,
    marginLeft: 12,
    color: '#3498db'
  },
  button: { 
    marginTop: 32, 
    width: '100%', 
    elevation: 15, 
    shadowColor: '#e74c3c', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.6, 
    shadowRadius: 15,
    borderRadius: 24,
    overflow: 'hidden'
  },
  buttonGradient: {
    backgroundColor: '#e74c3c',
    paddingVertical: 28, 
    paddingHorizontal: 24,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 2
  },
  buttonIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
    marginRight: 12
  },
  buttonTextContainer: {
    flex: 1,
    alignItems: 'center'
  },
  buttonText: { 
    color: '#ffffff', 
    fontSize: 24, 
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    marginBottom: 4,
    letterSpacing: 0.5
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 0.3
  },
  buttonArrowContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
    marginLeft: 12
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ skewX: '-25deg' }],
    zIndex: 1
  },
  buttonParticles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 3
  },
  particle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  resultBox: { 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 24, 
    padding: 24, 
    marginTop: 24, 
    borderWidth: 0, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#3498db'
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  resultTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    marginBottom: 8, 
    textAlign: 'center'
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.2)'
  },
  resultDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  resultDivider: { 
    textAlign: 'center', 
    color: '#bdc3c7', 
    marginVertical: 12,
    fontSize: 18,
    fontWeight: 'bold'
  },
  resultLine: { 
    fontSize: 16, 
    color: '#2c3e50', 
    marginBottom: 4,
    fontWeight: '500'
  },
  resultVal: { 
    fontWeight: 'bold', 
    color: '#e67e22',
    fontSize: 17
  },
  // Arka plan dekoratif öğeler
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  backgroundShape1: { 
    position: 'absolute', 
    top: -60, 
    left: -60, 
    width: 200, 
    height: 200, 
    backgroundColor: 'rgba(52, 152, 219, 0.1)', 
    borderRadius: 100, 
    opacity: 0.6 
  },
  backgroundShape2: { 
    position: 'absolute', 
    top: -40, 
    right: -50, 
    width: 150, 
    height: 150, 
    backgroundColor: 'rgba(46, 204, 113, 0.1)', 
    borderRadius: 75, 
    opacity: 0.5 
  },
  backgroundShape3: { 
    position: 'absolute', 
    bottom: -50, 
    left: -50, 
    width: 180, 
    height: 180, 
    backgroundColor: 'rgba(241, 196, 15, 0.1)', 
    borderRadius: 90, 
    opacity: 0.4 
  },
  backgroundShape4: { 
    position: 'absolute', 
    bottom: -30, 
    right: -30, 
    width: 160, 
    height: 160, 
    backgroundColor: 'rgba(155, 89, 182, 0.1)', 
    borderRadius: 80, 
    opacity: 0.3 
  },
  backgroundLine1: { 
    position: 'absolute', 
    top: 150, 
    left: 0, 
    right: 0, 
    height: 2, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    opacity: 0.3 
  },
  backgroundLine2: { 
    position: 'absolute', 
    bottom: 150, 
    left: 0, 
    right: 0, 
    height: 2, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    opacity: 0.3 
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 28,
    padding: 36,
    width: width * 0.85,
    maxWidth: 420,
    borderWidth: 0,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    borderLeftWidth: 6,
    borderLeftColor: '#3498db'
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.2)'
  },
  modalInput: {
    borderWidth: 3,
    borderColor: 'rgba(52, 152, 219, 0.3)',
    borderRadius: 20,
    padding: 24,
    fontSize: 26,
    color: '#2c3e50',
    backgroundColor: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '600',
    elevation: 4,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16
  },
  modalButtonCancel: {
    backgroundColor: 'linear-gradient(135deg, #e74c3c, #c0392b)',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flex: 0.45,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  modalButtonSave: {
    backgroundColor: 'linear-gradient(135deg, #3498db, #2980b9)',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flex: 0.45,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  
  // Bilgi Modalı Stilleri
  resultItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  infoButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 12,
    padding: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)'
  },
  infoIcon: {
    fontSize: 16,
    color: '#3498db'
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  infoModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1
  },
  infoModalCloseButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoModalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  infoModalDescription: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'justify'
  },
  infoModalOkButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  infoModalOkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  // Yem Seçimi Modalı Stilleri
  buttonContainer: {
    gap: 12
  },
  customButton: {
    marginTop: 0
  },
  customButtonGradient: {
    backgroundColor: '#27ae60'
  },
  yemModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  yemModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  yemModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  yemModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1
  },
  yemModalCloseButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  yemModalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  yemListContainer: {
    maxHeight: 300,
    marginBottom: 20
  },
  yemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  yemItemSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#27ae60'
  },
  yemItemContent: {
    flex: 1
  },
  yemItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4
  },
  yemItemCategory: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2
  },
  yemItemAmount: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600'
  },
  yemItemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  yemItemCheckmark: {
    color: '#27ae60',
    fontSize: 16,
    fontWeight: 'bold'
  },
  yemModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  selectedYemCount: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600'
  },
  yemModalButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  yemModalButtonDisabled: {
    backgroundColor: '#bdc3c7',
    elevation: 0,
    shadowOpacity: 0
  },
  yemModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
});