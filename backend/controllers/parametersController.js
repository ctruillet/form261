const fs = require('fs');
const path = require('path');

// Chemin vers le dossier contenant les formulaires et les paramètres
const parametersPath = path.join(__dirname, '../parameters');

// Méthode pour obtenir la liste des paramètres
exports.getParameters = (req, res) => {
  fs.readdir(parametersPath, (err, files) => {
    if (err) return res.status(500).send(err);
    const parameters = files.map(file => require(path.join(parametersPath, file)));
    
    // res.json(parameters);
    // add field file name in the response
    res.json(parameters.map((parameter, index) => {
      return { ...parameter, file: files[index] };
    }));
  });
};

// Méthode pour obtenir un paramètre spécifique
exports.getParameterByName = (req, res) => {
  // console.log(req.params.parameterName);
  const parameterName = req.params.parameterName;
  const parameterPath = path.join(parametersPath, `${parameterName}`);

  fs.readFile(parameterPath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Parameter not found');
    res.json(JSON.parse(data));
  });
};
