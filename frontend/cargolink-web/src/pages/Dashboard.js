import React, { useState, useEffect } from 'react';
import VILLES from '../data/villes';
// import Messages from './Messages';
import Notations from './Notations';
import { getDemandesDisponibles, creerDemande, getMesDemandes } from '../services/api';
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

    console.log('mesDemandes:', mesDemandes);
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
                <p>Statut : <strong style={{color: d.statut === 'acceptee' ? 'green' : 'orange'}}>{d.statut}</strong></p>
                {d.transporteur_nom && <p>Transporteur : {d.transporteur_nom} - Note : {d.transporteur_note}/5</p>}
                {d.statut === 'acceptee' && d.transporteur_nom && (
                    <div style={{backgroundColor:'#FCE4D6',padding:'10px',borderRadius:'8px',marginTop:'10px'}}>
                        {!d.contact_debloque ? (
                            <div>
                        <p style={{color:'#C55A11',fontWeight:'bold'}}>** En attente de paiement de commission</p>
                        <p>Payez <strong>{Math.round(d.montant_final * 0.07)?.toLocaleString()} FCFA</strong> sur le numero EXDIVIA SARL : <strong>[694400065]</strong></p>
                        <p style={{fontSize:'12px',color:'#555'}}>Detail : Montant {(d.montant_final||0).toLocaleString()} FCFA - Commission 7% : {Math.round(d.montant_final * 0.07).toLocaleString()} FCFA - Transporteur percevra : {Math.round(d.montant_final * 0.93).toLocaleString()} FCFA</p>
                        <p style={{fontSize:'12px',color:'#888'}}>Vous recevrez le contact du transporteur dès validation du paiement</p>
                        </div>
                    ) : (
                        <div style={{backgroundColor:'#E8F5EE',padding:'10px',borderRadius:'8px'}}>
                            <p style={{color:'#1A5E38',fontWeight:'bold'}}>Contact debloque !</p>
                            <p>Transporteur : <strong>{d.transporteur_nom}</strong></p>
                            <Notations evaluaId={d.transporteur_id} demandeId={d.id} />
                            <p>Tel : <strong style={{color:'#C55A11'}}>{d.transporteur_tel}</strong></p>
                            </div>
                    )}
                    </div>
                )}
                </div>
        ))}
        <h3>Demandes disponibles</h3>
        <ul>
        {/* <Messages user={user} demandeId={1} />  */}
        {/* <Notations evalueId={1} demandeId={1} /> */}
        {demandes.map(d => (
            <li key={d.id}>{d.marchandise} - {d.ville_depart} vers {d.ville_arrivee}</li>
        ))}
        </ul>
        </div>
    );
}

export default Dashboard;