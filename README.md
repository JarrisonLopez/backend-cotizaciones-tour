# Backend Cotizaciones Tour - Colombia Inspira

Backend en Node.js + Express para calcular cotizaciones de tours con precios quemados y generación de PDF.

## Instalar

```bash
npm install
```

## Ejecutar local

```bash
npm run dev
```

O:

```bash
npm start
```

## Variables de entorno

Crea un archivo `.env`:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## Endpoints

### Ver precios

```http
GET /api/precios
```

### Calcular cotización

```http
POST /api/cotizar
```

Body de ejemplo:

```json
{
  "cliente": {
    "nombre": "Cliente prueba",
    "email": "cliente@correo.com",
    "telefono": "3000000000"
  },
  "adultos": 4,
  "ninos5a12": 2,
  "ninosMenores5": 1,
  "ninosMayores7": 2,
  "dias": 5,
  "hospedajeAdulto": "doble",
  "hospedajeNino": "doble",
  "incluirAlimentacion": true,
  "margen": 0.35,
  "transporte": {
    "camioneta4x4": {
      "cantidad": 2
    },
    "taxisAeropuerto": true
  },
  "actividades": {
    "safariDiaCompleto": true,
    "cabalgata": true,
    "amanecer": true,
    "avistamientoRio": true,
    "caminataDiurna": true,
    "caminataNocturna": true
  },
  "costoGuias": 0,
  "costosAdministrativos": 0,
  "costoSostenibilidadPersona": 0,
  "incluirTourLider": true,
  "incluirHonorariosStaff": true,
  "incluirComision": true
}
```

### Descargar PDF

```http
POST /api/cotizar/pdf
```

Usa el mismo body de `/api/cotizar`.

## Conexión desde frontend

```js
const API_URL = 'https://tu-backend.onrender.com';

async function cotizar(data) {
  const response = await fetch(`${API_URL}/api/cotizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  return response.json();
}

async function descargarPDF(data) {
  const response = await fetch(`${API_URL}/api/cotizar/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cotizacion.pdf';
  link.click();
  window.URL.revokeObjectURL(url);
}
```

## Render

- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variable: `FRONTEND_URL=https://tu-frontend.com`
