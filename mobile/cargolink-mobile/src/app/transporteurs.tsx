import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

interface User { id: number; nom_complet: string; note_moyenne?: number; }
interface Demande { id: number; marchandise: string; ville_depart: string; ville_arrivee: string; budget_final?: number; type_camion_souhaite?: string; }
interface DemandeAcceptee { id: number; marchandise: string; ville_depart: string; ville_arrivee: string; montant_final?: number; contact_debloque?: boolean; chargeur_tel?: string; }

export default function Transporteurs() {
  const [user, setUser] = useState<User | null>(null);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [mesDemandesAcceptees, setMesDemandesAcceptees] = useState<DemandeAcceptee[]>([]);
  const [montants, setMontants] = useState<{ [key: number]: string }>({});
  const [immatriculations, setImmatriculations] = useState<{ [key: number]: string }>({});
  const [cartesGrises, setCartesGrises] = useState<{ [key: number]: string }>({});
  const [envoiEnCours, setEnvoiEnCours] = useState<{ [key: number]: boolean }>({});

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

  const choisirCarteGrise = async (id: number) => {
    Alert.alert(
      'Carte grise',
      'Comment voulez-vous ajouter votre carte grise ?',
      [
        { text: 'Prendre une photo', onPress: () => prendrePhoto(id) },
        { text: 'Choisir dans la galerie', onPress: () => choisirGalerie(id) },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const prendrePhoto = async (id: number) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Erreur', 'Permission camera refusee');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      setCartesGrises({ ...cartesGrises, [id]: 'data:image/jpeg;base64,' + result.assets[0].base64 });
    }
  };

  const choisirGalerie = async (id: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Erreur', 'Permission galerie refusee');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      setCartesGrises({ ...cartesGrises, [id]: 'data:image/jpeg;base64,' + result.assets[0].base64 });
    }
  };

  const proposer = async (id: number, budgetChargeur?: number) => {
    if (!montants[id]) { Alert.alert('Erreur', 'Saisissez un montant'); return; }
    if (!immatriculations[id]) { Alert.alert('Erreur', 'Saisissez l immatriculation du camion'); return; }
    if (!cartesGrises[id]) { Alert.alert('Erreur', 'Ajoutez la carte grise du camion'); return; }

    setEnvoiEnCours({ ...envoiEnCours, [id]: true });
    try {
      const token = await AsyncStorage.getItem('cargolink_token');
      const res = await axios.post(API_URL + '/demandes/' + id + '/proposer',
        {
          montant_propose: parseInt(montants[id]),
          immatriculation: immatriculations[id],
          carte_grise: cartesGrises[id]
        },
        { headers: { Authorization: 'Bearer ' + token } }
      );

      if (res.data.dansLeBudget) {
        Alert.alert('Succes', 'Votre proposition a ete transmise au chargeur !');
      } else {
        Alert.alert('Proposition transmise', 'Votre proposition depasse le budget du chargeur. La demande reste visible pour d autres offres, mais le chargeur peut quand meme choisir votre proposition.');
      }

      setMontants({ ...montants, [id]: '' });
      setImmatriculations({ ...immatriculations, [id]: '' });
      setCartesGrises({ ...cartesGrises, [id]: '' });
      charger();
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer la proposition");
    }
    setEnvoiEnCours({ ...envoiEnCours, [id]: false });
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

          <TextInput
            style={styles.input}
            placeholder="Immatriculation du camion"
            value={immatriculations[item.id] || ''}
            onChangeText={v => setImmatriculations({ ...immatriculations, [item.id]: v })}
          />

          <TouchableOpacity style={styles.btnCarteGrise} onPress={() => choisirCarteGrise(item.id)}>
            <Text style={styles.btnCarteGriseTexte}>
              {cartesGrises[item.id] ? '✓ Carte grise ajoutee' : 'Ajouter carte grise'}
            </Text>
          </TouchableOpacity>

          {cartesGrises[item.id] && (
            <Image source={{ uri: cartesGrises[item.id] }} style={styles.apercu} />
          )}

          {montants[item.id] && (
            <View style={styles.recap}>
              <Text style={styles.recapOrange}>Commission EXDIVIA (7%): {Math.round(parseInt(montants[item.id]) * 0.07).toLocaleString()} FCFA</Text>
              <Text style={styles.recapVert}>Vous percevrez: {Math.round(parseInt(montants[item.id]) * 0.93).toLocaleString()} FCFA</Text>
              {item.budget_final && parseInt(montants[item.id]) > item.budget_final && (
                <Text style={styles.avertissement}>⚠ Votre montant depasse le budget du chargeur ({item.budget_final.toLocaleString()} FCFA)</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, envoiEnCours[item.id] && styles.btnDisabled]}
            onPress={() => proposer(item.id, item.budget_final)}
            disabled={envoiEnCours[item.id]}
          >
            <Text style={styles.btnTexte}>{envoiEnCours[item.id] ? 'Envoi en cours...' : 'Proposer cette offre'}</Text>
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
  btnCarteGrise: { backgroundColor: '#D6E4F0', padding: 10, borderRadius: 6, marginTop: 8, alignItems: 'center' },
  btnCarteGriseTexte: { color: '#1F4E79', fontWeight: 'bold' },
  apercu: { width: 80, height: 80, borderRadius: 8, marginTop: 8, alignSelf: 'center' },
  recap: { backgroundColor: '#D6E4F0', padding: 8, borderRadius: 6, marginTop: 5 },
  recapOrange: { fontSize: 13, color: '#C55A11' },
  recapVert: { fontSize: 13, color: '#1A5E38', fontWeight: 'bold' },
  avertissement: { fontSize: 12, color: '#C55A11', fontWeight: 'bold', marginTop: 5 },
  btn: { backgroundColor: '#1F4E79', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnDisabled: { backgroundColor: '#999' },
  btnSecondaire: { backgroundColor: '#C55A11', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnTexte: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});
