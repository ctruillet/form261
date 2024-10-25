const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Route pour enregistrer des données soumises via un formulaire
router.post('/registerData', dataController.registerData);


// Routes pour la gestion des réponses
router.get('/responses', dataController.getAllResponses); // Récupérer toutes les réponses
router.delete('/responses/:id', dataController.deleteResponse); // Supprimer une réponse
router.put('/responses/:id', dataController.updateResponse); // Mettre à jour une réponse

module.exports = router;
