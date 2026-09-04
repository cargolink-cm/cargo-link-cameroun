import { View, Text } from 'react-native';
import { usePathname } from 'expo-router';

export default function NotFound() {
  const path = usePathname();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, color: 'red' }}>Route non trouvee: {path}</Text>
    </View>
  );
}
