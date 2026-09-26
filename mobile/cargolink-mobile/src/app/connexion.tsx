import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

export default function Connexion() {
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [afficherMdp, setAfficherMdp] = useState(false);

  const ouvrirWhatsApp = () => {
    const message = "Bonjour, j'ai oublie mon mot de passe CargoLink. Mon numero enregistre sur l'application est : [ECRIVEZ VOTRE NUMERO ICI]";
    const url = 'https://wa.me/237680893650?text=' + encodeURIComponent(message);
    Linking.openURL(url);
  };

  const handleConnexion = async () => {
    try {
      const res = await axios.post(API_URL + '/auth/connexion', {
        telephone: identifiant,
        email: identifiant,
        password
      });
      await AsyncStorage.setItem('cargolink_token', res.data.token);
      const userData = res.data.user;
      await AsyncStorage.setItem('cargolink_user', JSON.stringify(userData));
      if (userData.type_utilisateur === 'transporteur') {
        router.replace('/transporteurs');
      } else {
        router.replace('/dashboard');
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Identifiants incorrects';
      Alert.alert('Erreur', message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Connexion CargoLink</Text>
      <TextInput style={styles.input} placeholder="Email ou telephone" value={identifiant} onChangeText={setIdentifiant} autoCapitalize="none" />
      <View style={styles.inputMdpContainer}>
        <TextInput style={styles.inputMdp} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry={!afficherMdp} />
        <TouchableOpacity onPress={() => setAfficherMdp(!afficherMdp)} style={styles.iconeOeil}>
          <Ionicons name={afficherMdp ? 'eye-off' : 'eye'} size={22} color="#888" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleConnexion}>
        <Text style={styles.btnTexte}>Se connecter</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/inscription')}>
        <Text style={styles.lien}>Pas encore inscrit ? S inscrire</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={ouvrirWhatsApp}>
        <Text style={styles.lienMdpOublie}>Mot de passe oublie ?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 30, justifyContent: 'center' },
  titre: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  inputMdpContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15 },
  inputMdp: { flex: 1, padding: 12, fontSize: 16 },
  iconeOeil: { padding: 12 },
  btn: { backgroundColor: '#1F4E79', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnTexte: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  lien: { color: '#1F4E79', textAlign: 'center', marginTop: 10 },
  lienMdpOublie: { color: '#888', textAlign: 'center', marginTop: 15, fontSize: 13 },
});
