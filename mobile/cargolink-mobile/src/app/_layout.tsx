import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="inscription" options={{ headerShown: false }} />
      <Stack.Screen name="connexion" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="transporteur" options={{ headerShown: false }} />
      <Stack.Screen name="mes-demandes" options={{ headerShown: false }} />
      <Stack.Screen name="mes-demandes-transporteur" options={{ headerShown: false }} />
    </Stack>
  );
}
