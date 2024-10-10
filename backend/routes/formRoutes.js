// backend/routes/formRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Chemin du dossier où les formulaires seront sauvegardés
const formsDirectory = path.join(__dirname, '..', 'forms');

// Route pour sauvegarder un formulaire
router.post('/save-form', (req, res) => {
  const form = req.body;

  // Assurez-vous que le dossier "forms" existe, sinon le créer
  if (!fs.existsSync(formsDirectory)) {
    fs.mkdirSync(formsDirectory);
  }

  // Sauvegarder le formulaire dans un fichier JSON
  const filePath = path.join(formsDirectory, `${form.name}.json`);

  fs.writeFile(filePath, JSON.stringify(form, null, 2), (err) => {
    if (err) {
      console.error('Erreur lors de la sauvegarde du formulaire:', err);
      return res.status(500).send('Erreur lors de la sauvegarde du formulaire');
    }

    console.log(`Formulaire "${form.name}" sauvegardé avec succès.`);

    // Renvoie le contenu du formulaire pour l'utiliser directement dans la page form
    res.json(form);
  });
});

module.exports = router;
