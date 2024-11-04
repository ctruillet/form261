const express = require('express');
const router = express.Router();
const fieldsController = require('../controllers/fieldsController');

// Route pour obtenir la liste des formulaires
router.get('/', fieldsController.getFields);

// Route pour obtenir un formulaire spécifique
router.get('/:fieldsName', fieldsController.getFieldsByName);

module.exports = router;
