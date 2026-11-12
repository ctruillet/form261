const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Saisie : enregistrer / modifier une réponse
router.post('/registerData', dataController.registerData);
router.put('/modifyData', dataController.modifyData);

// Consultation et exports
router.get('/responses', dataController.getAllResponses);
router.get('/responses/exportResponsesToExcel', dataController.exportResponsesToExcel); // Excel, une feuille par questionnaire
router.get('/responses/exportTidyCSV', dataController.exportTidyCSV); // CSV format long (R / JASP / Python)
router.get('/responses/id=:id', dataController.getResponseByID);
router.delete('/responses/id=:id', dataController.deleteResponseByID);

module.exports = router;
