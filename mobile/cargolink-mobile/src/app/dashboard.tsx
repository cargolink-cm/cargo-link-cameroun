import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

const VILLES = [
  'Yaounde', 'Obala', 'Mbalmayo', 'Mfou', 'Ntui', 'Bafia', 'Monatele', 'Ngomedzap', 'Otele',
  'Douala', 'Edea', 'Nkongsamba', 'Mbanga', 'Loum',
  'Bafoussam', 'Dschang', 'Mbouda', 'Bafang', 'Foumban', 'Baham',
  'Garoua', 'Maroua', 'Guider', 'Figuil', 'Kousseri',
  'Ngaoundere', 'Meiganga', 'Tibati', 'Banyo', 'Tignere',
  'Ebolowa', 'Kribi', 'Sangmelima', 'Ambam', 'Kye-Ossi',
  'Bamenda', 'Buea', 'Limbe', 'Kumbo', 'Mamfe', 'Kumba',
  'Bertoua', 'Batouri', 'Yokadouma', 'Garoua-Boulai', 'Abong-Mbang',
  'Ndjamena', 'Moundou', 'Bongor', 'Sarh',
  'Bangui', 'Berberati', 'Lagos', 'Abuja', 'Malabo', 'Libreville'
];

const TYPES_CAMIONS = [
  'Tout type de camion', 'Pick-up', 'Minibus cargo',
  'Camion porteur 5 à 10 tonnes', 'Camion porteur 10 à 23 tonnes',
  'Camions 8 roues carrosserie', 'Camion 8 roues fourgonnette',
  'Camion benne 10 roues', 'Camion benne 12 roues',
  'Camion plateau', 'Camion fourgon', 'Camion frigorifique',
  'Camion citerne', 'Semi-remorque 20 à 40 tonnes',
];

interface User { id: number; nom_complet: string; }
interface Demande { id: number; marchandise: string; ville_depart: string; ville_arrivee: string; budget_final?: number; }

function SelectModal({ visible, options, onSelect, onClose, titre }: {
  visible: boolean; options: string[]; onSelect: (v: string) => void; onClose: () => void; titre: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modal.overlay}>
        <View style={modal.container}>
          <Text style={modal.titre}>{titre}</Text>
          <FlatList
            data={options}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={modal.item} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={modal.itemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={modal.fermer} onPress={onClose}>
            <Text style={modal.fermerText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  titre: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79', marginBottom: 15 },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16, color: '#333' },
  fermer: { backgroundColor: '#1F4E79', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  fermerText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [marchandise, setMarchandise] = useState('');
  const [villeDepart, setVilleDepart] = useState('Yaounde');
  const [villeArrivee, setVilleArrivee] = useState('Douala');
  const [typeCamion, setTypeCamion] = useState('Tout type de camion');
  const [poids, setPoids] = useState('');
  const [budget, setBudget] = useState('');
  const [modalDepart, setModalDepart] = useState(false);
  const [modalArrivee, setModalArrivee] = useState(false);
  const [modalCamion, setModalCamion] = useState(false);

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
      console.log('Erreur:', error);
    }
  };

  const publierDemande = async () => {
    if (!marchandise || !poids || !budget) {
      Alert.alert('Erreur', 'Remplissez tous les champs obligatoires');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('cargolink_token');
      await axios.post(API_URL + '/demandes', {
        marchandise,
        ville_depart: villeDepart,
        ville_arrivee: villeArrivee,
        type_camion_souhaite: typeCamion,
        date_souhaitee: '2026-12-01',
        poids_tonnes: parseFloat(poids),
        budget_final: parseInt(budget)
      }, { headers: { Authorization: 'Bearer ' + token } });
      Alert.alert('Succes', 'Demande publiee !');
      setMarchandise(''); setPoids(''); setBudget('');
      charger();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de publier');
    }
  };

  const deconnecter = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <SelectModal visible={modalDepart} options={VILLES} onSelect={setVilleDepart} onClose={() => setModalDepart(false)} titre="Ville de depart" />
      <SelectModal visible={modalArrivee} options={VILLES} onSelect={setVilleArrivee} onClose={() => setModalArrivee(false)} titre="Ville d arrivee" />
      <SelectModal visible={modalCamion} options={TYPES_CAMIONS} onSelect={setTypeCamion} onClose={() => setModalCamion(false)} titre="Type de camion" />

      <View style={styles.header}>
        <Text style={styles.titre}>Bonjour {user?.nom_complet}</Text>
        <TouchableOpacity onPress={deconnecter}>
          <Text style={styles.deconnexion}>Deconnecter</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitre}>Nouvelle demande</Text>
      <TextInput style={styles.input} placeholder="Marchandise *" value={marchandise} onChangeText={setMarchandise} />

      <Text style={styles.label}>Ville de depart</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalDepart(true)}>
        <Text style={styles.selectorText}>{villeDepart}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Ville d arrivee</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalArrivee(true)}>
        <Text style={styles.selectorText}>{villeArrivee}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Type de camion</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalCamion(true)}>
        <Text style={styles.selectorText}>{typeCamion}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Poids en tonnes *" value={poids} onChangeText={setPoids} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Budget FCFA *" value={budget} onChangeText={setBudget} keyboardType="numeric" />

      <TouchableOpacity style={styles.btn} onPress={publierDemande}>
        <Text style={styles.btnTexte}>Publier la demande</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondaire} onPress={() => router.push('/mes-demandes')}>
        <Text style={styles.btnTexte}>Mes demandes</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitre}>Demandes disponibles ({demandes.length})</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 50 },
  titre: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79' },
  sectionTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginTop: 15, marginBottom: 10 },
  deconnexion: { color: 'red', fontSize: 14 },
  label: { fontSize: 14, color: '#555', marginBottom: 5, marginTop: 5 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16 },
  selector: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorText: { fontSize: 16, color: '#333', flex: 1 },
  arrow: { fontSize: 12, color: '#888' },
  btn: { backgroundColor: '#C55A11', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  btnSecondaire: { backgroundColor: '#1F4E79', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnTexte: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1F4E79' },
  cardTitre: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 5 },
});
