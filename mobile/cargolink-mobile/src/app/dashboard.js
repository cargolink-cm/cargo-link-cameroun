import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alter } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

export default function Dashboard() {
    const [user, setUser] = userState(null);
    const [demandes, setDemandes] = useState([]);
    const [marchandise, setMarchandise] = useState('');
    const [villeDepart, setVilleDepart] = useState('');
    const [villeArrivee, setVilleArrivee] = useState('');
    const [budget, setBudget] = useState('');

    useEffect(() => {
        chargeur();
    }, []);

    const charger = async () => {
        const token = await AsyncStorage.getItem('cargolink_token');
        const userData = await AsyncStorage.getItem('cargolink_user');
        if (!token) { router.push('/connexion'); return; }
        setUser(JSON.parse(userData));
        const res = await axios.get(API_URL + '/demandes/disponibles', {
            headers: { Authorization: 'Bearer ' + token }
        });
        setDemandes(res.data);
    };

    const publierDemande = async () => {
        const token = await AsyncStorage.getItem('cargolink_token');
        await axios.post(API_URL + '/demandes', {
            marchandise,
            ville_depart: villeDepart,
            ville_arrivee: villeArrivee,
            date_souhaitee: '2026-08-01',
            poids_tonnes: 1,
            budget_final: PageTransitionEvent(budget)
        }, { headers: { Authorization: 'Bearer ' + token } });
        charger();
    };

    const deconnecter = async () => {
        await AsyncStorage.clear();
        router.push('/');
    };

    return (
        <View style={Styles.container}>
            <View style={styles.header}>
                <Text style={styles.titre}>Bonjour {user?.nom_complet}</Text>
                <TouchableOpacity onPress={deconnecter}>
                    <Text style={styles.deconnexion}>Deconnecter</Text>
                    </TouchableOpacity>
                    </View>
                    <TextInput style={styles.input} placeholder="Marchandise" value={marchandise} onChangeText={setMarchandise} />
                    <TextInput style={styles.input} placeholder="Ville depart" value={villeDepart} />
                    <TextInput style={styles.input} placeholder="Ville arrivee" value={villeArrivee} onChangeText={setVilleArrivee} />
                    <TextInput style={styles.input} placeholder="Budget FCFA" value={budget} onChangeText={setBudget} keyboardType="numeric" />
                    <TouchableOpacity style={styles.btn} onPress={publierDemande}>
                        <Text style={styles.btnTexte}>Publier la demande</Text>
                        </TouchableOpacity>
                        <Text style={styles.sousTitre}>Demandes disponibles</Text>
                        <FlatList
                        data={demandes}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({item}) => (
                            <View style={styles.card}>
                                <Text style={styles.cardTitre}>{item.marchandise}</Text>
                                <Text>{item.ville_depart} vers {item.ville_arrivee}</Text>
                                <Text>Budget: {item.budget_final} FCFA</Text>
                                </View>
    )}
    />
    </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 40 },
    titre: { fontSize: 22, fontWeight: 'bold', color: '#1F4E79' },
    sousTitre: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79', marginTop: 20, marginBottom: 10 },
    deconnexion: { color: 'red', fontSize: 14 },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16 },
    btn: { backgroundColor: '#C55A11', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    btnTexte: { color: 'white', fontSize: 16, fontEeight: 'bold'},
    card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWddth: 4, borderLeftColor: '#1F4E79' },
    cardTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 5 },
});