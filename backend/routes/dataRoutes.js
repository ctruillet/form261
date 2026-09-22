const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Route pour enregistrer des données soumises via un formulaire
router.post('/registerData', dataController.registerData);
router.put('/modifyData', dataController.modifyData);


// Routes pour la gestion des réponses
router.get('/responses', dataController.getAllResponses); // Récupérer toutes les réponses
router.get('/responses/exportResponsesToExcel', dataController.exportResponsesToExcel); // Télécharger toutes les réponses Excel
router.get('/responses/exportTidyCSV', dataController.exportTidyCSV); // Exporter au format Tidy Data (CSV long format pour R / JASP)
router.get('/responses/exportJSON', dataController.exportResponsesToJSON); // Exporter au format JSON
router.get('/responses/formID=:formID', dataController.getResponsesByFormID); // Récupérer les réponses d'un formulaire spécifique
router.get('/responses/id=:id', dataController.getResponseByID);
router.delete('/responses/id=:id', dataController.deleteResponseByID); // Supprimer une réponse
router.put('/responses/formID=:formID&id=:id', dataController.updateResponse); // Mettre à jour une réponse
router.put('/responses/:formID/:id', dataController.updateResponse);

module.exports = router;
