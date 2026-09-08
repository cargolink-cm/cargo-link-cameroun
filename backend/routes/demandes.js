const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
    console.log('User ID:', req.user);
    console.log('Body:', req.body);
    const {marchandise, ville_depart, ville_arrivee, date_souhaitee, poids_tonnes, budget_final, type_camion_souhaite } = req.body;
    const regexTel = /(\+?237|0)?\s*[0-9]{8,9}/g;
    const champsAVerifier = [marchandise, ville_depart, ville_arrivee];
    for (const champ of champsAVerifier) {
        if (champ && regexTel.test(champ)) {
            return res.status(400).json({ error: 'Les coordonnees personnelles sont interdites dans les champs de demande' });
        }
    }
    try {
        const result = await pool.query(
            'INSERT INTO demandes_transport (chargeur_id,marchandise,ville_depart,ville_arrivee,date_souhaitee,poids_tonnes,budget_final,type_camion_souhaite) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [req.user.id, marchandise, ville_depart, ville_arrivee, date_souhaitee, poids_tonnes, budget_final, type_camion_souhaite]
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

// NOUVELLE ROUTE - Proposer un montant sur une demande
router.post('/:id/proposer', auth, async (req, res) => {
    const { montant_propose, immatriculation, carte_grise } = req.body;
    const demandeId = req.params.id;

    if (!montant_propose || !immatriculation) {
        return res.status(400).json({ error: 'Montant et immatriculation obligatoires' });
    }

    try {
        // Récupérer le budget du chargeur pour cette demande
        const demandeResult = await pool.query(
            'SELECT budget_final, statut FROM demandes_transport WHERE id = $1',
            [demandeId]
        );

        if (demandeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Demande introuvable' });
        }

        const demande = demandeResult.rows[0];

        if (demande.statut !== 'en_attente') {
            return res.status(400).json({ error: 'Cette demande n\'est plus disponible' });
        }

        // Enregistrer la proposition
        await pool.query(
            'INSERT INTO propositions (demande_id, transporteur_id, montant_propose, immatriculation, carte_grise) VALUES ($1,$2,$3,$4,$5)',
            [demandeId, req.user.id, montant_propose, immatriculation, carte_grise || null]
        );

        // Si le montant proposé est <= au budget du chargeur, la demande se ferme
        if (parseInt(montant_propose) <= parseInt(demande.budget_final)) {
            await pool.query(
                'UPDATE demandes_transport SET statut = $1 WHERE id = $2',
                ['proposee', demandeId]
            );
            res.json({ message: 'Proposition envoyee. Demande fermee aux autres transporteurs.', dansLeBudget: true });
        } else {
            res.json({ message: 'Votre proposition depasse le budget du chargeur. La demande reste visible pour d\'autres offres.', dansLeBudget: false });
        }
    } catch (error) {
        console.log('ERREUR PROPOSITION:', error);
        res.status(500).json({ error: error.message });
    }
});

// NOUVELLE ROUTE - Voir toutes les propositions reçues pour une demande (chargeur)
router.get('/:id/propositions', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, u.nom_complet as transporteur_nom, u.telephone as transporteur_tel, u.note_moyenne as transporteur_note
             FROM propositions p
             JOIN users u ON p.transporteur_id = u.id
             WHERE p.demande_id = $1
             ORDER BY p.montant_propose ASC, p.created_at ASC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NOUVELLE ROUTE - Le chargeur choisit une proposition
router.put('/:id/choisir-proposition', auth, async (req, res) => {
    const { proposition_id } = req.body;
    const demandeId = req.params.id;

    try {
        const propResult = await pool.query(
            'SELECT * FROM propositions WHERE id = $1 AND demande_id = $2',
            [proposition_id, demandeId]
        );

        if (propResult.rows.length === 0) {
            return res.status(404).json({ error: 'Proposition introuvable' });
        }

        const proposition = propResult.rows[0];
        const commission = Math.round(proposition.montant_propose * 0.07);
        const montant_transporteur = proposition.montant_propose - commission;

        await pool.query(
            'UPDATE demandes_transport SET transporteur_id=$1, statut=$2, montant_final=$3, immatriculation=$4, carte_grise=$5 WHERE id=$6',
            [proposition.transporteur_id, 'acceptee', proposition.montant_propose, proposition.immatriculation, proposition.carte_grise, demandeId]
        );

        await pool.query(
            'INSERT INTO transactions (demande_id, montant_total, commission_exdivia, montant_transporteur) VALUES ($1,$2,$3,$4)',
            [demandeId, proposition.montant_propose, commission, montant_transporteur]
        );

        await pool.query(
            'UPDATE propositions SET statut = $1 WHERE id = $2',
            ['acceptee', proposition_id]
        );

        res.json({ message: 'Proposition choisie avec succes' });
    } catch (error) {
        console.log('ERREUR CHOIX PROPOSITION:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ancienne route acceptee gardee pour compatibilite
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

router.get('/mes-demandes-transporteur', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT d.*, uc.nom_complet as chargeur_nom, uc.telephone as chargeur_tel FROM demandes_transport d LEFT JOIN users uc ON d.chargeur_id = uc.id WHERE d.transporteur_id = $1 ORDER BY d.created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
