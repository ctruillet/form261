const fs = require('fs');
const path = require('path');

// Chemin vers le dossier contenant les formulaires et les paramètres
const formsPath = path.join(__dirname, '../forms');

// Méthode pour obtenir la liste des formulaires
exports.getForms = (req, res) => {
  fs.readdir(formsPath, (err, files) => {
    if (err) return res.status(500).send(err);
    const forms = files.map(file => require(path.join(formsPath, file)));
    
    res.json(forms.map((forms, index) => {
      return { ...forms, file: files[index] };
    }));
  });
};

// Méthode pour obtenir un formulaire spécifique
exports.getFormByName = (req, res) => {
  const formName = req.params.formName;
  const formPath = path.join(formsPath, `${formName}`);

  console.log(formName);

  fs.readFile(formPath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Form not found');
    res.json(JSON.parse(data));
  });
};
