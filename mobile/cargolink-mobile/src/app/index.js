import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
export default function Index() {
    return (
        <View style={styles.container}>
            <Text style={styles.titre}>Cargolink Cameroun</Text>
            <Text style={styles.sousTitre}>Trouvez un camion en 5 minutes</Text>
            <TouchableOpacity style={styles.btnChargeur} onPress={() => router.push('/inscription')}>
                <Text style={styles.btnTexte}>Je suis chargeur</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnTransporteur} onPress={() => router.push('/inscription')}>
                <Text style={styles.btnTexteBleu}>Je suis transporteur</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnConnexion} onPress={() => router.push('/connexion')}>
                <Text style={styles.btnTexte}>Deja inscrit ? Se connecter</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1F4E79', alignItems: 'center', justifyContent: 'center', padding: 30 },
    titre: { fontSize: 32, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBotttom: 50 },
    sousTitre: { fontSize: 16, color: '#D6E4F0', textAlign: 'center', marginBottom: 50 },
    btnChargeur: { backgroundColor: '#C55A11', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 15 },
    btnTransporteur: { backgroundColor: 'white', padding: 15, borderRadius: 10, weidth: '100%', alignitems: 'center', marginBottom: 15, borderWidth: 2, borderColor: '#1F4E79' },
    btnConnexion: { backgroundColor: 'transparent', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#D6E4F0' },
    btnTexte: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    btnTexteBleu: { color: '#1f4e79', fontSize: 16, fontWeight: 'bold' },
});