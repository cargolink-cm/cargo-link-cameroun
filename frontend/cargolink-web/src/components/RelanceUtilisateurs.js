import React, { useState } from 'react';

const LIEN = 'https://play.google.com/store/apps/details?id=com.exdivia.cargolink';
const CLE = 'cargolink_relances';

function lireRelances() {
    try {
        return JSON.parse(localStorage.getItem(CLE) || '{}');
    } catch (e) {
        return {};
    }
}

function ecrireRelances(obj) {
    try {
        localStorage.setItem(CLE, JSON.stringify(obj));
    } catch (e) {
        // stockage indisponible : on continue sans memoire
    }
}

export function extrairePrenom(nomComplet) {
    const titres = ['mr', 'mr.', 'm', 'm.', 'mme', 'mme.', 'mlle', 'dr', 'dr.', 'pr', 'pr.'];
    const mots = String(nomComplet || '').trim().split(/\s+/).filter(Boolean);
    const mot = mots.find(m => !titres.includes(m.toLowerCase()));
    if (!mot || mot.length < 2 || /\d/.test(mot)) return '';
    return mot.charAt(0).toUpperCase() + mot.slice(1).toLowerCase();
}

export function normaliserTelephone(tel) {
    let n = String(tel || '').replace(/[^\d+]/g, '');
    if (n.startsWith('+')) n = n.slice(1);
    else if (n.startsWith('00')) n = n.slice(2);
    if (/^6\d{8}$/.test(n)) return '237' + n;
    if (/^2376\d{8}$/.test(n)) return n;
    if (n.length >= 10 && n.length <= 15) return n;
    return null;
}

export function construireMessage(utilisateur) {
    const prenom = extrairePrenom(utilisateur.nom_complet);
    const salut = prenom ? 'Bonjour *' + prenom + '* 👋' : 'Bonjour 👋';
    const bande = '🟦🟧🟦🟧🟦🟧🟦🟧🟦🟧';
    const avantages = utilisateur.type_utilisateur === 'transporteur'
        ? [
            '🚚 *Trouvez des chargements* partout au Cameroun',
            '💰 *Proposez votre prix* directement',
            '✅ *Remplissez vos camions*, inscription gratuite'
        ]
        : [
            '🚛 *Publiez votre transport* en quelques minutes',
            '💰 *Comparez les offres* des transporteurs',
            '✅ *Choisissez la meilleure*, inscription gratuite'
        ];
    return (
        bande + '\n' +
        '🚛 *C A R G O L I N K*\n' +
        '🟧 *C A M E R O U N* 🟧\n' +
        bande + '\n\n' +
        salut + '\n\n' +
        'Vous vous êtes inscrit(e) sur *CargoLink Cameroun*, mais vous n\'avez pas encore essayé l\'application.\n\n' +
        avantages.join('\n') + '\n\n' +
        '📲 *Installez-la gratuitement :*\n' +
        LIEN + '\n\n' +
        'Besoin d\'aide ? Répondez à ce message 🙏\n' +
        '_CargoLink Cameroun, by EXDIVIA_'
    );
}

function RelanceUtilisateurs({ utilisateurs }) {
    const [jours, setJours] = useState(7);
    const [type, setType] = useState('tous');
    const [relances, setRelances] = useState(lireRelances());

    const maintenant = Date.now();
    const jour = 24 * 3600 * 1000;

    const inactifs = (utilisateurs || [])
        .filter(u => type === 'tous' || u.type_utilisateur === type)
        .filter(u => (maintenant - new Date(u.created_at).getTime()) > jour)
        .filter(u => !u.derniere_activite || (maintenant - new Date(u.derniere_activite).getTime()) > jours * jour)
        .sort((a, b) => {
            const ra = relances[a.id] ? 1 : 0;
            const rb = relances[b.id] ? 1 : 0;
            return ra - rb;
        });

    const relancer = (u) => {
        const numero = normaliserTelephone(u.telephone);
        if (!numero) return;
        const url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(construireMessage(u));
        window.open(url, '_blank');
        const maj = { ...relances, [u.id]: new Date().toISOString() };
        setRelances(maj);
        ecrireRelances(maj);
    };

    return (
        <div className="admin-section">
            <h2>Relancer les inscrits inactifs</h2>
            <p style={{ color: '#555', fontSize: 14 }}>
                Inscrits depuis plus d'un jour et sans activité depuis {jours} jours (ou jamais connectés).
                Conseil : 10 à 15 relances par jour maximum, une par une.
            </p>
            <div className="admin-tabs">
                {['tous', 'chargeur', 'transporteur'].map(t => (
                    <button key={t} className={type === t ? 'tab-actif' : 'tab'} onClick={() => setType(t)}>
                        {t === 'tous' ? 'Tous' : t === 'chargeur' ? 'Chargeurs' : 'Transporteurs'}
                    </button>
                ))}
                <select value={jours} onChange={e => setJours(parseInt(e.target.value, 10))} style={{ marginLeft: 10, padding: 6 }}>
                    <option value={3}>3 jours</option>
                    <option value={7}>7 jours</option>
                    <option value={15}>15 jours</option>
                    <option value={30}>30 jours</option>
                </select>
            </div>
            <p><strong>{inactifs.length}</strong> personne(s) à relancer</p>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Téléphone</th>
                            <th>Type</th>
                            <th>Dernière activité</th>
                            <th>Relance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inactifs.map(u => {
                            const valide = !!normaliserTelephone(u.telephone);
                            const deja = relances[u.id];
                            return (
                                <tr key={u.id}>
                                    <td>{u.nom_complet}</td>
                                    <td>{u.telephone}</td>
                                    <td>{u.type_utilisateur}</td>
                                    <td>{u.derniere_activite ? new Date(u.derniere_activite).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                                    <td>
                                        {valide ? (
                                            <button
                                                onClick={() => relancer(u)}
                                                style={{ background: deja ? '#7f8c8d' : '#25D366', color: 'white', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                {deja ? 'Relancer à nouveau' : 'Relancer sur WhatsApp'}
                                            </button>
                                        ) : (
                                            <span style={{ color: '#c0392b' }}>Numéro invalide</span>
                                        )}
                                        {deja && (
                                            <div style={{ fontSize: 12, color: '#555' }}>
                                                Relancé le {new Date(deja).toLocaleDateString('fr-FR')}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default RelanceUtilisateurs;
