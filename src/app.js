require('dotenv').config();
const express = require('express');
const cors = require('cors');
const quoteRoutes = require('./routes/quote.routes');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Para etapa inicial. Luego puedes restringirlo.
    }
  }
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend de cotizaciones funcionando correctamente'
  });
});

app.use('/api', quoteRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada'
  });
});

module.exports = app;
