const fs = require('fs');
const path = require('path');

// Chemin vers le fichier où les données sont stockées
const dataFilePath = path.join(__dirname, '../data.json');

// Enregistrer les données soumises via un formulaire
exports.registerData = (req, res) => {
  const newData = req.body;

  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur de lecture du fichier' });
    }

    let jsonData = JSON.parse(data || '[]');
    jsonData.push(newData);

    fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de l\'écriture du fichier' });
      }
      res.status(200).json({ message: 'Données enregistrées avec succès' });
    });
  });
};

// Enregistrer les facteurs
exports.setFactors = (req, res) => {
  res.status(200).json({ message: 'Données enregistrées avec succès' });
};
