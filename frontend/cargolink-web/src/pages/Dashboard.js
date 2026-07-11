import React, { useState, useEffect } from 'react';
import { getDemandesDisponibles, creerDemande } from '../services/api';
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
        <button className="btn_deconnexion" onClick={() => { localStorage.clear(); window.location.href='http://localhost:3000'; }}>Se deconnecter</button>
        </div>
        <h3>Nouvelle demande de transport</h3>
        <input placeholder="Marchandise" value={marchandise} onChange={e => setMarchandise(e.target.value)} />
        <input placeholder="Ville depart" value={villeDepart} onChange={e => setVilleDepart(e.target.value)} />
        <input placeholder="Ville arrivee" value={villeArrivee} onChange={e => setVilleArrivee(e.target.value)} />
        <input type="date" value={dateSouhaitee} onChange={e => setDateSouhaitee(e.target.value)} />
        <input placeholder="Poids en tonnes" value={poids} onChange={e => setPoids(e.target.value)} />
        <input placeholder="Budget en FCFA" value={budget} onChange={e => setBudget(e.target.value)} />
        <button onClick={handleCreerDemande}>Publier la demande</button>
        <h3>Demandes disponibles</h3>
        <ul>
        <Messages user={user} demandeId={1} />
        <Notations evalueId={2} demandeId={1} />
        {demandes.map(d => (
            <li key={d.id}>{d.marchandise} - {d.ville_depart} vers {d.ville_arrivee}</li>
        ))}
        </ul>
        </div>
    );
}

export default Dashboard;