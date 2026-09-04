import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

interface User { id: number; nom_complet: string; note_moyenne?: number; }
interface Demande { id: number; marchandise: string; ville_depart: string; ville_arrivee: string; budget_final?: number; type_camion_souhaite?: string; }
interface DemandeAcceptee { id: number; marchandise: string; ville_depart: string; ville_arrivee: string; montant_final?: number; contact_debloque?: boolean; chargeur_tel?: string; }

export default function Transporteurs() {
  const [user, setUser] = useState<User | null>(null);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [mesDemandesAcceptees, setMesDemandesAcceptees] = useState<DemandeAcceptee[]>([]);
  const [montants, setMontants] = useState<{ [key: number]: string }>({});

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
      const [res1, res2] = await Promise.all([
        axios.get(API_URL + '/demandes/disponibles', { headers: { Authorization: 'Bearer ' + token } }),
        axios.get(API_URL + '/demandes/mes-demandes-transporteur', { headers: { Authorization: 'Bearer ' + token } })
      ]);
      setDemandes(res1.data);
      setMesDemandesAcceptees(res2.data);
    } catch (err) {
      console.log('Erreur charger transporteur:', err);
    }
  };

  const accepter = async (id: number) => {
    if (!montants[id]) { Alert.alert('Erreur', 'Saisissez un montant'); return; }
    try {
      const token = await AsyncStorage.getItem('cargolink_token');
      await axios.put(API_URL + '/demandes/' + id + '/accepter',
        { montant_final: parseInt(montants[id]) },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      Alert.alert('Succes', 'Demande acceptee !');
      charger();
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'accepter");
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
      <Text style={styles.noteMoyenne}>Note moyenne: {user?.note_moyenne ? user.note_moyenne + '/5' : 'Pas encore note'}</Text>
      <TouchableOpacity style={styles.btnSecondaire} onPress={() => router.push('/mes-demandes-transporteur')}>
        <Text style={styles.btnTexte}>Mes demandes acceptees</Text>
      </TouchableOpacity>
      <Text style={styles.sousTitre}>Demandes disponibles ({demandes.length})</Text>
      {demandes.map(item => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitre}>{item.marchandise}</Text>
          <Text>{item.ville_depart} → {item.ville_arrivee}</Text>
          <Text>Budget: {item.budget_final?.toLocaleString()} FCFA</Text>
          <Text>Camion: {item.type_camion_souhaite || 'Tout type'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre montant FCFA"
            keyboardType="numeric"
            value={montants[item.id] || ''}
            onChangeText={v => setMontants({ ...montants, [item.id]: v })}
          />
          {montants[item.id] && (
            <View style={styles.recap}>
              <Text style={styles.recapOrange}>Commission EXDIVIA (7%): {Math.round(parseInt(montants[item.id]) * 0.07).toLocaleString()} FCFA</Text>
              <Text style={styles.recapVert}>Vous percevrez: {Math.round(parseInt(montants[item.id]) * 0.93).toLocaleString()} FCFA</Text>
            </View>
          )}
          <TouchableOpacity style={styles.btn} onPress={() => accepter(item.id)}>
            <Text style={styles.btnTexte}>Accepter cette demande</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, marginTop: 50 },
  titre: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79' },
  noteMoyenne: { fontSize: 14, color: '#555', marginBottom: 15 },
  sousTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginTop: 10, marginBottom: 10 },
  deconnexion: { color: 'red', fontSize: 14 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1F4E79' },
  cardTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, marginTop: 8, fontSize: 16 },
  recap: { backgroundColor: '#D6E4F0', padding: 8, borderRadius: 6, marginTop: 5 },
  recapOrange: { fontSize: 13, color: '#C55A11' },
  recapVert: { fontSize: 13, color: '#1A5E38', fontWeight: 'bold' },
  btn: { backgroundColor: '#1F4E79', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnSecondaire: { backgroundColor: '#C55A11', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnTexte: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});
