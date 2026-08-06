import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

export default function MesDemandesTransporteur() {
  const navigation = useNavigation();
  const [demandes, setDemandes] = useState([]);

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const charger = async () => {
    const token = await AsyncStorage.getItem('cargolink_token');
    if (!token) { navigation.navigate('/connexion'); return; }
    const res = await axios.get(API_URL + '/demandes/mes-demandes-transporteur', {
      headers: { Authorization: 'Bearer ' + token }
    });
    setDemandes(res.data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('/transporteur')}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Mes demandes acceptées</Text>
      </View>
      <FlatList
        data={demandes}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.cardTitre}>{item.marchandise}</Text>
            <Text>{item.ville_depart} vers {item.ville_arrivee}</Text>
            <Text>Montant : {item.montant_final ? item.montant_final.toLocaleString() : 'Non défini'} FCFA</Text>
            <Text style={styles.recapVert}>Votre part : {item.montant_final ? Math.round(item.montant_final * 0.93).toLocaleString() : '-'} FCFA</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 40, marginBottom: 20 },
  titre: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79', flex: 1 },
  retour: { color: '#1F4E79', fontSize: 16 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1F4E79' },
  cardTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 5 },
  recapVert: { color: '#1A5E38', fontWeight: 'bold', marginTop: 4 },
  contact: { color: '#1A5E38', fontWeight: 'bold', marginTop: 5 },
  attente: { color: '#C55A11', fontSize: 13, marginTop: 5 },
});