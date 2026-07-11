const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const demandesRoutes = require('./routes/demandes');
const messagesRoutes = require('./routes/messages');
const notationsRoutes = require('./routes/notations');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/demandes', demandesRoutes);
app.get('/test-messages', (req, res) => res.json({ ok: true }));
app.use('/api/messages', messagesRoutes);
app.use('/api/notations', notationsRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Cargolink API -EXDIVIA SARL' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Serveur Cargolink demarre sur le port ' + PORT);
});