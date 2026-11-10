import React from 'react';
import { Share, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';

const LIEN = 'https://play.google.com/store/apps/details?id=com.exdivia.cargolink';
const MESSAGE =
  'Transportez ou faites transporter vos marchandises au Cameroun avec CargoLink : ' +
  'comparez les offres des transporteurs et choisissez la meilleure. ' +
  'Telechargez l application gratuitement : ' + LIEN;

export default function BoutonPartage() {
  const partager = async () => {
    try {
      await Share.share({ message: MESSAGE });
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de partager pour le moment');
    }
  };
  return (
    <TouchableOpacity style={styles.btn} onPress={partager}>
      <Text style={styles.texte}>Partager CargoLink (WhatsApp)</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: '#25D366', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  texte: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});
