const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const MAX_TENTATIVES = 5;
const DUREE_BLOCAGE_MINUTES = 15;

router.post('/inscription', async (req, res) => {
    console.log('INSCRIPTION RECUE:', req.body);
    const { email, password, nom_complet, telephone, type_utilisateur } = req.body;
    const identifiant = email || telephone;
    if (!identifiant) {
        return res.status(400).json({ error: 'Email ou telephone requis' });
    }
    if (!password) {
        return res.status(400).json({ error: 'Mot de passe requis' });
    }
    try {
        if (telephone) {
            const telephoneExistant = await pool.query(
                'SELECT id FROM users WHERE telephone = $1',
                [telephone]
            );
            if (telephoneExistant.rows.length > 0) {
                return res.status(400).json({ error: 'Ce numero de telephone est deja utilise par un autre compte' });
            }
        }

        if (email) {
            const emailExistant = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );
            if (emailExistant.rows.length > 0) {
                return res.status(400).json({ error: 'Cet email est deja utilise par un autre compte' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email,password,nom_complet,telephone,type_utilisateur) VALUES ($1,$2,$3,$4,$5) RETURNING id,email,nom_complet,telephone,type_utilisateur',
            [email, hashedPassword, nom_complet, telephone, type_utilisateur]
        );
        const token = jwt.sign(
            { id: result.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        res.json({ token, user: result.rows[0] });
    } catch (error) {
        console.log('ERREUR INSCRIPTION:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/connexion', async (req, res) => {
    const { email, telephone, password } = req.body;
    const identifiant = email || telephone;
    console.log('Tentative connexion:', email, password);

    try {
        const tentativeResult = await pool.query(
            'SELECT * FROM tentatives_connexion WHERE type = $1 AND identifiant = $2',
            ['utilisateur', identifiant]
        );

        if (tentativeResult.rows.length > 0) {
            const tentative = tentativeResult.rows[0];

            if (tentative.bloque_jusqu && new Date(tentative.bloque_jusqu) > new Date()) {
                const minutesRestantes = Math.ceil((new Date(tentative.bloque_jusqu) - new Date()) / 60000);
                return res.status(429).json({
                    error: `Trop de tentatives. Reessayez dans ${minutesRestantes} minute(s).`
                });
            }

            if (tentative.bloque_jusqu && new Date(tentative.bloque_jusqu) <= new Date()) {
                await pool.query(
                    'UPDATE tentatives_connexion SET tentatives = 0, bloque_jusqu = NULL WHERE id = $1',
                    [tentative.id]
                );
            }
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR telephone = $1', [identifiant]
        );

        if (result.rows.length === 0) {
            await enregistrerTentativeEchouee(identifiant, tentativeResult);
            return res.status(401).json({ error: 'Utilisateur non trouve' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            const messageErreur = await enregistrerTentativeEchouee(identifiant, tentativeResult);
            return res.status(401).json({ error: messageErreur });
        }

        if (tentativeResult.rows.length > 0) {
            await pool.query(
                'UPDATE tentatives_connexion SET tentatives = 0, bloque_jusqu = NULL WHERE id = $1',
                [tentativeResult.rows[0].id]
            );
        }

        const token = jwt.sign(
            { id: user.id},
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        res.json({ token, user: { id: user.id, email: user.email, nom_complet: user.nom_complet, type_utilisateur: user.type_utilisateur, note_moyenne: user.note_moyenne } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function enregistrerTentativeEchouee(identifiant, tentativeResult) {
    if (tentativeResult.rows.length > 0) {
        const nouvelleTentative = tentativeResult.rows[0].tentatives + 1;
        const bloque = nouvelleTentative >= MAX_TENTATIVES;

        await pool.query(
            'UPDATE tentatives_connexion SET tentatives = $1, derniere_tentative = NOW(), bloque_jusqu = $2 WHERE id = $3',
            [nouvelleTentative, bloque ? new Date(Date.now() + DUREE_BLOCAGE_MINUTES * 60000) : null, tentativeResult.rows[0].id]
        );

        if (bloque) {
            return `Trop de tentatives. Compte bloque pendant ${DUREE_BLOCAGE_MINUTES} minutes.`;
        }
        return `Mot de passe incorrect. ${MAX_TENTATIVES - nouvelleTentative} tentative(s) restante(s).`;
    } else {
        await pool.query(
            'INSERT INTO tentatives_connexion (type, identifiant, tentatives) VALUES ($1, $2, 1)',
            ['utilisateur', identifiant]
        );
        return `Mot de passe incorrect. ${MAX_TENTATIVES - 1} tentative(s) restante(s).`;
    }
}

router.put('/changer-mot-de-passe', async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide' });
    }

    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
        return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }

    if (nouveauMotDePasse.length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caracteres' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(ancienMotDePasse, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
        }

        const nouveauHash = await bcrypt.hash(nouveauMotDePasse, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [nouveauHash, user.id]);

        res.json({ message: 'Mot de passe modifie avec succes' });
    } catch (error) {
        console.log('Erreur changement mot de passe utilisateur:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
