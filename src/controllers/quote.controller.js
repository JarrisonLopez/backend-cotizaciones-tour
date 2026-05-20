const PRICES = require('../data/prices');
const { calculateQuote } = require('../services/quote.service');
const { generateQuotePdf } = require('../services/pdf.service');

function getPrices(req, res) {
  res.json({ ok: true, prices: PRICES });
}

function postQuote(req, res) {
  try {
    const quote = calculateQuote(req.body);
    res.json(quote);
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
}

async function postQuotePdf(req, res) {
  try {
    const quote = calculateQuote(req.body);
    const pdfBuffer = await generateQuotePdf(quote, req.body.cliente || {});

    const filename = `cotizacion-colombia-inspira-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
}

module.exports = {
  getPrices,
  postQuote,
  postQuotePdf
};
