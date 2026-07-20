const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
    console.log('User ID:', req.user);
    console.log('Body:', req.body);
    const {marchandise, ville_depart, ville_arrivee, date_souhaitee, poids_tonnes, budget_final } = req.body;
    const regexTel = /(\+?237|0)?\s*[0-9]{8,9}/g;
    const champsAVerifier = [marchandise, ville_depart, ville_arrivee];
    for (const champ of champsAVerifier) {
        if (champ && regexTel.test(champ)) {
            return res.status(400).json({ error: 'Les coordonnees personnelles sont interdites dans les champs de demande' });
        }
    }
    try {
        const result = await pool.query(
            'INSERT INTO demandes_transport (chargeur_id,marchandise,ville_depart,ville_arrivee,date_souhaitee,poids_tonnes,budget_final) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [req.user.id, marchandise, ville_depart, ville_arrivee, date_souhaitee, poids_tonnes, budget_final]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.log('ERREUR COMPLETE:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/disponibles', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT d.*, u.nom_complet as chargeur_nom, u.note_moyenne as chargeur_note FROM demandes_transport d JOIN users u ON d.chargeur_id = u.id WHERE d.statut = $1 ORDER BY d.created_at DESC',
            ['en_attente']
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/accepter', auth, async (req, res) => {
    const { montant_final } = req.body;
    const commission = Math.round(montant_final * 0.07);
    const montant_transporteur = montant_final - commission;
    try {
        await pool.query(
            'UPDATE demandes_transport SET transporteur_id=$1, statut=$2, montant_final=$3 WHERE id=$4',
            [req.user.id, 'acceptee', montant_final, req.params.id]
        );
        await pool.query(
            'INSERT INTO transactions (demande_id, montant_total, commission_exdivia, montant_transporteur) VALUES ($1,$2,$3,$4)',
            [req.params.id, montant_final, commission, montant_transporteur]
        );
        res.json({ message: 'demande acceptee avec succes' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/mes-demandes', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT d.*, u.nom_complet as transporteur_nom, u.telephone as transporteur_tel, u.note_moyenne as transporteur_note FROM demandes_transport d LEFT JOIN users u ON d.transporteur_id = u.id WHERE d.chargeur_id = $1 ORDER BY d.created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});        
module.exports = router; 