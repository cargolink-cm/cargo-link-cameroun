const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Cargolink API - EXDIVIA SARL' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {;
      console.log('Serveur Cargolink démarré sur le port ' + PORT);
});