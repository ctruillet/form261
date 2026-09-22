const fs = require('fs');
const path = require('path');

// Chemin vers le dossier contenant les formulaires et les paramètres
const fieldsDirectory = path.join(__dirname, '../fields');

// Méthode pour obtenir la liste des formulaires
exports.getFields = (req, res) => {
  fs.readdir(fieldsDirectory, (err, files) => {
    if (err) return res.status(500).send(err);
    const jsonFiles = (files || []).filter((file) => path.extname(file) === '.json');
    const fields = [];

    jsonFiles.forEach((file) => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(fieldsDirectory, file), 'utf8'));
        fields.push({ ...content, file });
      } catch (error) {
        console.error(`Erreur de lecture du fichier fields ${file}:`, error);
      }
    });

    res.json(fields);
  });
};

// Méthode pour obtenir un formulaire spécifique
exports.getFieldsByName = (req, res) => {
  let fieldsName = req.params.fieldsName;
  if (!fieldsName.endsWith('.json')) {
    fieldsName = `${fieldsName}.json`;
  }
  const fieldsPath = path.join(fieldsDirectory, fieldsName);

  fs.readFile(fieldsPath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Form not found');
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      console.error('Erreur de parsing:', parseErr);
      res.status(500).send('Erreur lors de la lecture du formulaire');
    }
  });
};
