import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

export default function Inscription() {
    const [nomComplet, setNomComplet] = useState('');
    const [email, setEmail] = useState('');
    const [telephone, setTelephone] = useState('');
    const [password, setPassword] = useState('');
    const [typeUtilisateur, setTypeUtilisateur] = useState('chargeur');

    const handleInscription = async () => {
        try {
            const res = await axios.post(API_URL + '/auth/inscription', {
                nom_complet: nomComplet,
                email,
                telephone,
                password,
                type_utilisateur: typeUtilisateur
        });
                router.push('/dashboard');
            } catch (err) {
                Alert.alert('Erreur', err.message || 'Inscription impossible');
            }
        };

        return (
            <View style={styles.container}>
            <Text style={styles.titre}>Inscription Cargolink</Text>
            <TextInput style={styles.input} placeholder="Nom complet" value={nomComplet} onChangeText={setNomComplet} />
            <TextInput style={styles.input} placeholder="Email (optionnel" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Telephone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.btn} onPress={handleInscription}>
            <Text style={styles.btnTexte}>S inscrire</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/connexion')}>
            <Text style={styles.lien}>Deja inscrit / Se connecter</Text>
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