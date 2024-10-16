const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Utilisé pour générer des IDs uniques

// Chemin vers le fichier où les données sont stockées
const dataFilePath = path.join(__dirname, '../data.json');

// Enregistrer les données soumises via un formulaire
exports.registerData = (req, res) => {
  const newData = { ...req.body, id: uuidv4() }; // Ajouter un ID unique à chaque nouvelle réponse

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

// Récupérer toutes les réponses
exports.getAllResponses = (req, res) => {
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur de lecture des réponses' });
    }

    const jsonData = JSON.parse(data || '[]');
    res.status(200).json(jsonData);
  });
};

// Supprimer une réponse
exports.deleteResponse = (req, res) => {
  const { id } = req.params;

  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur de lecture des réponses' });
    }

    let jsonData = JSON.parse(data || '[]');
    jsonData = jsonData.filter((response) => response.id !== id);

    fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de la suppression de la réponse' });
      }
      res.status(200).json({ message: 'Réponse supprimée avec succès' });
    });
  });
};

// Mettre à jour une réponse
exports.updateResponse = (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur de lecture des réponses' });
    }

    let jsonData = JSON.parse(data || '[]');
    const responseIndex = jsonData.findIndex((response) => response.id === id);

    if (responseIndex === -1) {
      return res.status(404).json({ message: 'Réponse non trouvée' });
    }

    jsonData[responseIndex] = { ...jsonData[responseIndex], ...updatedData };

    fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour de la réponse' });
      }
      res.status(200).json({ message: 'Réponse mise à jour avec succès' });
    });
  });
};
