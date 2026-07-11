import React, { useState } from 'react';
import { inscription } from '../services/api';

function Inscription({ onInscription }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nomComplet, setNomComplet] = useState('');
    const [telephone, setTelephone] = useState('');
    const [typeUtilisateur, setTypeUtilisateur] = useState('chargeur');
    const [erreur, setErreur] = useState('');

    const handleSubmit = async () => {
        try {
            console.log('Tentative inscription');
            const res = await inscription({
                email,
                password,
                nom_complet: nomComplet,
                telephone,
                type_utilisateur: typeUtilisateur,
            });
            localStorage.setItem('cargolink_token', res.data.token);
            localStorage.setItem('cargolink_user', JSON.stringify(res.data.user));
            onInscription(res.data.user);
        } catch (err) {
            setErreur('Erreur lors de l inscription');
            }
        };

        return (
            <div className="page-inscription">
                <h2>Inscription Cargolink</h2>
                {erreur && <p className="erreur">{erreur}</p>}
                <input placeholder="Nom complet" value={nomComplet} onChange={e => setNomComplet(e.target.value)} />
                <input type="email" placeholder="Email (optionnel" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
                <input placeholder="Telephone" value={telephone} onChange={e => setTelephone(e.target.value)} />
                <select value={typeUtilisateur} onChange={e => setTypeUtilisateur(e.target.value)}>
                    <option value="chargeur">Chargeur</option>
                    <option value="transporteur">Transporteur</option>
                    </select>
                    <button onClick={handleSubmit}>S inscrire</button>
                    <button onClick={() => window.location.href='http://localhost:3000'}>Deja inscrit ? Retour accueil</button>
                    </div>
        );
    }
    export default Inscription;