const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quote.controller');

router.get('/precios', quoteController.getPrices);
router.post('/cotizar', quoteController.postQuote);
router.post('/cotizar/pdf', quoteController.postQuotePdf);

module.exports = router;
