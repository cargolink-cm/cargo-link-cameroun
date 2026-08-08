import { Stack } from 'expo-router';

// @ts-ignore
const defaultHandler = global.ErrorUtils?.getGlobalHandler?.();
// @ts-ignore
if (global.ErrorUtils) {
  // @ts-ignore
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    const msg = 'ERREUR: ' + (error?.message || 'inconnue') + '\n\nSTACK:\n' + (error?.stack || '');
    console.log(msg);
    alert(msg);
    if (defaultHandler) defaultHandler(error, isFatal);
  });
}

export default function Layout() {
  return (
    <Stack initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="inscription" options={{ headerShown: false }} />
      <Stack.Screen name="connexion" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="transporteurs" options={{ headerShown: false }} />
      <Stack.Screen name="mes-demandes" options={{ headerShown: false }} />
      <Stack.Screen name="mes-demandes-transporteur" options={{ headerShown: false }} />
    </Stack>
  );
}
