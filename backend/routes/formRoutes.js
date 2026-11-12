const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController.js');

router.get('/', formController.getForms); // Liste des questionnaires
router.post('/create', formController.createForm); // Créer un questionnaire
router.get('/:formID', formController.getFormByID); // Un questionnaire
router.put('/:formID', formController.updateForm); // Modifier un questionnaire
router.delete('/:formID', formController.deleteForm); // Supprimer un questionnaire

module.exports = router;
