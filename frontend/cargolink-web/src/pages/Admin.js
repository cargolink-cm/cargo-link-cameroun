import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://cargo-link-cameroun-production.up.railway.app/api';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [connecte, setConnecte] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [filtreDemandes, setFiltreDemandes] = useState('attente');
  const [filtreUtilisateurs, setFiltreUtilisateurs] = useState('chargeur');
  const [afficherChangeMdp, setAfficherChangeMdp] = useState(false);
  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post(API + '/admin-auth/login', { password });
      setAdminToken(res.data.token);
      setConnecte(true);
      chargerDonnees();
    } catch (error) {
      const message = error.response?.data?.error || 'Mot de passe incorrect';
      alert(message);
    }
  };

  React.useEffect(() => {
    if (!connecte) return;
    const interval = setInterval(() => {
      chargerDonnees();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connecte]);

  const chargerDonnees = async () => {
    try {
      const token = localStorage.getItem('cargolink_token');
      if (!token) { alert('Veuillez vous cinnecter d abord'); return; }
      const [resTrans, resDemandes] = await Promise.all([
        axios.get(API + '/admin/transactions', { headers: { Authorization: 'Bearer ' + token } }),
        axios.get(API + '/admin/demandes', { headers: { Authorization: 'Bearer ' + token } })
      ]);
      setTransactions(resTrans.data);
      setDemandes(resDemandes.data);
      const total = resTrans.data.reduce((acc, t) => acc + t.commission_exdivia, 0);
      setTotalCommission(total);
      const resUsers = await axios.get(API + '/admin/utilisateurs', { headers: {Authorization: 'Bearer ' + token } });
      setUtilisateurs(resUsers.data);
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

  const handleChangerMotDePasse = async () => {
    if (nouveauMdp !== confirmMdp) {
      alert('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (nouveauMdp.length < 8) {
      alert('Le nouveau mot de passe doit contenir au moins 8 caracteres');
      return;
    }
    try {
      await axios.put(API + '/admin-auth/changer-mot-de-passe',
        { ancienMotDePasse: ancienMdp, nouveauMotDePasse: nouveauMdp },
        { headers: { Authorization: 'Bearer ' + adminToken } }
      );
      alert('Mot de passe modifie avec succes ! Reconnectez-vous.');
      setConnecte(false);
      setAfficherChangeMdp(false);
      setAncienMdp('');
      setNouveauMdp('');
      setConfirmMdp('');
      setPassword('');
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors du changement de mot de passe');
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

  const demandesEnAttente = demandes.filter(d => !d.contact_debloque);
  const demandesValidees = demandes.filter(d => d.contact_debloque);
  const demandesAffichees = filtreDemandes === 'attente' ? demandesEnAttente : demandesValidees;

  const chargeurs = utilisateurs.filter(u => u.type_utilisateur === 'chargeur');
  const transporteurs = utilisateurs.filter(u => u.type_utilisateur === 'transporteur');
  const utilisateursAffiches = filtreUtilisateurs === 'chargeur' ? chargeurs : transporteurs;

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
        <div className="stat-card">
          <h3>Utilisateurs inscrits</h3>
          <p className="stat-number">{utilisateurs.length}</p>
        </div>
      </div>

      <div className="admin-section">
        <h2>Gestion des demandes</h2>
        <div className="admin-tabs">
          <button
            className={filtreDemandes === 'attente' ? 'tab-actif' : 'tab'}
            onClick={() => setFiltreDemandes('attente')}
          >
            En attente ({demandesEnAttente.length})
          </button>
          <button
            className={filtreDemandes === 'validee' ? 'tab-actif' : 'tab'}
            onClick={() => setFiltreDemandes('validee')}
          >
            Déjà validées ({demandesValidees.length})
          </button>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Chargeur</th>
                <th>Transporteur</th>
                <th>Marchandise</th>
                <th>Trajet</th>
                <th>Montant</th>
                <th>Commission 7%</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {demandesAffichees.map(d => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.chargeur_nom || '-'}</td>
                  <td>{d.transporteur_nom || '-'}</td>
                  <td>{d.marchandise}</td>
                  <td>{d.ville_depart} → {d.ville_arrivee}</td>
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
      </div>

      <div className="admin-section">
        <h2>Utilisateurs inscrits</h2>
        <div className="admin-tabs">
          <button
            className={filtreUtilisateurs === 'chargeur' ? 'tab-actif' : 'tab'}
            onClick={() => setFiltreUtilisateurs('chargeur')}
          >
            Chargeurs ({chargeurs.length})
          </button>
          <button
            className={filtreUtilisateurs === 'transporteur' ? 'tab-actif' : 'tab'}
            onClick={() => setFiltreUtilisateurs('transporteur')}
          >
            Transporteurs ({transporteurs.length})
          </button>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Note</th>
                <th>Date inscription</th>
              </tr>
            </thead>
            <tbody>
              {utilisateursAffiches.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.nom_complet}</td>
                  <td>{u.telephone}</td>
                  <td>{u.note_moyenne || '0'}/5</td>
                  <td>{new Date(u.created_at).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h2>Autres actions administrateur</h2>
        <div className="admin-actions-grid">
          <button className="admin-action-btn" onClick={chargerDonnees}>
            Actualiser les données
          </button>
          <button className="admin-action-btn" onClick={() => setAfficherChangeMdp(!afficherChangeMdp)}>
            Changer le mot de passe admin
          </button>
          <button className="admin-action-btn" disabled style={{opacity: 0.5}}>
            Exporter en Excel (bientôt)
          </button>
          <button className="admin-action-btn" disabled style={{opacity: 0.5}}>
            Gérer les litiges (bientôt)
          </button>
        </div>

        {afficherChangeMdp && (
          <div style={{marginTop:'15px', padding:'15px', backgroundColor:'#f5f5f5', borderRadius:'8px'}}>
            <h3>Changer le mot de passe admin</h3>
            <input type="password" placeholder="Ancien mot de passe" value={ancienMdp} onChange={e => setAncienMdp(e.target.value)} style={{display:'block', width:'100%', marginBottom:'10px', padding:'8px'}} />
            <input type="password" placeholder="Nouveau mot de passe (8 caracteres min)" value={nouveauMdp} onChange={e => setNouveauMdp(e.target.value)} style={{display:'block', width:'100%', marginBottom:'10px', padding:'8px'}} />
            <input type="password" placeholder="Confirmer le nouveau mot de passe" value={confirmMdp} onChange={e => setConfirmMdp(e.target.value)} style={{display:'block', width:'100%', marginBottom:'10px', padding:'8px'}} />
            <button onClick={handleChangerMotDePasse} style={{backgroundColor:'#1A5E38', color:'white', padding:'10px 20px', border:'none', borderRadius:'6px', cursor:'pointer'}}>
              Confirmer le changement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
