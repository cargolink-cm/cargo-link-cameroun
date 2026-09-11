import React, { useState, useEffect } from 'react';
import { getDemandesDisponibles, proposerOffre, getMesDemandesTransporteur } from '../services/api';

function Transporteur({ user }) {
    const [demandes, setDemandes] = useState([]);
    const [noteMoyenne, setNoteMoyenne] = useState(user?.note_moyenne || 0);
    const [mesDemandesAcceptees, setMesDemandesAcceptees] = useState([]);
    const [montants, setMontants] = useState({});
    const [immatriculations, setImmatriculations] = useState({});
    const [cartesGrises, setCartesGrises] = useState({});
    const [envoiEnCours, setEnvoiEnCours] = useState({});

    useEffect(() => {
        getDemandesDisponibles().then(res => setDemandes(res.data));
        getMesDemandesTransporteur().then(res => setMesDemandesAcceptees(res.data));
        setNoteMoyenne(user?.note_moyenne || 0);
        const interval = setInterval(() => {
            getDemandesDisponibles().then(res => setDemandes(res.data));
            getMesDemandesTransporteur().then(res => setMesDemandesAcceptees(res.data));
        }, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCarteGrise = (id, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setCartesGrises({ ...cartesGrises, [id]: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleProposer = async (id, budgetChargeur) => {
        if (!montants[id]) {
            alert('Veuillez saisir un montant');
            return;
        }
        if (!immatriculations[id]) {
            alert('Veuillez saisir l\'immatriculation du camion');
            return;
        }
        if (!cartesGrises[id]) {
            alert('Veuillez ajouter la carte grise du camion');
            return;
        }

        setEnvoiEnCours({ ...envoiEnCours, [id]: true });
        try {
            const res = await proposerOffre(id, {
                montant_propose: parseInt(montants[id]),
                immatriculation: immatriculations[id],
                carte_grise: cartesGrises[id]
            });

            if (res.data.dansLeBudget) {
                alert('Votre proposition a ete transmise au chargeur !');
            } else {
                alert('Votre proposition depasse le budget du chargeur. La demande reste visible pour d\'autres offres, mais le chargeur peut quand meme choisir votre proposition.');
            }

            setMontants({ ...montants, [id]: '' });
            setImmatriculations({ ...immatriculations, [id]: '' });
            setCartesGrises({ ...cartesGrises, [id]: '' });
            getDemandesDisponibles().then(res => setDemandes(res.data));
        } catch (error) {
            alert('Erreur lors de l\'envoi de la proposition');
        }
        setEnvoiEnCours({ ...envoiEnCours, [id]: false });
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Bonjour {user?.nom_complet}</h2>
                <p>Note moyenne : {noteMoyenne > 0 ? noteMoyenne + '/5' : 'Pas encore noté'}</p>
                <button className="btn_deconnexion" onClick={() => { localStorage.clear(); window.location.href='https://cargo-link-cameroun.vercel.app'; }}>Se deconnecter</button>
            </div>
            <h3>Mes demandes acceptées</h3>
            {mesDemandesAcceptees.map(d => (
                <div key={d.id} className="demande-card">
                    <p><strong>{d.marchandise}</strong> - {d.ville_depart} vers {d.ville_arrivee}</p>
                    <p>Type camion : <strong>{d.type_camion_souhaite || 'Tout type'}</strong></p>
                    <p>Montant total : <strong>{d.montant_final ? d.montant_final.toLocaleString() : 'Non defini'} FCFA</strong></p>
                    <p>Votre part : <strong style={{color:'#1A5E38'}}>{d.montant_final ? Math.round(d.montant_final*0.93).toLocaleString() : 'Non défini'} FCFA</strong></p>
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
                        <p><strong>Type camion :</strong> {d.type_camion_souhaite || 'Tout type'}</p>
                        <input placeholder="Votre montant en FCFA" value={montants[d.id] || ''} onChange={e => setMontants({...montants, [d.id]: e.target.value})} />
                        <input placeholder="Immatriculation du camion" value={immatriculations[d.id] || ''} onChange={e => setImmatriculations({...immatriculations, [d.id]: e.target.value})} style={{marginTop:'8px'}} />
                        <div style={{marginTop:'8px'}}>
                            <label style={{fontSize:'13px', color:'#1F4E79', fontWeight:'bold'}}>Carte grise du camion :</label>
                            <input type="file" accept="image/*" onChange={e => handleCarteGrise(d.id, e.target.files[0])} style={{marginTop:'5px'}} />
                            {cartesGrises[d.id] && <p style={{color:'#1A5E38', fontSize:'12px'}}>✓ Carte grise ajoutee</p>}
                        </div>
                        {montants[d.id] && (
                            <div style={{backgroundColor:'#D6E4F0', padding:'10px',borderRadius:'8px',marginTop:'5px'}}>
                                <p><strong>Recapitulatif :</strong></p>
                                <p>Montant total : <strong>{parseInt(montants[d.id]).toLocaleString()} FCFA</strong></p>
                                <p>Commission EXDIVIA SARL (7%) : <strong style={{color:'#C55A11'}}>{Math.round(parseInt(montants[d.id]) * 0.07).toLocaleString()} FCFA</strong></p>
                                <p>Vous percevrez : <strong style={{color:'#1A5E38'}}>{Math.round(parseInt(montants[d.id]) * 0.93).toLocaleString()} FCFA</strong></p>
                            </div>
                        )}
                        {montants[d.id] && parseInt(montants[d.id]) > d.budget_final && (
                            <p style={{color:'red',fontSize:'12px',marginTop:'5px'}}>ATTENTION : Votre montant depasse le budget du chargeur ({d.budget_final} FCFA). La demande restera visible pour d'autres offres.</p>
                        )}
                        <button onClick={() => handleProposer(d.id, d.budget_final)} disabled={envoiEnCours[d.id]}>
                            {envoiEnCours[d.id] ? 'Envoi en cours...' : 'Proposer cette offre'}
                        </button>
                        <p style={{color: '#1A5E38',fontSize:'12px',marginTop:'5px'}}>Votre contact sera transmis au chargeur apres paiement de la commission par celui-ci et vous percevrez egalement son contact simultanement</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Transporteur;
