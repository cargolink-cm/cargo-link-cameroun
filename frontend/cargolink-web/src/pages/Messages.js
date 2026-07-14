import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Messages({ user, demandeId }) {
    const [messages, setMessages] = useState([]);
    const demandeIdRef = demandeId;
    const [contenu, setContenu] = useState('');

    useEffect(() => {
        chargerMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [demandeId]);

    const chargerMessages = async () => {
        try {
        const token = localStorage.getItem('cargolink_token');
        const res = await axios.get('https://cargo-link-production.up.railway.app/api/messages/' + demandeId, {
            headers: { Authorization: 'Bearer ' + token}
        });
        setMessages(res.data);
    } catch (error) {
        console.log('Erreur chargement messages:', error);
    }
    };

    const envoyerMessage = async () => {
        const token = localStorage.getItem('cargolink_token');
        console.log('demandeId envoi:', demandeId);
        await axios.post('https://cargo-link-cameroun-production.up.railway.app/api/messages', {
            demande_id: demandeIdRef,
            contenu
        }, {
            headers: { Authorization: 'Bearer ' + token }
        });
        setContenu('');
        chargerMessages();
    };

    return (
        <div className="messagerie">
            <h3>Messagerie</h3>
            <div className="messages-liste">
                {messages.map(m => (
                    <div key={m.id} className={m.expediteur_id === user.id ? 'messsage-moi' : 'message-autre'}>
                        <p>{m.contenu}</p>
                        <small>{m.expediteur_nom}</small>
                        </div>
                ))}
                </div>
                <div className="message-input">
                    <input placeholder="Votre message..." value={contenu} onChange={e => setContenu(e.target.value)} />
                    <button onClick={envoyerMessage}>Envoyer</button>
                    </div>
                    </div>
    );
}

export default Messages;