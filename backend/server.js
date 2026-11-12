const express = require('express');
const cors = require('cors');
const fieldsRoutes = require('./routes/fieldsRoutes');
const dataRoutes = require('./routes/dataRoutes');
const parametersRoutes = require('./routes/parametersRoutes');
const formRoutes = require('./routes/formRoutes');
const participantRoutes = require('./routes/participantRoutes');
const protocolRoutes = require('./routes/protocolRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware pour analyser le JSON et les corps de requêtes
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Utiliser les routes
app.use('/api/fields', fieldsRoutes); // Routes liées aux fields
app.use('/api/parameters', parametersRoutes); // Routes liées aux parametres
app.use('/api/data', dataRoutes); // Routes liées à la gestion des données
app.use('/api/forms', formRoutes); // Routes liées aux formulaires
app.use('/api/participants', participantRoutes); // Routes liées aux participants
app.use('/api/protocol', protocolRoutes); // Routes liées au protocole et contrebalancement

// Route d'API inconnue : réponse JSON explicite plutôt que la page HTML par défaut
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route inconnue : ${req.method} ${req.originalUrl}` });
});

// Gestionnaire d'erreurs global (corps JSON invalide, erreur non interceptée...)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Corps de requête JSON invalide' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Corps de requête trop volumineux' });
  }
  console.error('Erreur non gérée :', err);
  res.status(err.status || 500).json({ message: 'Erreur interne du serveur' });
});

// Démarrer le serveur
const server = app.listen(PORT, () => console.log(`Serveur en écoute sur le port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. Arrêtez l'autre instance ou définissez la variable PORT.`);
  } else {
    console.error('Erreur au démarrage du serveur :', err);
  }
  process.exit(1);
});
