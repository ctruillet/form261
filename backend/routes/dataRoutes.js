const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Route pour enregistrer des données soumises via un formulaire
router.post('/registerData', dataController.registerData);

// Route pour enregistrer les facteurs
router.post('/setFactors', dataController.setFactors);

module.exports = router;
