import React, { useState, useEffect } from 'react';
import { getDemandesDisponibles, creerDemande } from '../services/api';
import VILLES from '../data/villes';
import Messages from './Messages';
import Notations from './Notations';

function Dashboard({ user }) {
    const [demandes, setDemandes] = useState([]);
    const [marchandise, setMarchandise] = useState('');
    const [villeDepart, setVilleDepart] = useState('');
    const [villeArrivee, setVilleArrivee] = useState('');
    const [dateSouhaitee, setDateSouhaitee] = useState('');
    const [poids, setPoids] = useState('');
    const [budget, setBudget] = useState('');

    useEffect(() => {
        getDemandesDisponibles().then(res => setDemandes(res.data));
    }, []);

    const handleCreerDemande = async () => {
        await creerDemande({
            marchandise,
ville_depart: villeDepart,
ville_arrivee: villeArrivee,
date_souhaitee: dateSouhaitee,
poids_tonnes: poids,
budget_final: budget,
        });
        getDemandesDisponibles().then(res => setDemandes(res.data));
    };

    return (
        <div className="dashboard">
       <div className="dashboard-header">
        <h2>Bonjour {user?.nom_complet}</h2>
        <p>Note moyenne: {user?.note_moyenne || 'Pas encore note'} /5</p>
        <button className="btn_deconnexion" onClick={() => { localStorage.clear(); window.location.href='https://cargo-link-cameroun.vercel.app'; }}>Se deconnecter</button>
        </div>
        <h3>Nouvelle demande de transport</h3>
        <input placeholder="Marchandise" value={marchandise} onChange={e => setMarchandise(e.target.value)} />
        <select value={villeDepart} onChange={e => setVilleDepart(e.target.value)}>
            <option value="">Choisir ville depart</option>
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
        <select value={villeArrivee} onChange={e => setVilleArrivee(e.target.value)}>
            <option value="">Choisir ville arrivee</option>
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
        <input type="date" value={dateSouhaitee} onChange={e => setDateSouhaitee(e.target.value)} />
        <input placeholder="Poids en tonnes" value={poids} onChange={e => setPoids(e.target.value)} />
        <input placeholder="Budget en FCFA" value={budget} onChange={e => setBudget(e.target.value)} />
        <button onClick={handleCreerDemande}>Publier la demande</button>
        <h3>Demandes disponibles</h3>
        <ul>
        <Messages user={user} demandeId={1} />
        <Notations evalueId={1} demandeId={1} />
        {demandes.map(d => (
            <li key={d.id}>{d.marchandise} - {d.ville_depart} vers {d.ville_arrivee}</li>
        ))}
        </ul>
        </div>
    );
}

export default Dashboard;