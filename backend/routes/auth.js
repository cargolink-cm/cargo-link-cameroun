const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

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
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR telephone = $1', [identifiant]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Utilisateur non trouve' });
        }
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Mot de passe incorrect' });
        }
        const token = jwt.sign(
            { id: user.id},
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        res.json({ token, user: { id: user.id, email: user.email, nom_complet: user.nom_complet, type_utilisateur: user.type_utilisateur } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;