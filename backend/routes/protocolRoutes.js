const express = require('express');
const router = express.Router();
const protocolController = require('../controllers/protocolController');

router.get('/', protocolController.getProtocol); // Protocole actif (avec ses blocs calculés)
router.post('/', protocolController.updateProtocol); // Enregistrer le protocole
router.post('/preview', protocolController.previewProtocol); // Calculer les blocs sans enregistrer
router.get('/stats', protocolController.getProtocolStats); // Répartition des sujets par bloc

module.exports = router;
