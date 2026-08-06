import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

export default function Transporteur() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [mesDemandesAcceptees, setMesDemandesAcceptees] = useState([]);
  const [montants, setMontants] = useState({});

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  //·eslint-disable-next-line·react-hooks/exhaustive-deps
  },[]);

  const charger = async () => {
    const token = await AsyncStorage.getItem('cargolink_token');
    const userData = await AsyncStorage.getItem('cargolink_user');
    if (!token) { navigation.navigate('/connexion'); return; }
    setUser(JSON.parse(userData));
    const [res1, res2] = await Promise.all([
      axios.get(API_URL + '/demandes/disponibles', { headers: { Authorization: 'Bearer ' + token } }),
      axios.get(API_URL + '/demandes/mes-demandes-transporteur', { headers: { Authorization: 'Bearer ' + token } })
    ]);
    setDemandes(res1.data);
    setMesDemandesAcceptees(res2.data);
  };

  const accepter = async (id) => {
    if (!montants[id]) { Alert.alert('Erreur', 'Saisissez un montant'); return; }
    const token = await AsyncStorage.getItem('cargolink_token');
    await axios.put(API_URL + '/demandes/' + id + '/accepter', { montant_final: parseInt(montants[id]) }, { headers: { Authorization: 'Bearer ' + token } });
    Alert.alert('Succes', 'Demande·acceptee !');
    charger();
  };

  const deconnecter = async () => {
    await AsyncStorage.clear();
    navigation.navigate('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titre}>Bonjour {user?.nom_complet}</Text>
        <TouchableOpacity onPress={deconnecter}>
          <Text style={styles.deconnexion}>Deconnecter</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.btnMesDemandes} onPress={() => navigation.navigate('/mes-demandes-transporteur')}>
        <Text style={styles.btnTexte}>Mes demandes acceptées</Text>
        </TouchableOpacity>
      <Text style={styles.sousTitre}>Demandes disponibles</Text>
      <FlatList
        data={demandes}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.cardTitre}>{item.marchandise}</Text>
            <Text>{item.ville_depart} vers {item.ville_arrivee}</Text>
            <Text>Type camion : {item.type_camion_souhaite || 'Tout·type'}</Text>
            <Text>Budget : {item.budget_final?.toLocaleString()} FCFA</Text>
            <TextInput style={styles.input} placeholder="Votre montant FCFA" keyboardType="numeric" value={montants[item.id] || ''} onChangeText={v => setMontants({...montants, [item.id]: v})}/>
            {montants[item.id] && (
              <View style={styles.recap}>
                <Text style={styles.recapText}>Commission EXDIVIA (7%) : {Math.round(parseInt(montants[item.id])*0.07).toLocaleString()} FCFA</Text>
                <Text style={styles.recapVert}>Vous percevrez : {Math.round(parseInt(montants[item.id])*0.93).toLocaleString()} FCFA</Text>
              </View>
            )}
            <TouchableOpacity style={styles.btn} onPress={() => accepter(item.id)}>
              <Text style={styles.btnTexte}>Accepter cette demande</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <Text style={styles.sousTitre}>Mes demandes acceptees</Text>
      <FlatList
        data={mesDemandesAcceptees}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.cardTitre}>{item.marchandise}</Text>
            <Text>{item.ville_depart} vers {item.ville_arrivee}</Text>
            {item.contact_debloque ? (
              <Text style={styles.contact}>Contact chargeur : {item.chargeur_tel}</Text>
            ) : (
              <Text style={styles.attente}>En attente de paiement commission</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  titre: { fontSize: 20, fontWeight: 'bold', color: '#1F4E79' },
  sousTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginTop: 10, marginBottom: 10 },
  deconnexion: { color: 'red', fontSize: 14 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1F4E79' },
  cardTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, marginTop: 8, fontSize: 16 },
  recap: { backgroundColor: '#D6E4F0', padding: 8, borderRadius: 6, marginTop: 5 },
  recapText: { fontSize: 13, color: '#C55A11' },
  recapVert: { fontSize: 13, color: '#1A5E38', fontWeight: 'bold' },
  btn: { backgroundColor: '#1F4E79', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnTexte: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  contact: { color: '#1A5E38', fontWeight: 'bold', marginTop: 5 },
  attente: { color: '#C55A11', fontSize: 13, marginTop: 5 },
  btnMesDemandes: { backgroundColor: 'C55A11', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15},
});
