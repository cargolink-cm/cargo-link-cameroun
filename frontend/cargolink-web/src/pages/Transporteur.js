import React, { useState, useEffect } from 'react';
import { getDemandesDisponibles, accepterDemande } from '../services/api';

function Transporteur({ user }) {
    const [demandes, setDemandes] = useState([]);
    const [montant, setMontant] = useState('');

    useEffect(() => {
        getDemandesDisponibles().then(res => setDemandes(res.data));
    }, []);

    const handleAccepter = async (id) => {
        await accepterDemande(id, { montant_final: montant });
        getDemandesDisponibles().then(res => setDemandes(res.data));
        setMontant('');
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Bonjour {user?.nom_complet}</h2>
                <button className="btn_deconnexion" onClick={() => { localStorage.clear(); window.location.href='http://localhost:3000'; }}>Se deconnecter</button>
                </div>
                <h3>Demandes disponibles</h3>
                <ul>
                    {demandes.map(d => (
                        <li key={d.id} className="demande-card">
                            <p><strong>Marchandise:</strong> {d.marchandise}</p>
                            <p><strong>Depart:</strong> {d.ville_depart}</p>
                            <p><strong>Arrivee:</strong> {d.ville_arrivee}</p>
                            <p><strong>Date:</strong> {d.date_souhaitee}</p>
                            <p><strong>Budget:</strong> {d.budget_final} FCFA</p>
                            <input placeholder="Votre montant en FCFA" value={montant} onChange={e => setMontant(e.target.value)} />
                            <button onClick={() => handleAccepter(d.id)}>Accepter cette demande</button>
                            </li>
                    ))}
                    </ul>
                    </div>
    );
}

export default Transporteur;