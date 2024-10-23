const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController.js');

// Route pour obtenir la liste des formulaires
router.get('/', formController.getForms);

// Route pour obtenir un formulaire spécifique
router.get('/:formName', formController.getFormsDetails);

module.exports = router;
