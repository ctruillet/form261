const express = require('express');
const router = express.Router();
const protocolController = require('../controllers/protocolController');

router.get('/', protocolController.getProtocol);
router.post('/', protocolController.updateProtocol);
router.get('/stats', protocolController.getProtocolStats);

module.exports = router;
