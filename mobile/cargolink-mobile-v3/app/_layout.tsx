import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="inscription" />
      <Stack.Screen name="connexion" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="transporteurs" />
      <Stack.Screen name="mes-demandes" />
      <Stack.Screen name="mes-demandes-transporteur" />
    </Stack>
  );
}
