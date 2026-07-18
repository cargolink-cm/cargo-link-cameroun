import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://cargo-link-cameroun-production.up.railway.app/api';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [connecte, setConnecte] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [totalCommission, setTotalCommission] = useState(0);

  const ADMIN_PASSWORD = 'exdivia2026';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setConnecte(true);
      chargerDonnees();
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const chargerDonnees = async () => {
    try {
      const token = localStorage.getItem('cargolink_token');
      const [resTrans, resDemandes] = await Promise.all([
        axios.get(API + '/admin/transactions', { headers: { Authorization: 'Bearer ' + token } }),
        axios.get(API + '/admin/demandes', { headers: { Authorization: 'Bearer ' + token } })
      ]);
      setTransactions(resTrans.data);
      setDemandes(resDemandes.data);
      const total = resTrans.data.reduce((acc, t) => acc + t.commission_exdivia, 0);
      setTotalCommission(total);
    } catch (error) {
      console.log('Erreur:', error);
    }
  };

  const debloquerContact = async (demandeId) => {
    try {
      const token = localStorage.getItem('cargolink_token');
      await axios.put(API + '/admin/debloquer/' + demandeId, {}, { headers: { Authorization: 'Bearer ' + token } });
      alert('Contact débloqué avec succès');
      chargerDonnees();
    } catch (error) {
      alert('Erreur lors du déblocage');
    }
  };

  if (!connecte) {
    return (
      <div className="admin-login">
        <h2>Dashboard Admin EXDIVIA SARL</h2>
        <input type="password" placeholder="Mot de passe admin" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleLogin}>Se connecter</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1>Dashboard Admin EXDIVIA SARL</h1>
      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Commissions</h3>
          <p className="stat-number">{totalCommission.toLocaleString()} FCFA</p>
        </div>
        <div className="stat-card">
          <h3>Transactions</h3>
          <p className="stat-number">{transactions.length}</p>
        </div>
        <div className="stat-card">
          <h3>Demandes actives</h3>
          <p className="stat-number">{demandes.length}</p>
        </div>
      </div>
      <h2>Demandes acceptées — En attente de paiement commission</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Marchandise</th>
            <th>Trajet</th>
            <th>Montant</th>
            <th>Commission 7%</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {demandes.map(d => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.marchandise}</td>
              <td>{d.ville_depart} →{d.ville_arrivee}</td>
              <td>{d.montant_final?.toLocaleString()} FCFA</td>
              <td style={{color:'#C55A11',fontWeight:'bold'}}>{d.commission_exdivia?.toLocaleString()} FCFA</td>
              <td>{d.contact_debloque ? 'Contact débloqué' : 'En attente paiement'}</td>
              <td>
                {!d.contact_debloque && (
                  <button onClick={() => debloquerContact(d.id)} className="btn-debloquer">Débloquer contact</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}