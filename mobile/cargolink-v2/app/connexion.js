import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

export default function Connexion() {
    const navigation = useNavigation();
    const [identifiant, setIdentifiant] = useState('');
    const [password, setPassword] = useState('');

    const handleConnexion = async () => {
        try {
            const res = await axios.post(API_URL + '/auth/connexion', {
                telephone: identifiant,
                email: identifiant,
                password
            });
            await AsyncStorage.setItem('cargolink_token', res.data.token);
            const userData = res.data.user;
            await AsyncStorage.setItem('cargolink_user', JSON.stringify(userData));
            if (userData.type_utilisateur === 'transporteur') {
                navigation.navigate('/transporteur');
            } else {
              navigation.navigate('/dashboard');
            }
        } catch (err) {
            Alert.alert('Erreur', 'Identifiants incorrects');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.titre}>Connexion Cargolink</Text>
            <TextInput style={styles.input} placeholder="Email ou telephone" value={identifiant} onChangeText={setIdentifiant} />
            <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.btn} onPress={handleConnexion}>
                <Text style={styles.btnTexte}>Se connecter</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('/inscription')}>
                    <Text style={styles.lien}>Pas encore inscrit ? S incrire</Text>
                    </TouchableOpacity>
                    </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white', padding: 30, justifyContent: 'center' },
    titre: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 30, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    btn: { backgroundColor: '#1F4E79', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    btnTexte: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    lien: { color: '#1F4E79', textAlign: 'center', marginTop: 10 },
});