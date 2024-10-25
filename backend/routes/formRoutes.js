const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController.js');

// Route pour obtenir la liste des formulaires
router.get('/', formController.getForms);

// Route pour obtenir un formulaire spécifique par son nom
router.get('/name=:formName', formController.getFormByName);

// Route pour obtenir un formulaire spécifique par son fields et param
router.get('/fields=:fieldsName&param=:paramName', formController.getFormByFieldsAndParam);

// Route pour obtenir un formulaire spécifique via son id
router.get('/id=:formID', formController.getFormByID);

module.exports = router;
