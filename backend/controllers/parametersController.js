const fs = require('fs');
const path = require('path');

// Chemin vers le dossier contenant les formulaires et les paramètres
const parametersPath = path.join(__dirname, '../parameters');

// Méthode pour obtenir la liste des paramètres
exports.getParameters = (req, res) => {
  fs.readdir(parametersPath, (err, files) => {
    if (err) return res.status(500).send(err);
    const jsonFiles = (files || []).filter((file) => path.extname(file) === '.json');
    const parameters = [];

    jsonFiles.forEach((file) => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(parametersPath, file), 'utf8'));
        parameters.push({ ...content, file });
      } catch (error) {
        console.error(`Erreur de lecture du fichier paramètre ${file}:`, error);
      }
    });

    res.json(parameters);
  });
};

// Méthode pour obtenir un paramètre spécifique
exports.getParameterByName = (req, res) => {
  let parameterName = req.params.parameterName;
  if (!parameterName.endsWith('.json')) {
    parameterName = `${parameterName}.json`;
  }
  const parameterFilePath = path.join(parametersPath, parameterName);

  fs.readFile(parameterFilePath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Parameter not found');
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      console.error('Erreur de parsing:', parseErr);
      res.status(500).send('Erreur lors de la lecture du paramètre');
    }
  });
};
