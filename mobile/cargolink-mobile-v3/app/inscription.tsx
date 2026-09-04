import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cargo-link-cameroun-production.up.railway.app/api';

export default function Inscription() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [typeUtilisateur, setTypeUtilisateur] = useState(type || 'chargeur');

  useEffect(() => {
    if (type) setTypeUtilisateur(type);
  }, [type]);

  const handleInscription = async () => {
    try {
      const res = await axios.post(API_URL + '/auth/inscription', {
        nom_complet: nomComplet,
        email,
        telephone,
        password,
        type_utilisateur: typeUtilisateur
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
      Alert.alert('Erreur', err.response?.data?.message || 'Inscription impossible');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titre}>Inscription CargoLink</Text>
      <TextInput style={styles.input} placeholder="Nom complet" value={nomComplet} onChangeText={setNomComplet} />
      <TextInput style={styles.input} placeholder="Email (optionnel)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Telephone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      <Text style={styles.label}>Type de compte :</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity style={[styles.typeBtn, typeUtilisateur === 'chargeur' && styles.typeBtnActif]} onPress={() => setTypeUtilisateur('chargeur')}>
          <Text style={typeUtilisateur === 'chargeur' ? styles.typeTxtActif : styles.typeTxt}>Chargeur</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, typeUtilisateur === 'transporteur' && styles.typeBtnActif]} onPress={() => setTypeUtilisateur('transporteur')}>
          <Text style={typeUtilisateur === 'transporteur' ? styles.typeTxtActif : styles.typeTxt}>Transporteur</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleInscription}>
        <Text style={styles.btnTexte}>S inscrire</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/connexion')}>
        <Text style={styles.lien}>Deja inscrit ? Se connecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: 'white', padding: 30, justifyContent: 'center' },
  titre: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 30, textAlign: 'center' },
  label: { fontSize: 16, color: '#1F4E79', fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#1F4E79', alignItems: 'center', backgroundColor: '#D6E4F0' },
  typeBtnActif: { backgroundColor: '#1F4E79' },
  typeTxt: { color: '#1F4E79', fontWeight: 'bold' },
  typeTxtActif: { color: 'white', fontWeight: 'bold' },
  btn: { backgroundColor: '#1F4E79', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnTexte: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  lien: { color: '#1F4E79', textAlign: 'center', marginTop: 10 },
});
