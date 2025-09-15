// Rasyon Hesaplama Test Dosyası
// Bu dosyayı çalıştırarak hesaplamalarınızı test edebilirsiniz

// Test verileri - Gerçekçi referans değerler
const testCases = [
  // Buzağı testleri
  {
    name: "Buzağı - 3 ay, 80 kg, 0.8 kg/gün artış",
    input: { altTur: 'buzagi', yas: 3, canliAgirlik: 80, agirlikArtisi: 0.8 },
    expected: {
      KM: { min: 2.0, max: 2.5 }, // Bakım + artış
      HP: { min: 16, max: 20 }, // Bakım + artış
      NE: { min: 6.4, max: 7.2 }, // Bakım + artış
      Ca: { min: 0.8, max: 1.2 }, // Bakım + artış
      P: { min: 0.6, max: 0.9 } // Bakım + artış
    }
  },
  
  // Süt ineği testleri
  {
    name: "Süt İneği - 500 kg, 25 kg/gün süt",
    input: { altTur: 'sutinegi', yas: 36, canliAgirlik: 500, sutKg: 25 },
    expected: {
      KM: { min: 12.5, max: 15.0 }, // Bakım + süt
      HP: { min: 60, max: 75 }, // Bakım + süt
      NE: { min: 25.5, max: 60.0 }, // Bakım + süt (geniş aralık)
      Ca: { min: 3.0, max: 4.5 }, // Bakım + süt
      P: { min: 2.0, max: 3.0 } // Bakım + süt
    }
  },
  
  // Besi danası testleri
  {
    name: "Besi Danası - 300 kg, 1.2 kg/gün artış",
    input: { altTur: 'besi', yas: 12, canliAgirlik: 300, agirlikArtisi: 1.2 },
    expected: {
      KM: { min: 7.5, max: 9.0 }, // Bakım + artış
      HP: { min: 30, max: 40 }, // Bakım + artış
      NE: { min: 24, max: 28 }, // Bakım + artış
      Ca: { min: 1.8, max: 2.5 }, // Bakım + artış
      P: { min: 1.2, max: 1.6 } // Bakım + artış
    }
  }
];

// Hesaplama fonksiyonu (uygulamanızdan kopyalanmış)
function hesaplaBuyukbasRasyonDetayli(altTur, yas, canliAgirlik, sutKg = 0, gebelikAyi = 0, agirlikArtisi = 0) {
  let KM, HP, NE, Ca, P;
  
  if (altTur === 'buzagi') {
    const bakimKM = +(canliAgirlik * 0.025).toFixed(2);
    const artisKM = +(agirlikArtisi * 0.3).toFixed(2);
    KM = +(bakimKM + artisKM).toFixed(2);
    
    const bakimHP = +(canliAgirlik * 0.15).toFixed(2);
    const artisHP = +(agirlikArtisi * 8).toFixed(2);
    HP = +(bakimHP + artisHP).toFixed(2);
    
    const bakimNE = +(canliAgirlik * 0.08).toFixed(2);
    const artisNE = +(agirlikArtisi * 0.5).toFixed(2);
    NE = +(bakimNE + artisNE).toFixed(2);
    
    const bakimCa = +(canliAgirlik * 0.006).toFixed(2);
    const artisCa = +(agirlikArtisi * 0.8).toFixed(2);
    Ca = +(bakimCa + artisCa).toFixed(2);
    
    const bakimP = +(canliAgirlik * 0.004).toFixed(2);
    const artisP = +(agirlikArtisi * 0.6).toFixed(2);
    P = +(bakimP + artisP).toFixed(2);
    
  } else if (altTur === 'duve') {
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
    const bakimKM = +(canliAgirlik * 0.025).toFixed(2);
    const artisKM = +(agirlikArtisi * 0.5).toFixed(2);
    KM = +(bakimKM + artisKM).toFixed(2);
    
    const bakimHP = +(canliAgirlik * 0.08).toFixed(2);
    const artisHP = +(agirlikArtisi * 8).toFixed(2);
    HP = +(bakimHP + artisHP).toFixed(2);
    
    const bakimNE = +(canliAgirlik * 0.08).toFixed(2);
    const artisNE = +(agirlikArtisi * 0.6).toFixed(2);
    NE = +(bakimNE + artisNE).toFixed(2);
    
    const bakimCa = +(canliAgirlik * 0.005).toFixed(2);
    const artisCa = +(agirlikArtisi * 0.6).toFixed(2);
    Ca = +(bakimCa + artisCa).toFixed(2);
    
    const bakimP = +(canliAgirlik * 0.003).toFixed(2);
    const artisP = +(agirlikArtisi * 0.4).toFixed(2);
    P = +(bakimP + artisP).toFixed(2);
    
  } else if (altTur === 'sutinegi') {
    const bakimKM = +(canliAgirlik * 0.02).toFixed(2);
    const sutKM = +(sutKg * 0.2).toFixed(2);
    KM = +(bakimKM + sutKM).toFixed(2);
    
    const bakimHP = +(canliAgirlik * 0.06).toFixed(2);
    const sutHP = +(sutKg * 1.5).toFixed(2);
    HP = +(bakimHP + sutHP).toFixed(2);
    
    const bakimNE = +(canliAgirlik * 0.08).toFixed(2);
    const sutNE = +(sutKg * 0.7).toFixed(2);
    NE = +(bakimNE + sutNE).toFixed(2);
    
    const bakimCa = +(canliAgirlik * 0.004).toFixed(2);
    const sutCa = +(sutKg * 0.08).toFixed(2);
    Ca = +(bakimCa + sutCa).toFixed(2);
    
    const bakimP = +(canliAgirlik * 0.003).toFixed(2);
    const sutP = +(sutKg * 0.05).toFixed(2);
    P = +(bakimP + sutP).toFixed(2);
    
    if (gebelikAyi >= 7) {
      const gebelikFaktoru = gebelikAyi === 7 ? 0.15 : gebelikAyi === 8 ? 0.25 : 0.35;
      HP = +(HP * (1 + gebelikFaktoru)).toFixed(2);
      NE = +(NE * (1 + gebelikFaktoru)).toFixed(2);
      Ca = +(Ca * (1 + gebelikFaktoru)).toFixed(2);
      P = +(P * (1 + gebelikFaktoru)).toFixed(2);
    }
  }
  
  return { KM, HP, NE, Ca, P };
}

