const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
    const {evalue_id, demande_id, note, commentaire } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO notations (evaluateur_id, evalue_id, demande_id, note, commentaire) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [req.user.id, evalue_id, demande_id, note, commentaire]
        );
        await pool.query(
            'UPDATE users SET note_moyenne = (SELECT AVG(note) FROM notations WHERE evalue_id = $1) WHERE id = $1',
            [evalue_id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/user/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT n.*, u.nom_complet as evaluateur_nom FROM notations n JOIN users u ON n.evaluateur_id = u.id WHERE n.evalue_id = $1 ORDER BY n.created_at DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;