import React, { useState } from 'react';
import { connexion } from '../services/api';

function Connexion({ onConnexion }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [telephone, setTelephone] = useState('');
    const [erreur, setErreur] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await connexion({ email, telephone, password });
            localStorage.setItem('cargolink_token', res.data.token);
            localStorage.setItem('cargolink_user', JSON.stringify(res.data.user));
            onConnexion(res.data.user);
        } catch (err) {
            setErreur('Email ou mot de passe incorrect');
        }
    };

    return (
        <div className="page-connexion">
            <h2>Connexion Cargolink</h2>
            {erreur && <p className="erreur">{erreur}</p>}
            <input type="email" placeholder="Email (optionnel)" value={email} onChange={e => setEmail(e.target.value)} />
            <input placeholder="Ou votre numero de telephone" value={telephone} onChange={e => setTelephone(e.target.value)} />
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={handleSubmit}>Se connecter</button>
            </div>
    );
}

export default Connexion;