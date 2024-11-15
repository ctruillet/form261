const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const axios = require('axios'); // Pour effectuer les requêtes HTTP
const { v4: uuidv4 } = require('uuid'); // Utilisé pour générer des IDs uniques

// Chemin vers le fichier où les données sont stockées
// const dataFilePath = path.join(__dirname, '../data.json');
const answersFolderPath = path.join(__dirname, '../answers/');

// Fonction pour aplatir un objet JSON
const flattenObject = (obj, parent = '', res = {}) => {
  for (let key in obj) {
    const propName = key;

    if (Array.isArray(obj[key])) {
      // Si c'est un tableau, crée des clés pour chaque élément
      obj[key].forEach((item, index) => {
        const arrayKey = `${propName}.${index+1}`;
        if (typeof item === 'object' && item !== null) {
          flattenObject(item, arrayKey, res); // Aplati les objets imbriqués dans le tableau
        } else {
          res[arrayKey] = item;
        }
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Si c'est un objet (non tableau), aplatir récursivement
      flattenObject(obj[key], propName, res);
    } else {
      // Ajoute les valeurs primitives directement
      res[propName] = obj[key];
    }
  }
  return res;
};


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



exports.exportResponsesToExcel = (req, res) => {
  const outputFilePath = path.join(__dirname, 'exported_responses.xlsx');

  // Lis les fichiers dans le dossier des réponses
  fs.readdir(answersFolderPath, (err, files) => {
    if (err) {
      console.error('Erreur lors de la lecture du dossier:', err);
      return res.status(500).json({ message: 'Erreur de lecture du dossier des réponses' });
    }

    const workbook = xlsx.utils.book_new(); // Crée un nouveau classeur Excel

    // Traite chaque fichier JSON
    files.forEach((file) => {
      if (path.extname(file) === '.json') {
        const filePath = path.join(answersFolderPath, file);
        var sheetName = path.basename(file, '.json'); // Nom de la feuille (nom du fichier sans extension)

        try {
          const fileData = fs.readFileSync(filePath, 'utf8');
          const responses = JSON.parse(fileData);

          // Transforme les données en format tabulaire
          const worksheetData = responses.map((response, index) => ({
            Index: index + 1, // Ajoute un numéro de ligne
            ...flattenObject(response),
          }));

          // Crée une feuille Excel à partir des données
          const worksheet = xlsx.utils.json_to_sheet(worksheetData);

          // Ajoute la feuille au classeur
          sheetName = responses.length > 0 ? responses[0].name : `${sheetName} (empty)`;
          sheetName = sheetName.length > 31 ? sheetName.substring(0, 31) : sheetName; // Limite la longueur du nom de la feuille à 31 caractères
          
          xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
        } catch (readError) {
          console.error(`Erreur lors du traitement du fichier ${file}:`, readError);
        }
      }
    });

    // Écrit le classeur Excel dans un fichier
    xlsx.writeFile(workbook, outputFilePath);

    // Télécharge le fichier Excel
    res.download(outputFilePath, 'exported_responses.xlsx', (downloadErr) => {
      if (downloadErr) {
        console.error('Erreur lors du téléchargement du fichier:', downloadErr);
        res.status(500).json({ message: 'Erreur lors du téléchargement du fichier Excel' });
      } else {
        console.log('Fichier Excel téléchargé avec succès');
      }
    });
  });
};