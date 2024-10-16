const fs = require('fs');
const path = require('path');

// Fonction pour obtenir tous les formulaires dans le dossier "forms"
exports.getAllForms = (formsPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(formsPath, (err, files) => {
      if (err) {
        return reject(err);
      }

      // Filtrer les fichiers JSON et lire leur contenu pour extraire le champ "name"
      const forms = files.filter(file => path.extname(file) === '.json')
        .map(file => {
          const content = fs.readFileSync(path.join(formsPath, file), 'utf8');
          const parsedContent = JSON.parse(content);
          return { name: parsedContent.name, file };
        });

      resolve(forms);
    });
  });
};
