import React, { useState, useEffect } from 'react';
import { getDemandesDisponibles, accepterDemande } from '../services/api';

function Transporteur({ user }) {
    const [demandes, setDemandes] = useState([]);
    const [montants, setMontants] = useState('');

    useEffect(() => {
        getDemandesDisponibles().then(res => setDemandes(res.data));
    }, []);

    const handleAccepter = async (id) => {
        if (!montants[id]) {
            alert('Veuillez saisir un montant');
            return;
        }
        await accepterDemande(id, { montant_final: parseInt(montants[id]) });
        getDemandesDisponibles().then(res => setDemandes(res.data));
        setMontants({...montants, [id]: ''});
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Bonjour {user?.nom_complet}</h2>
                <button className="btn_deconnexion" onClick={() => { localStorage.clear(); window.location.href='https://cargo-link-cameroun.vercel.app'; }}>Se deconnecter</button>
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
                            <input placeholder="Votre montant en FCFA" value={montants[d.id] || ''} onChange={e => setMontants({...montants, [d.id]: e.target.value})} />
                            {montants[d.id] && parseInt(montants[d.id]) > d.budget_final && (
                                <p style={{color:'red',fontSize:'12px',marginTop:'5px'}}>ATTENTION : Votre budget depasse le budget du chargeur ({d.budget_final} FCFA</p>
                            )}
                            <button onClick={() => handleAccepter(d.id)}>Accepter cette demande</button>
                            <p style={{color: '#C55A11',fontWeight:'bold',textAlign:'center',marginTop:'10px'}}>Apres acceptation payer la commission sur le numero EXDIVIA SARL : [694400065]</p>
                            </li>
                    ))}
                    </ul>
                    </div>
    );
}

export default Transporteur;