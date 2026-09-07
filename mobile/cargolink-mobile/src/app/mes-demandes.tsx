import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

interface Demande {
  id: number;
  marchandise: string;
  ville_depart: string;
  ville_arrivee: string;
  statut: string;
  transporteur_nom?: string;
  transporteur_tel?: string;
  montant_final?: number;
  contact_debloque?: boolean;
}

export default function MesDemandes() {
  const [demandes, setDemandes] = useState<Demande[]>([]);

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, []);

  const charger = async () => {
    try {
      const token = await AsyncStorage.getItem('cargolink_token');
      if (!token) { router.replace('/connexion'); return; }
      const res = await axios.get(API_URL + '/demandes/mes-demandes', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setDemandes(res.data);
    } catch (error) {
      console.log('Erreur mes-demandes:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.retour}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Mes demandes</Text>
      </View>
      {demandes.map(item => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitre}>{item.marchandise}</Text>
          <Text>{item.ville_depart} → {item.ville_arrivee}</Text>
          <Text>Statut: <Text style={{ color: item.statut === 'acceptee' ? 'green' : 'orange', fontWeight: 'bold' }}>{item.statut}</Text></Text>
          {item.transporteur_nom && <Text>Transporteur: {item.transporteur_nom}</Text>}
          {item.contact_debloque ? (
            <Text style={styles.contact}>Tel transporteur: {item.transporteur_tel}</Text>
          ) : item.statut === 'acceptee' ? (
            <View style={styles.commissionBox}>
              <Text style={styles.commissionText}>Payez {Math.round((item.montant_final || 0) * 0.07).toLocaleString()} FCFA sur le numero Orange 680893650 ou MTN 689925673 EXDIVIA SARL chargeur pour recevoir le contact</Text>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 50, marginBottom: 20 },
  titre: { fontSize: 20, fontWeight: 'bold', color: '#1F4E79' },
  retour: { color: '#1F4E79', fontSize: 16 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1F4E79' },
  cardTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 5 },
  contact: { color: '#1A5E38', fontWeight: 'bold', marginTop: 5 },
  commissionBox: { backgroundColor: '#FCE4D6', padding: 8, borderRadius: 6, marginTop: 5 },
  commissionText: { color: '#C55A11', fontSize: 13 },
});
