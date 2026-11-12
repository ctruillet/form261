const path = require('path');
const { readJson, listJsonFiles, safeJsonFileName } = require('../services/fileService');

// Chemin vers le dossier contenant les paramètres
const parametersPath = path.join(__dirname, '../parameters');

// Méthode pour obtenir la liste des paramètres
exports.getParameters = (req, res) => {
  try {
    const parameters = [];
    listJsonFiles(parametersPath).forEach((file) => {
      try {
        const content = readJson(path.join(parametersPath, file), null);
        if (content) parameters.push({ ...content, file });
      } catch (error) {
        console.error(`Erreur de lecture du fichier paramètre ${file}:`, error);
      }
    });
    res.json(parameters);
  } catch (err) {
    console.error('Erreur getParameters:', err);
    res.status(500).send('Erreur lors de la lecture des paramètres');
  }
};

// Méthode pour obtenir un paramètre spécifique
exports.getParameterByName = (req, res) => {
  const fileName = safeJsonFileName(req.params.parameterName);
  if (!fileName) return res.status(400).send('Nom de paramètre invalide');

  try {
    const content = readJson(path.join(parametersPath, fileName), null);
    if (!content) return res.status(404).send('Parameter not found');
    res.json(content);
  } catch (parseErr) {
    console.error('Erreur de parsing:', parseErr);
    res.status(500).send('Erreur lors de la lecture du paramètre');
  }
};
