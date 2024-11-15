const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Utilisé pour générer des IDs uniques

// Chemin vers le fichier où les données sont stockées
// const dataFilePath = path.join(__dirname, '../data.json');
const answersFolderPath = path.join(__dirname, '../answers/');

// Enregistrer les données soumises via un formulaire
exports.registerData = (req, res) => {
  const data = { ...req.body, id: uuidv4() }; // Ajoute un ID unique à chaque nouvelle réponse
  const answersFilePath = path.join(answersFolderPath, `${data.formID}.json`);

  fs.readFile(answersFilePath, 'utf8', (err, fileData) => {
    let jsonData = [];

    // Si le fichier n'existe pas, initialise jsonData comme un tableau vide
    if (err) {
      if (err.code === 'ENOENT') {
        console.log(`Fichier ${data.formID}.json non trouvé, création d'un nouveau fichier.`);
      } else {
        console.error(err);
        return res.status(500).json({ message: 'Erreur de lecture du fichier' });
      }
    } else {
      // Si le fichier existe, parse son contenu
      try {
        jsonData = JSON.parse(fileData || '[]');
      } catch (parseError) {
        console.error('Erreur de parsing du fichier:', parseError);
        return res.status(500).json({ message: 'Erreur de parsing du fichier' });
      }
    }

    // Ajoute les nouvelles données au tableau
    jsonData.push(data);

    // Écrit les données mises à jour dans le fichier
    fs.writeFile(answersFilePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de l\'écriture du fichier' });
      }
      res.status(200).json({ message: 'Données enregistrées avec succès', id: data.id });
    });
  });
};

// Modifier une réponse via le formulaire
exports.modifyData = (req, res) => {
  const data = req.body;
  const id = data.id;
  const answersFilePath = path.join(answersFolderPath, `${data.formID}.json`);

  fs.readFile(answersFilePath, 'utf8', (err, fileData) => {
    let jsonData = [];

    // Si le fichier n'existe pas, initialise jsonData comme un tableau vide
    if (err) {
      if (err.code === 'ENOENT') {
        console.log(`Fichier ${data.formID}.json non trouvé, création d'un nouveau fichier.`);
      } else {
        console.error(err);
        return res.status(500).json({ message: 'Erreur de lecture du fichier' });
      }
    } else {
      // Si le fichier existe, parse son contenu
      try {
        jsonData = JSON.parse(fileData || '[]');
      } catch (parseError) {
        console.error('Erreur de parsing du fichier:', parseError);
        return res.status(500).json({ message: 'Erreur de parsing du fichier' });
      }
    }

    // Cherche la réponse à modifier par son ID
    const index = jsonData.findIndex((item) => item.id === id);

    if (index === -1) {
      // Si la réponse n'est pas trouvée, retourne une erreur
      return res.status(404).json({ message: 'Réponse non trouvée' });
    }

    // Met à jour les données de la réponse
    jsonData[index] = { ...jsonData[index], ...data };

    // Écrit les données mises à jour dans le fichier
    fs.writeFile(answersFilePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
      if (writeErr) {
        console.error(writeErr);
        return res.status(500).json({ message: 'Erreur lors de l\'écriture du fichier' });
      }

      res.status(200).json({ message: 'Données modifiées avec succès', id });
    });
  });
};


// Récupérer toutes les réponses
exports.getAllResponses = (req, res) => {
  fs.readdir(answersFolderPath, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur de lecture du dossier de réponses' });
    }

    const allResponses = [];

    files.forEach((file, index) => {
      const filePath = path.join(answersFolderPath, file);
      
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data || '[]');
        allResponses.push({ file: file, content: jsonData });
      } catch (error) {
        console.error(`Erreur de lecture du fichier ${file}:`, error);
      }

      // Envoie la réponse une fois tous les fichiers lus
      if (index === files.length - 1) {
        res.status(200).json(allResponses);
      }
    });
  });
};

// Récuperer les réponses d'un formulaire spécifique
exports.getResponsesByFormID = (req, res) => {
  const formID = req.params.formID;
  const answersFilePath = path.join(answersFolderPath, `${formID}.json`);

  fs.readFile(answersFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Erreur de lecture du fichier ${answersFilePath}:`, err);
      return res.status(500).json({ message: `Erreur de lecture du fichier ${formID}.json de réponses` });
    }

    try {
      const jsonData = JSON.parse(data || '[]');
      return res.status(200).json(jsonData);
    } catch (parseError) {
      console.error('Erreur de parsing du fichier:', parseError);
      return res.status(500).json({ message: 'Erreur de parsing du fichier de réponses' });
    }
  });
};

// Supprimer une réponse
exports.deleteResponse = (req, res) => {
  const id = req.params.id;
  const formID = req.params.formID;
  const answersFilePath = path.join(answersFolderPath, `${formID}.json`);

  fs.readFile(answersFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur de lecture des réponses' });
    }

    let jsonData = JSON.parse(data || '[]');
    jsonData = jsonData.filter((response) => response.id !== id);

    fs.writeFile(answersFilePath, JSON.stringify(jsonData, null, 2), (err) => {
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
  const id = req.params.id;
  const formID = req.params.formID;
  const answersFilePath = path.join(answersFolderPath, `${formID}.json`);

  const updatedData = req.body;

  fs.readFile(answersFilePath, 'utf8', (err, data) => {
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

    fs.writeFile(answersFilePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour de la réponse' });
      }
      res.status(200).json({ message: 'Réponse mise à jour avec succès' });
    });
  });
};
