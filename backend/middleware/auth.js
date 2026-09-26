const jwt = require('jsonwebtoken');
const pool = require('../config/database');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        pool.query('UPDATE users SET derniere_activite = NOW() WHERE id = $1', [decoded.id])
            .catch(err => console.log('Erreur mise a jour activite:', err.message));

        next();
    } catch (error) {
        res.status(401).json({ error: 'Token invalide' });
    }
};
