const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController.js');

// Route pour obtenir la liste des formulaires
router.get('/', formController.getForms);

// Route pour créer un nouveau formulaire
router.post('/create', formController.createForm);

// Route pour obtenir un formulaire spécifique par son nom
router.get('/name=:formName', formController.getFormByName);

// Route pour obtenir un formulaire spécifique par son fields et param
router.get('/fields=:fieldsName&param=:paramName', formController.getFormByFieldsAndParam);

// Route pour obtenir un formulaire spécifique via son id
router.get('/id=:formID', formController.getFormByID);
router.get('/:formID', formController.getFormByID);

// Route pour mettre à jour un formulaire
router.put('/id=:formID', formController.updateForm);
router.put('/:formID', formController.updateForm);

// Route pour supprimer un formulaire
router.delete('/id=:formID', formController.deleteForm);
router.delete('/:formID', formController.deleteForm);

module.exports = router;

