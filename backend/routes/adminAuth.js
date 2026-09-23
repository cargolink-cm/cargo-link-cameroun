const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const MAX_TENTATIVES = 5;
const DUREE_BLOCAGE_MINUTES = 15;

router.post('/login', async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Mot de passe requis' });
    }

    try {
        const identifiant = 'admin';
        const tentativeResult = await pool.query(
            'SELECT * FROM tentatives_connexion WHERE type = $1 AND identifiant = $2',
            ['admin', identifiant]
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
            'SELECT * FROM admin_config ORDER BY id DESC LIMIT 1'
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: 'Configuration admin introuvable' });
        }

        const admin = result.rows[0];
        const valide = await bcrypt.compare(password, admin.mot_de_passe_hash);

        if (!valide) {
            if (tentativeResult.rows.length > 0) {
                const nouvelleTentative = tentativeResult.rows[0].tentatives + 1;
                const bloque = nouvelleTentative >= MAX_TENTATIVES;

                await pool.query(
                    'UPDATE tentatives_connexion SET tentatives = $1, derniere_tentative = NOW(), bloque_jusqu = $2 WHERE id = $3',
                    [nouvelleTentative, bloque ? new Date(Date.now() + DUREE_BLOCAGE_MINUTES * 60000) : null, tentativeResult.rows[0].id]
                );

                if (bloque) {
                    return res.status(429).json({
                        error: `Trop de tentatives. Compte bloque pendant ${DUREE_BLOCAGE_MINUTES} minutes.`
                    });
                }

                return res.status(401).json({
                    error: `Mot de passe incorrect. ${MAX_TENTATIVES - nouvelleTentative} tentative(s) restante(s).`
                });
            } else {
                await pool.query(
                    'INSERT INTO tentatives_connexion (type, identifiant, tentatives) VALUES ($1, $2, 1)',
                    ['admin', identifiant]
                );
                return res.status(401).json({
                    error: `Mot de passe incorrect. ${MAX_TENTATIVES - 1} tentative(s) restante(s).`
                });
            }
        }

        if (tentativeResult.rows.length > 0) {
            await pool.query(
                'UPDATE tentatives_connexion SET tentatives = 0, bloque_jusqu = NULL WHERE id = $1',
                [tentativeResult.rows[0].id]
            );
        }

        const token = jwt.sign(
            { admin: true, id: admin.id },
            process.env.JWT_SECRET || 'cargolink_secret_key',
            { expiresIn: '24h' }
        );

        res.json({ token, message: 'Connexion admin reussie' });
    } catch (error) {
        console.log('Erreur login admin:', error);
        res.status(500).json({ error: error.message });
    }
});

const authAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token admin manquant' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cargolink_secret_key');
        if (!decoded.admin) {
            return res.status(403).json({ error: 'Acces non autorise' });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token admin invalide' });
    }
};

router.put('/changer-mot-de-passe', authAdmin, async (req, res) => {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
        return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }

    if (nouveauMotDePasse.length < 8) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caracteres' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM admin_config ORDER BY id DESC LIMIT 1'
        );

        const admin = result.rows[0];
        const valide = await bcrypt.compare(ancienMotDePasse, admin.mot_de_passe_hash);

        if (!valide) {
            return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
        }

        const nouveauHash = await bcrypt.hash(nouveauMotDePasse, 10);

        await pool.query(
            'INSERT INTO admin_config (mot_de_passe_hash) VALUES ($1)',
            [nouveauHash]
        );

        res.json({ message: 'Mot de passe modifie avec succes' });
    } catch (error) {
        console.log('Erreur changement mot de passe:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/reinitialiser-mot-de-passe', authAdmin, async (req, res) => {
    const { identifiant, nouveauMotDePasse } = req.body;

    if (!identifiant || !nouveauMotDePasse) {
        return res.status(400).json({ error: 'Identifiant et nouveau mot de passe requis' });
    }

    if (nouveauMotDePasse.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caracteres' });
    }

    try {
        const userResult = await pool.query(
            'SELECT id, nom_complet, telephone, email FROM users WHERE email = $1 OR telephone = $1',
            [identifiant]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable avec cet identifiant' });
        }

        const user = userResult.rows[0];
        const nouveauHash = await bcrypt.hash(nouveauMotDePasse, 10);

        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [nouveauHash, user.id]
        );

        res.json({
            message: 'Mot de passe reinitialise avec succes',
            user: { nom_complet: user.nom_complet, telephone: user.telephone, email: user.email }
        });
    } catch (error) {
        console.log('Erreur reinitialisation mot de passe:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/rechercher-utilisateur/:identifiant', authAdmin, async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT id, nom_complet, telephone, email, type_utilisateur FROM users WHERE email = $1 OR telephone = $1',
            [req.params.identifiant]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        res.json(userResult.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = { router, authAdmin };
