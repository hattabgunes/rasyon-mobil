import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const { width } = Dimensions.get('window');

export default function PremiumPurchase() {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '🌟 Premium Satın Al',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffd700',
      },
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#ffd700',
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginLeft: 16,
            backgroundColor: '#f8f9fa',
            borderRadius: 12,
            padding: 8,
            borderWidth: 1,
            borderColor: '#ffd700',
            shadowColor: '#ffd700',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#ffd700" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const plans = [
    {
      id: 'monthly',
      name: 'Aylık Plan',
      price: '29.99',
      currency: '₺',
      period: 'ay',
      popular: false,
      savings: null,
      features: [
        '✅ Sınırsız rasyon hesaplama',
        '✅ Detaylı raporlar',
        '✅ Yem önerileri',
        '✅ Geçmiş kayıtları',
        '✅ Öncelikli destek',
        '✅ Reklamsız deneyim'
      ]
    },
    {
      id: 'yearly',
      name: 'Yıllık Plan',
      price: '299.99',
      currency: '₺',
      period: 'yıl',
      popular: true,
      savings: '2 ay bedava',
      features: [
        '✅ Sınırsız rasyon hesaplama',
        '✅ Detaylı raporlar',
        '✅ Yem önerileri',
        '✅ Geçmiş kayıtları',
        '✅ Öncelikli destek',
        '✅ Reklamsız deneyim',
        '🎁 Özel yem veritabanı',
        '🎁 Excel export'
      ]
    },
    {
      id: 'lifetime',
      name: 'Ömür Boyu',
      price: '999.99',
      currency: '₺',
      period: 'tek seferlik',
      popular: false,
      savings: 'En iyi değer',
      features: [
        '✅ Sınırsız rasyon hesaplama',
        '✅ Detaylı raporlar',
        '✅ Yem önerileri',
        '✅ Geçmiş kayıtları',
        '✅ Öncelikli destek',
        '✅ Reklamsız deneyim',
        '🎁 Özel yem veritabanı',
        '🎁 Excel export',
        '🎁 Tüm güncellemeler',
        '🎁 Öncelikli özellikler'
      ]
    }
  ];

  const handlePurchase = async (plan: any) => {
    Alert.alert(
      `🌟 ${plan.name} Satın Al`,
      `${plan.currency}${plan.price} değerinde ${plan.name} satın almak istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Satın Al',
          onPress: async () => {
            try {
              // Kullanıcıyı al
              const auth = getAuth(app);
              const user = auth.currentUser;
              
              if (!user) {
                Alert.alert('Hata', 'Kullanıcı bulunamadı!');
                return;
              }
              
              // Firestore'da premium durumunu güncelle
              const db = getFirestore(app);
              const userRef = doc(db, 'users', user.uid);
              
              const currentDate = new Date();
              let premiumEndDate = new Date();
              
              // Plan türüne göre bitiş tarihini hesapla
              if (plan.id === 'monthly') {
                premiumEndDate.setMonth(premiumEndDate.getMonth() + 1);
              } else if (plan.id === 'yearly') {
                premiumEndDate.setFullYear(premiumEndDate.getFullYear() + 1);
              } else if (plan.id === 'lifetime') {
                // Ömür boyu için çok uzak bir tarih
                premiumEndDate.setFullYear(premiumEndDate.getFullYear() + 100);
              }
              
              await updateDoc(userRef, {
                premium: true,
                premiumStart: currentDate,
                premiumEnd: premiumEndDate,
                premiumPlan: plan.name
              });
              
              Alert.alert(
                '🎉 Başarılı!',
                `${plan.name} başarıyla satın alındı! Premium özellikler artık kullanılabilir.`,
                [
                  {
                    text: 'Tamam',
                    onPress: () => {
                      // Ana sayfaya dön
                      router.replace('/ration-choice');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Premium satın alma hatası:', error);
              Alert.alert('Hata', 'Premium satın alma işlemi başarısız oldu!');
            }
          }
        }
      ]
    );
  };

  const getSelectedPlan = () => plans.find(p => p.id === selectedPlan);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌟 Premium'a Yükselt</Text>
          <Text style={styles.headerSubtitle}>
            Ücretsiz deneme süreniz doldu. Premium özellikleri kullanmak için bir plan seçin!
          </Text>
        </View>

        {/* Plan Seçimi */}
        <View style={styles.planSelector}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>🔥 Popüler</Text>
                </View>
              )}
              
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.currency}>{plan.currency}</Text>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>/{plan.period}</Text>
              </View>
              
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Seçilen Plan Detayları */}
        {getSelectedPlan() && (
          <View style={styles.planDetails}>
            <Text style={styles.detailsTitle}>📋 {getSelectedPlan()?.name} Özellikleri</Text>
            {getSelectedPlan()?.features.map((feature, index) => (
              <Text key={index} style={styles.featureText}>
                {feature}
              </Text>
            ))}
          </View>
        )}

        {/* Satın Alma Butonu */}
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={() => handlePurchase(getSelectedPlan())}
        >
          <Text style={styles.purchaseButtonText}>
            🚀 {getSelectedPlan()?.currency}{getSelectedPlan()?.price} ile Satın Al
          </Text>
        </TouchableOpacity>

        {/* Güvenlik Bilgisi */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityText}>
            🔒 Güvenli ödeme • 30 gün para iade garantisi • 7/24 destek
          </Text>
        </View>

        {/* Geri Dön Butonu */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#11181C',
    textAlign: 'center',
    lineHeight: 24,
  },
  planSelector: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#ffd700',
    backgroundColor: '#fffbf0',
  },
  planCardPopular: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#11181C',
    marginBottom: 15,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 15,
  },
  currency: {
    fontSize: 18,
    color: '#ffd700',
    fontWeight: 'bold',
  },
  price: {
    fontSize: 32,
    color: '#ffd700',
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  period: {
    fontSize: 16,
    color: '#687076',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 15,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#11181C',
    marginBottom: 8,
    lineHeight: 22,
  },
  purchaseButton: {
    backgroundColor: '#ffd700',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 30,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  purchaseButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  securityInfo: {
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  securityText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#687076',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

