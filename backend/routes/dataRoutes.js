const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Route pour enregistrer des données soumises via un formulaire
router.post('/registerData', dataController.registerData);
router.put('/modifyData', dataController.modifyData);


// Routes pour la gestion des réponses
router.get('/responses', dataController.getAllResponses); // Récupérer toutes les réponses
router.get('/responses/formID=:formID', dataController.getResponsesByFormID); // Récupérer les réponses d'un formulaire spécifique
router.delete('/responses/formID=:formID:id', dataController.deleteResponse); // Supprimer une réponse
router.put('/responses/formID=:formID:id', dataController.updateResponse); // Mettre à jour une réponse

module.exports = router;
