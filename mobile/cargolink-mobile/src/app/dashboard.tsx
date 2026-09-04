import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

interface User {
  id: number;
  nom_complet: string;
  type_utilisateur: string;
  note_moyenne?: number;
}

interface Demande {
  id: number;
  marchandise: string;
  ville_depart: string;
  ville_arrivee: string;
  budget_final?: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [marchandise, setMarchandise] = useState('');
  const [villeDepart, setVilleDepart] = useState('');
  const [villeArrivee, setVilleArrivee] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, []);

  const charger = async () => {
    try {
      const token = await AsyncStorage.getItem('cargolink_token');
      const userData = await AsyncStorage.getItem('cargolink_user');
      if (!token) { router.replace('/connexion'); return; }
      if (userData) setUser(JSON.parse(userData));
      const res = await axios.get(API_URL + '/demandes/disponibles', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setDemandes(res.data);
    } catch (error) {
      console.log('Erreur charger dashboard:', error);
    }
  };

  const publierDemande = async () => {
    try {
      const token = await AsyncStorage.getItem('cargolink_token');
      await axios.post(API_URL + '/demandes', {
        marchandise,
        ville_depart: villeDepart,
        ville_arrivee: villeArrivee,
        date_souhaitee: '2026-12-01',
        poids_tonnes: 1,
        budget_final: parseInt(budget)
      }, { headers: { Authorization: 'Bearer ' + token } });
      Alert.alert('Succes', 'Demande publiee !');
      setMarchandise(''); setVilleDepart(''); setVilleArrivee(''); setBudget('');
      charger();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de publier la demande');
    }
  };

  const deconnecter = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titre}>Bonjour {user?.nom_complet}</Text>
        <TouchableOpacity onPress={deconnecter}>
          <Text style={styles.deconnexion}>Deconnecter</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={styles.input} placeholder="Marchandise" value={marchandise} onChangeText={setMarchandise} />
      <TextInput style={styles.input} placeholder="Ville depart" value={villeDepart} onChangeText={setVilleDepart} />
      <TextInput style={styles.input} placeholder="Ville arrivee" value={villeArrivee} onChangeText={setVilleArrivee} />
      <TextInput style={styles.input} placeholder="Budget FCFA" value={budget} onChangeText={setBudget} keyboardType="numeric" />
      <TouchableOpacity style={styles.btn} onPress={publierDemande}>
        <Text style={styles.btnTexte}>Publier la demande</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondaire} onPress={() => router.push('/mes-demandes')}>
        <Text style={styles.btnTexte}>Mes demandes</Text>
      </TouchableOpacity>
      <Text style={styles.sousTitre}>Demandes disponibles ({demandes.length})</Text>
      {demandes.map(item => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitre}>{item.marchandise}</Text>
          <Text>{item.ville_depart} → {item.ville_arrivee}</Text>
          <Text>Budget: {item.budget_final?.toLocaleString()} FCFA</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 50 },
  titre: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79' },
  sousTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginTop: 15, marginBottom: 10 },
  deconnexion: { color: 'red', fontSize: 14 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16 },
  btn: { backgroundColor: '#C55A11', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  btnSecondaire: { backgroundColor: '#1F4E79', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnTexte: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1F4E79' },
  cardTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 5 },
});
