const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const formRoutes = require('./routes/formRoutes');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

// Middleware pour analyser le JSON du corps des requêtes
app.use(express.json());

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Utiliser les routes
app.use('/api', formRoutes);




// Chemin vers le fichier JSON
const filePath = path.join(__dirname, 'data.json');

// Route POST pour recevoir des données et les enregistrer dans data.json
app.post('/api/registerData', (req, res) => {
  const newData = req.body;

  // Lire le contenu actuel du fichier JSON
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur de lecture du fichier' });
    }

    // Convertir les données JSON en un tableau JavaScript
    let jsonData = JSON.parse(data || '[]');

    // Ajouter les nouvelles données au tableau
    jsonData.push(newData);

    // Écrire le nouveau tableau dans le fichier JSON
    fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de l\'écriture du fichier' });
      }

      res.status(200).json({ message: 'Données enregistrées avec succès' });
    });
  });
});

app.post('/api/setFactors', (req, res) => {
    const newData = req.body;
    res.status(200).json({ message: 'Données enregistrées avec succès' });
  });

app.listen(PORT, () => console.log(`Serveur en écoute sur le port ${PORT}`));


app.get('/api/forms', (req, res) => {
  // Liste des formulaires prédéfinis
  const forms = [
    { name: 'NASA TLX', file: 'nasa-tlx.json' },
    { name: 'Simple Survey', file: 'simple-survey.json' },
  ];
  res.json(forms);
});

// Route pour récupérer le contenu d'un formulaire JSON
app.get('/api/form/:formName', (req, res) => {
  const formName = req.params.formName;
  const filePath = path.join(__dirname, 'forms', formName); // Chemin vers le dossier contenant les fichiers JSON

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Erreur lors de la lecture du fichier JSON');
    }
    try {
      res.json(JSON.parse(data)); // Renvoie le contenu du fichier JSON
    } catch (parseError) {
      return res.status(500).send('Erreur lors de l\'analyse du fichier JSON');
    }
  });
});