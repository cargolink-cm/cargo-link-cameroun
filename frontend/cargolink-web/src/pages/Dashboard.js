import React, { useState, useEffect } from 'react';
import VILLES from '../data/villes';
import Notations from './Notations';
import { getDemandesDisponibles, creerDemande, getMesDemandes, getPropositions, choisirProposition } from '../services/api';
import TYPES_CAMIONS from '../data/camions';

function Dashboard({ user }) {
    const [demandes, setDemandes] = useState([]);
    const [mesDemandes, setMesDemandes] = useState([]);
    const [marchandise, setMarchandise] = useState('');
    const [villeDepart, setVilleDepart] = useState('');
    const [villeArrivee, setVilleArrivee] = useState('');
    const [dateSouhaitee, setDateSouhaitee] = useState('');
    const [poids, setPoids] = useState('');
    const [budget, setBudget] = useState('');
    const [typeCamion, setTypeCamion] = useState('Tout type de camion');
    const [propositions, setPropositions] = useState({});
    const [demandeOuverte, setDemandeOuverte] = useState(null);
    const [carteGriseAffichee, setCarteGriseAffichee] = useState(null);

    useEffect(() => {
        getDemandesDisponibles().then(res => setDemandes(res.data));
        getMesDemandes().then(res => setMesDemandes(res.data));
        const interval = setInterval(() => {
            getDemandesDisponibles().then(res => setDemandes(res.data));
            getMesDemandes().then(res => setMesDemandes(res.data));
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCreerDemande = async () => {
        await creerDemande({
            marchandise,
            ville_depart: villeDepart,
            ville_arrivee: villeArrivee,
            date_souhaitee: dateSouhaitee,
            poids_tonnes: poids,
            budget_final: budget,
            type_camion_souhaite: typeCamion,
        });
        getDemandesDisponibles().then(res => setDemandes(res.data));
    };

    const handleVoirPropositions = async (demandeId) => {
        if (demandeOuverte === demandeId) {
            setDemandeOuverte(null);
            return;
        }
        try {
            const res = await getPropositions(demandeId);
            setPropositions({ ...propositions, [demandeId]: res.data });
            setDemandeOuverte(demandeId);
        } catch (error) {
            alert('Impossible de charger les propositions');
        }
    };

    const handleChoisirProposition = async (demandeId, propositionId, montant) => {
        if (!window.confirm('Voulez-vous choisir cette proposition de ' + montant.toLocaleString() + ' FCFA ?')) {
            return;
        }
        try {
            await choisirProposition(demandeId, propositionId);
            alert('Proposition choisie ! Vous pouvez maintenant payer la commission.');
            setDemandeOuverte(null);
            getMesDemandes().then(res => setMesDemandes(res.data));
        } catch (error) {
            alert('Impossible de choisir cette proposition');
        }
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
            <select value={typeCamion} onChange={e => setTypeCamion(e.target.value)}>
                <option value="">Type de camion souhaité</option>
                {TYPES_CAMIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={handleCreerDemande}>Publier la demande</button>
            <h3>Mes demandes</h3>
            {mesDemandes.map(d => (
                <div key={d.id} className="demande-card">
                    <p><strong>{d.marchandise}</strong> - {d.ville_depart} vers {d.ville_arrivee}</p>
                    <p>Budget : {d.budget_final?.toLocaleString()} FCFA</p>
                    <p>Statut : <strong style={{color: d.statut === 'acceptee' ? 'green' : d.statut === 'proposee' ? '#C55A11' : 'orange'}}>{d.statut}</strong></p>

                    {d.transporteur_nom && <p>Transporteur : {d.transporteur_nom}</p>}

                    {d.contact_debloque ? (
                        <div style={{backgroundColor:'#E8F5EE',padding:'10px',borderRadius:'8px',marginTop:'10px'}}>
                            <p style={{color:'#1A5E38',fontWeight:'bold'}}>Contact debloque !</p>
                            <p>Tel : <strong style={{color:'#C55A11'}}>{d.transporteur_tel}</strong></p>
                            {d.immatriculation && <p>Immatriculation : <strong>{d.immatriculation}</strong></p>}
                            {d.carte_grise && (
                                <p>
                                    <button onClick={() => setCarteGriseAffichee(d.carte_grise)} style={{background:'none', border:'none', color:'#1F4E79', textDecoration:'underline', cursor:'pointer', padding:0}}>
                                        Voir la carte grise
                                    </button>
                                </p>
                            )}
                            <p style={{color:'#C55A11',fontWeight:'bold'}}>Montant a verser : {Math.round((d.montant_final || 0) * 0.93).toLocaleString()} FCFA</p>
                            <Notations evalueId={d.transporteur_id} demandeId={d.id} />
                        </div>
                    ) : d.statut === 'acceptee' ? (
                        <div style={{backgroundColor:'#FCE4D6',padding:'10px',borderRadius:'8px',marginTop:'10px'}}>
                            <p style={{color:'#C55A11',fontWeight:'bold'}}>En attente de paiement de commission</p>
                            <p>Payez <strong>{Math.round((d.montant_final||0) * 0.07)?.toLocaleString()} FCFA</strong> sur le numero MTN <strong>680893650</strong> ou Orange <strong>689925673</strong> EXDIVIA SARL pour recevoir le contact du transporteur.</p>
                            <p>Vous devrez ensuite remettre <strong>{Math.round((d.montant_final||0) * 0.93).toLocaleString()} FCFA</strong> au transporteur.</p>
                        </div>
                    ) : d.statut === 'en_attente' || d.statut === 'proposee' ? (
                        <div>
                            {d.statut === 'proposee' && (
                                <p style={{color:'#C55A11', fontStyle:'italic', fontSize:'13px'}}>Votre demande reste ouverte en attente d'une meilleure offre</p>
                            )}
                            <button onClick={() => handleVoirPropositions(d.id)} style={{backgroundColor:'#1F4E79', color:'white'}}>
                                {demandeOuverte === d.id ? 'Masquer les propositions' : 'Voir les propositions recues'}
                            </button>

                            {demandeOuverte === d.id && (
                                <div style={{marginTop:'10px'}}>
                                    {propositions[d.id]?.length === 0 && (
                                        <p style={{color:'#888', fontStyle:'italic'}}>Aucune proposition recue pour le moment</p>
                                    )}
                                    {propositions[d.id]?.map(prop => (
                                        <div key={prop.id} style={{backgroundColor:'#f9f9f9', padding:'12px', borderRadius:'8px', marginTop:'8px', border:'1px solid #eee'}}>
                                            <p style={{fontSize:'18px', fontWeight:'bold', color:'#1F4E79'}}>{prop.montant_propose.toLocaleString()} FCFA</p>
                                            {d.budget_final && prop.montant_propose > d.budget_final && (
                                                <p style={{color:'#C55A11', fontSize:'12px'}}>Depasse votre budget de {(prop.montant_propose - d.budget_final).toLocaleString()} FCFA</p>
                                            )}
                                            <p>Transporteur : {prop.transporteur_nom}</p>
                                            <p>Note : {prop.transporteur_note || 'Pas encore note'}/5</p>
                                            <button onClick={() => handleChoisirProposition(d.id, prop.id, prop.montant_propose)} style={{backgroundColor:'#1A5E38', color:'white'}}>
                                                Choisir cette proposition
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            ))}
            <h3>Demandes disponibles</h3>
            <ul>
                {demandes.map(d => (
                    <li key={d.id}>{d.marchandise} - {d.ville_depart} vers {d.ville_arrivee}</li>
                ))}
            </ul>

            {carteGriseAffichee && (
                <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}} onClick={() => setCarteGriseAffichee(null)}>
                    <div style={{backgroundColor:'white', padding:'15px', borderRadius:'12px', maxWidth:'90%', maxHeight:'90%'}}>
                        <img src={carteGriseAffichee} alt="Carte grise" style={{maxWidth:'100%', maxHeight:'70vh'}} />
                        <button onClick={() => setCarteGriseAffichee(null)} style={{marginTop:'10px', width:'100%'}}>Fermer</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
