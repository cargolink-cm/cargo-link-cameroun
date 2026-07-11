const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.connect((err) => {
  if (err) {
    console.error('Erreur connexion PostgreSQL:', err);
  } else {
    console.log('Connecte a PostgreSQL - Cargolink');
  }
});

    module.exports = pool;