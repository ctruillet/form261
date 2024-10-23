const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fieldsRoutes = require('./routes/fieldsRoutes');
const dataRoutes = require('./routes/dataRoutes');
const parametersRoutes = require('./routes/parametersRoutes');
const formRoutes = require('./routes/formRoutes');

const app = express();
const PORT = 5000;

// Middleware pour analyser le JSON du corps des requêtes
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Utiliser les routes
app.use('/api/fields', fieldsRoutes); // Routes liées aux fields
app.use('/api/parameters', parametersRoutes); // Routes liées aux parametres
app.use('/api/data', dataRoutes); // Routes liées à la gestion des données
app.use('/api/forms', formRoutes); // Routes liées aux formulaires

// Démarrer le serveur
app.listen(PORT, () => console.log(`Serveur en écoute sur le port ${PORT}`));
