const fs = require('fs');
const path = require('path');
const fileService = require('../services/fileService');

// Chemin vers le dossier contenant les formulaires
const formsPath = path.join(__dirname, '../forms');

// Obtenir la liste des formulaires (dynamique)
exports.getForms = (req, res) => {
  // console.log('get forms');
  fileService.getAllForms(formsPath)
    .then(forms => res.json(forms))
    .catch(err => res.status(500).json({ message: 'Erreur lors de la récupération des formulaires' }));
};

// Obtenir un formulaire spécifique par son nom
exports.getFormByName = (req, res) => {
  // console.log(`get form by name: ${req.params.formName}`);
  const formName = req.params.formName;
  const formPath = path.join(formsPath, formName);


  fs.readFile(formPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Erreur lors de la lecture du fichier JSON');
    }
    try {
      res.json(JSON.parse(data)); // Renvoie le contenu du fichier JSON
    } catch (parseError) {
      return res.status(500).send('Erreur lors de l\'analyse du fichier JSON');
    }
  });
};
