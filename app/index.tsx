import { Redirect } from 'expo-router';

export default function Index() {
  // Uygulama açıldığında direkt kullanıcı girişi ekranına yönlendir
  return <Redirect href="/user-login" />;
}