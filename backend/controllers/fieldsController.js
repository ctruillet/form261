const path = require('path');
const { readJson, listJsonFiles, safeJsonFileName } = require('../services/fileService');

// Chemin vers le dossier contenant les définitions de questions
const fieldsDirectory = path.join(__dirname, '../fields');

// Méthode pour obtenir la liste des formulaires
exports.getFields = (req, res) => {
  try {
    const fields = [];
    listJsonFiles(fieldsDirectory).forEach((file) => {
      try {
        const content = readJson(path.join(fieldsDirectory, file), null);
        if (content) fields.push({ ...content, file });
      } catch (error) {
        console.error(`Erreur de lecture du fichier fields ${file}:`, error);
      }
    });
    res.json(fields);
  } catch (err) {
    console.error('Erreur getFields:', err);
    res.status(500).send('Erreur lors de la lecture des formulaires');
  }
};

// Méthode pour obtenir un formulaire spécifique
exports.getFieldsByName = (req, res) => {
  const fileName = safeJsonFileName(req.params.fieldsName);
  if (!fileName) return res.status(400).send('Nom de formulaire invalide');

  try {
    const content = readJson(path.join(fieldsDirectory, fileName), null);
    if (!content) return res.status(404).send('Form not found');
    res.json(content);
  } catch (parseErr) {
    console.error('Erreur de parsing:', parseErr);
    res.status(500).send('Erreur lors de la lecture du formulaire');
  }
};
