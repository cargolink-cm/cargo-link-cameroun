const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

router.post('/login', async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Mot de passe requis' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM admin_config ORDER BY id DESC LIMIT 1'
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ error: 'Configuration admin introuvable' });
        }

        const admin = result.rows[0];
        const valide = await bcrypt.compare(password, admin.mot_de_passe_hash);

        if (!valide) {
            return res.status(401).json({ error: 'Mot de passe incorrect' });
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

module.exports = { router, authAdmin };
