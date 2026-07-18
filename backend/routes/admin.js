const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/transactions', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, d.marchandise, d.ville_depart, d.ville_arrivee FROM transactions t JOIN demandes_transport d ON t.demande_id = d.id ORDER BY t.created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/demandes', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.*, uc.nom_complet as chargeur_nom, uc.telephone as chargeur_tel, ut.nom_complet as transporteur_nom, ut.telephone as transporteur_tel, t.commission_exdivia FROM demandes_transport d LEFT JOIN users uc ON d.chargeur_id = uc.id LEFT JOIN users ut ON d.transporteur_id = ut.id LEFT JOIN transactions t ON t.demande_id = d.id·WHERE d.statut = $1 ORDER BY d.created_at DESC',
      ['acceptee']
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/debloquer/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE·demandes_transport SET statut = $1 WHERE id = $2',
      ['contact_debloque', req.params.id]
    );
    res.json({ message: 'Contact débloqué avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;