import React, { useState, useEffect } from 'react';
import { getDemandesDisponibles, accepterDemande, getMesDemandesTransporteur } from '../services/api';

function Transporteur({ user }) {
    const [demandes, setDemandes] = useState([]);
    const [mesDemandesAcceptees, setMesDemandesAcceptees] = useState([]);
    const [montants, setMontants] = useState('');

    useEffect(() => {
        getDemandesDisponibles().then(res => setDemandes(res.data));
        getMesDemandesTransporteur().then(res => setMesDemandesAcceptees(res.data));
        const interval = setInterval(() => {
            getDemandesDisponibles().then(res => setDemandes(res.data));
            getMesDemandesTransporteur().then(res => setMesDemandesAcceptees(res.data));
        }, 30000);
        return () => clearInterval(interval);
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
                <h3>Mes demandes acceptées</h3>
                {mesDemandesAcceptees.map(d => (
                    <div key={d.id} className="demande-card">
                        <p><strong>{d.marchandise}</strong> - {d.ville_depart} vers {d.ville_arrivee}</p>
                        <p>Montant : <strong>{d.montant_final?.toLocaleString} FCFA</strong></p>
                        <p>Votre part : <strong style={{color:'#1A5E38'}}>{Math.round(d.montant_final*0.93).toLocaleString()} FCFA</strong></p>
                        {d.contact_debloque ? (
                            <div style={{backgroundColor:'#E8F5EE',padding:'10px',borderRadius:'8px',marginTop:'5px'}}>
                                <p style={{color:'#1A5E38',fontWeight:'bold'}}>Contact chargeur debloqué</p>
                                <p>Chargeur : <strong>{d.chargeur_nom}</strong></p>
                                <p>Tel : <strong style={{color:'#C55A11'}}>{d.chargeur_tel}</strong></p>
                                </div>
                        ) : (
                            <p style={{color:'#C55A11',fontSize:'12px'}}>En attente de paiement de commission par le chargeur </p>
                        )}
                        </div>
    ))}
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
                            {montants[d.id] && (
                                <div style={{backgroundColor:'#D6E4F0', padding:'10px',borderRadius:'8px',marginTop:'5px'}}>
                                    <p><strong>Recapitulatif :</strong></p>
                                    <p>Montant total : <strong>{parseInt(montants[d.id]).toLocaleString()} FCFA</strong></p>
                                    <p>Commission EXDIVIA SARL (7%) : <strong style={{color:'#C55A11'}}>{Math.round(parseInt(montants[d.id]) * 0.07).toLocaleString()} FCFA</strong></p>
                                    <p>Vous percevrez : <strong style={{color:'#1A5E38'}}>{Math.round(parseInt(montants[d.id]) * 0.93).toLocaleString()} FCFA</strong></p>
                                    </div>
                            )}
                            {montants[d.id] && parseInt(montants[d.id]) > d.budget_final && (
                                <p style={{color:'red',fontSize:'12px',marginTop:'5px'}}>ATTENTION : Votre budget depasse le budget du chargeur ({d.budget_final} FCFA</p>
                            )}
                            <button onClick={() => handleAccepter(d.id)}>Accepter cette demande</button>
                            <p style={{color: '#1A5E38',fontSize:'12px',marginTop:'5px'}}>Votre contact sera transmis au chargeur apres paiement de la commission par celui-ci et vous percevrez egalement son contact simultanement</p>
                            </li>
                    ))}
                    </ul>
                    </div>
    );
}

export default Transporteur;