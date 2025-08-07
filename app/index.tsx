import { Redirect } from 'expo-router';

export default function Index() {
  // Uygulama açıldığında login ekranına yönlendir
  return <Redirect href="/login" />;
}