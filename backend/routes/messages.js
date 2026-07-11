const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
console.log('Route messages chargée');

router.post('/', auth, async (req, res) => {
    console.log('MESSAGE RECU:', req.body);
    const { demande_id, contenu } = req.body;
try {
    const result = await pool.query(
        'INSERT INTO messages (expediteur_id, demande_id, contenu) VALUES ($1,$2,$3) RETURNING *',
        [req.user.id, demande_id, contenu]
    );
    res.json(result.rows[0]);
} catch (error) {
    res.status(500).json({ error: error.message });
}
});

router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT m.*, u.nom_complet as expediteur_nom FROM messages m JOIN users u ON m.expediteur_id = u.id WHERE m.demande_id = $1 ORDER BY m.created_at ASC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;