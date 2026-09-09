import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, Image } from 'react-native';
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
  budget_final?: number;
  transporteur_nom?: string;
  transporteur_tel?: string;
  montant_final?: number;
  contact_debloque?: boolean;
  immatriculation?: string;
  carte_grise?: string;
}

interface Proposition {
  id: number;
  transporteur_id: number;
  montant_propose: number;
  immatriculation: string;
  carte_grise?: string;
  transporteur_nom: string;
  transporteur_tel: string;
  transporteur_note?: string;
}

export default function MesDemandes() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [propositions, setPropositions] = useState<{ [key: number]: Proposition[] }>({});
  const [demandeOuverte, setDemandeOuverte] = useState<number | null>(null);
  const [carteGriseAffichee, setCarteGriseAffichee] = useState<string | null>(null);

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

  const voirPropositions = async (demandeId: number) => {
    if (demandeOuverte === demandeId) {
      setDemandeOuverte(null);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('cargolink_token');
      const res = await axios.get(API_URL + '/demandes/' + demandeId + '/propositions', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setPropositions({ ...propositions, [demandeId]: res.data });
      setDemandeOuverte(demandeId);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les propositions');
    }
  };

  const choisirProposition = async (demandeId: number, propositionId: number, montant: number) => {
    Alert.alert(
      'Confirmer le choix',
      'Voulez-vous choisir cette proposition de ' + montant.toLocaleString() + ' FCFA ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('cargolink_token');
              await axios.put(API_URL + '/demandes/' + demandeId + '/choisir-proposition',
                { proposition_id: propositionId },
                { headers: { Authorization: 'Bearer ' + token } }
              );
              Alert.alert('Succes', 'Proposition choisie ! Vous pouvez maintenant payer la commission.');
              setDemandeOuverte(null);
              charger();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de choisir cette proposition');
            }
          }
        }
      ]
    );
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
          <Text>Budget: {item.budget_final?.toLocaleString()} FCFA</Text>
          <Text>Statut: <Text style={{ color: item.statut === 'acceptee' ? 'green' : item.statut === 'proposee' ? '#C55A11' : 'orange', fontWeight: 'bold' }}>{item.statut}</Text></Text>

          {item.transporteur_nom && <Text>Transporteur: {item.transporteur_nom}</Text>}

          {item.contact_debloque ? (
            <>
              <Text style={styles.contact}>Tel transporteur: {item.transporteur_tel}</Text>
              {item.immatriculation && <Text style={styles.info}>Immatriculation: {item.immatriculation}</Text>}
              {item.carte_grise && (
                <TouchableOpacity onPress={() => setCarteGriseAffichee(item.carte_grise || null)}>
                  <Text style={styles.lienCarteGrise}>Voir la carte grise</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.montantAVerser}>Montant a verser: {Math.round((item.montant_final || 0) * 0.93).toLocaleString()} FCFA</Text>
            </>
          ) : item.statut === 'acceptee' ? (
            <View style={styles.commissionBox}>
              <Text style={styles.commissionText}>Payez {Math.round((item.montant_final || 0) * 0.07).toLocaleString()} FCFA sur le numero MTN 680893650 ou Orange 689925673 EXDIVIA SARL pour recevoir le contact du transporteur. Vous devrez ensuite remettre {Math.round((item.montant_final || 0) * 0.93).toLocaleString()} FCFA au transporteur</Text>
            </View>
          ) : item.statut === 'en_attente' || item.statut === 'proposee' ? (
            <>
              {item.statut === 'proposee' && (
                <Text style={styles.attenteMeilleure}>Votre demande reste ouverte en attente d'une meilleure offre</Text>
              )}
              <TouchableOpacity style={styles.btnVoirPropositions} onPress={() => voirPropositions(item.id)}>
                <Text style={styles.btnVoirPropositionsTexte}>
                  {demandeOuverte === item.id ? 'Masquer les propositions' : 'Voir les propositions recues'}
                </Text>
              </TouchableOpacity>

              {demandeOuverte === item.id && (
                <View style={styles.propositionsContainer}>
                  {propositions[item.id]?.length === 0 && (
                    <Text style={styles.aucuneProposition}>Aucune proposition recue pour le moment</Text>
                  )}
                  {propositions[item.id]?.map(prop => (
                    <View key={prop.id} style={styles.propositionCard}>
                      <Text style={styles.propositionMontant}>{prop.montant_propose.toLocaleString()} FCFA</Text>
                      {item.budget_final && prop.montant_propose > item.budget_final && (
                        <Text style={styles.depasseBudget}>Depasse votre budget de {(prop.montant_propose - item.budget_final).toLocaleString()} FCFA</Text>
                      )}
                      <Text>Transporteur: {prop.transporteur_nom}</Text>
                      <Text>Note: {prop.transporteur_note || 'Pas encore note'}/5</Text>
                      <Text>Immatriculation: {prop.immatriculation}</Text>
                      {prop.carte_grise && (
                        <TouchableOpacity onPress={() => setCarteGriseAffichee(prop.carte_grise || null)}>
                          <Text style={styles.lienCarteGrise}>Voir la carte grise</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.btnChoisir}
                        onPress={() => choisirProposition(item.id, prop.id, prop.montant_propose)}
                      >
                        <Text style={styles.btnChoisirTexte}>Choisir cette proposition</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}
        </View>
      ))}

      <Modal visible={!!carteGriseAffichee} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {carteGriseAffichee && (
              <Image source={{ uri: carteGriseAffichee }} style={styles.imageCarteGrise} resizeMode="contain" />
            )}
            <TouchableOpacity style={styles.btnFermerModal} onPress={() => setCarteGriseAffichee(null)}>
              <Text style={styles.btnFermerModalTexte}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  info: { color: '#555', marginTop: 3, fontSize: 13 },
  montantAVerser: { color: '#C55A11', fontWeight: 'bold', marginTop: 3, fontSize: 15 },
  commissionBox: { backgroundColor: '#FCE4D6', padding: 8, borderRadius: 6, marginTop: 5 },
  commissionText: { color: '#C55A11', fontSize: 13 },
  attenteMeilleure: { color: '#C55A11', fontSize: 13, fontStyle: 'italic', marginTop: 5, marginBottom: 5 },
  btnVoirPropositions: { backgroundColor: '#1F4E79', padding: 10, borderRadius: 6, marginTop: 8, alignItems: 'center' },
  btnVoirPropositionsTexte: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  propositionsContainer: { marginTop: 10 },
  aucuneProposition: { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 10 },
  propositionCard: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#eee' },
  propositionMontant: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79' },
  depasseBudget: { color: '#C55A11', fontSize: 12, marginBottom: 5 },
  btnChoisir: { backgroundColor: '#1A5E38', padding: 10, borderRadius: 6, marginTop: 8, alignItems: 'center' },
  btnChoisirTexte: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  lienCarteGrise: { color: '#1F4E79', textDecorationLine: 'underline', marginTop: 5, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 15, width: '90%', maxHeight: '80%' },
  imageCarteGrise: { width: '100%', height: 400 },
  btnFermerModal: { backgroundColor: '#1F4E79', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnFermerModalTexte: { color: 'white', fontWeight: 'bold' },
});