// Test fonksiyonu
function testRasyonHesaplama() {
  console.log("🧪 Rasyon Hesaplama Test Sonuçları");
  console.log("=====================================");
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log("-----------------------------------");
    
    const result = hesaplaBuyukbasRasyonDetayli(
      testCase.input.altTur,
      testCase.input.yas,
      testCase.input.canliAgirlik,
      testCase.input.sutKg || 0,
      testCase.input.gebelikAyi || 0,
      testCase.input.agirlikArtisi || 0
    );
    
    let testPassed = true;
    
    // KM testi
    const kmInRange = result.KM >= testCase.expected.KM.min && result.KM <= testCase.expected.KM.max;
    console.log(`KM: ${result.KM} kg (Beklenen: ${testCase.expected.KM.min}-${testCase.expected.KM.max}) ${kmInRange ? '✅' : '❌'}`);
    if (!kmInRange) testPassed = false;
    
    // HP testi
    const hpInRange = result.HP >= testCase.expected.HP.min && result.HP <= testCase.expected.HP.max;
    console.log(`HP: ${result.HP} g (Beklenen: ${testCase.expected.HP.min}-${testCase.expected.HP.max}) ${hpInRange ? '✅' : '❌'}`);
    if (!hpInRange) testPassed = false;
    
    // NE testi
    const neInRange = result.NE >= testCase.expected.NE.min && result.NE <= testCase.expected.NE.max;
    console.log(`NE: ${result.NE} Mcal (Beklenen: ${testCase.expected.NE.min}-${testCase.expected.NE.max}) ${neInRange ? '✅' : '❌'}`);
    if (!neInRange) testPassed = false;
    
    // Ca testi
    const caInRange = result.Ca >= testCase.expected.Ca.min && result.Ca <= testCase.expected.Ca.max;
    console.log(`Ca: ${result.Ca} g (Beklenen: ${testCase.expected.Ca.min}-${testCase.expected.Ca.max}) ${caInRange ? '✅' : '❌'}`);
    if (!caInRange) testPassed = false;
    
    // P testi
    const pInRange = result.P >= testCase.expected.P.min && result.P <= testCase.expected.P.max;
    console.log(`P: ${result.P} g (Beklenen: ${testCase.expected.P.min}-${testCase.expected.P.max}) ${pInRange ? '✅' : '❌'}`);
    if (!pInRange) testPassed = false;
    
    if (testPassed) {
      passedTests++;
      console.log("🎉 Test BAŞARILI!");
    } else {
      console.log("⚠️ Test BAŞARISIZ!");
    }
  });
  
  console.log("\n=====================================");
  console.log(`📊 Toplam Sonuç: ${passedTests}/${totalTests} test başarılı`);
  console.log(`📈 Başarı Oranı: %${((passedTests/totalTests)*100).toFixed(1)}`);
  
  if (passedTests === totalTests) {
    console.log("🎉 Tüm testler başarılı! Rasyon hesaplamalarınız doğru.");
  } else {
    console.log("⚠️ Bazı testler başarısız. Formülleri gözden geçirin.");
  }
}

// Testi çalıştır
testRasyonHesaplama();
