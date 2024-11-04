const express = require('express');
const router = express.Router();
const parametersController = require('../controllers/parametersController');


// Route pour obtenir la liste des paramètres
router.get('/', parametersController.getParameters);

// Route pour obtenir un paramètre spécifique
router.get('/:parameterName', parametersController.getParameterByName);

module.exports = router;
