import React, { useState } from 'react';
import axios from 'axios';

function Notation({ evalueId, demandeId, onNotationEnvoyee }) {
    const [note, setNote] = useState(5);
    const [commentaire, setCommentaire] = useState('');
    const [envoye, setEnvoye] = useState(false);

    const envoyerNotation = async () => {
        const token = localStorage.getItem('cargolink_token');
        await axios.post('http://localhost:5000/api/notations', {
            evalue_id: evalueId,
            demande_id: demandeId,
            note: parseInt(note),
            commentaire
        }, {
            headers: { Authorization: 'Bearer ' + token }
        });
        setEnvoye(true);
        if (onNotationEnvoyee) onNotationEnvoyee();
    }

    if (envoye) return <p className="notation-envoyee">Merci pour votre notation !</p>;

    return (
        <div className="notation">
            <h4>Noter cet utilisateur</h4>
            <select value={note} onChange={e => setNote(e.target.value)}>
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Tres bien</option>
                <option value={3}>3 - Bien</option>
                <option value={2}>2 - Passable</option>
                <option value={1}>1 - Mauvais</option>
                </select>
                <input placeholder="Commentaire (optionnel)" value={commentaire} onChange={e => setCommentaire(e.target.value)} />
                <button onClick={envoyerNotation}>Envoyer la notation</button>
                </div>
    );
}

export default Notation;