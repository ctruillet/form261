const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController.js');

// Route pour obtenir la liste des formulaires
router.get('/', formController.getForms);

// Route pour obtenir un formulaire spécifique par son nom
router.get('/name=:formName', formController.getFormsDetails);

// Route pour obtenir un formulaire spécifique par son fields et param
router.get('/fields=:fieldsName&param=:paramName', formController.getFormName);

module.exports = router;
