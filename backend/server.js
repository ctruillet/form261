const express = require('express');
const cors = require('cors');
const fieldsRoutes = require('./routes/fieldsRoutes');
const dataRoutes = require('./routes/dataRoutes');
const parametersRoutes = require('./routes/parametersRoutes');
const formRoutes = require('./routes/formRoutes');
const participantRoutes = require('./routes/participantRoutes');

const app = express();
const PORT = 5000;

// Middleware pour analyser le JSON et les corps de requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Utiliser les routes
app.use('/api/fields', fieldsRoutes); // Routes liées aux fields
app.use('/api/parameters', parametersRoutes); // Routes liées aux parametres
app.use('/api/data', dataRoutes); // Routes liées à la gestion des données
app.use('/api/forms', formRoutes); // Routes liées aux formulaires
app.use('/api/participants', participantRoutes); // Routes liées aux participants

// Démarrer le serveur
app.listen(PORT, () => console.log(`Serveur en écoute sur le port ${PORT}`));
