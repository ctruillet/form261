const fs = require('fs');
const path = require('path');

// Chemin vers le dossier contenant les formulaires et les paramètres
const fieldsDirectory = path.join(__dirname, '../fields');

// Méthode pour obtenir la liste des formulaires
exports.getFields = (req, res) => {
  fs.readdir(fieldsDirectory, (err, files) => {
    if (err) return res.status(500).send(err);
    const fields = files.map(file => require(path.join(fieldsDirectory, file)));
    
    res.json(fields.map((fields, index) => {
      return { ...fields, file: files[index] };
    }));
  });
};

// Méthode pour obtenir un formulaire spécifique
exports.getFieldsByName = (req, res) => {
  const fieldsName = req.params.fieldsName;
  const fieldsPath = path.join(fieldsDirectory, `${fieldsName}`);

  // console.log(fieldsPath);

  fs.readFile(fieldsPath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Form not found');
    res.json(JSON.parse(data));
  });
};
