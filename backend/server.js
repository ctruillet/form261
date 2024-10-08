const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

// Middleware pour analyser le JSON du corps des requêtes
app.use(express.json());

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

app.listen(PORT, () => console.log(`Serveur en écoute sur le port ${PORT}`));
