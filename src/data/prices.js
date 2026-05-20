const PRICES = {
  transporte: {
    tiquetesStaff: {
      label: 'Tiquetes Staff',
      price: 850000,
      unit: 'dia'
    },
    comidaStaff: {
      label: 'Comida Staff',
      price: 250000,
      unit: 'dia'
    },
    taxisAeropuerto: {
      label: 'Taxis Aeropuerto',
      price: 50000,
      unit: 'dia'
    },
    camioneta4x4: {
      label: 'Camionetas 4x4 (4 personas)',
      price: 1250000,
      unit: 'dia'
    }
  },

  hospedajeAdulto: {
    sencilla: { label: 'Habitación sencilla adulto', price: 242000 },
    doble: { label: 'Habitación doble adulto', price: 193000 },
    triple: { label: 'Habitación triple adulto', price: 145000 },
    cuadruple: { label: 'Habitación cuádruple adulto', price: 135000 },
    hamaca: { label: 'Hamaca adulto', price: 94000 },
    camping: { label: 'Camping adulto', price: 64000 }
  },

  hospedajeNino: {
    sencilla: { label: 'Habitación sencilla niño 5 a 12', price: 121000 },
    doble: { label: 'Habitación doble niño 5 a 12', price: 96500 },
    triple: { label: 'Habitación triple niño 5 a 12', price: 72500 },
    cuadruple: { label: 'Habitación cuádruple niño 5 a 12', price: 67500 },
    hamaca: { label: 'Hamaca niño 5 a 12', price: 47000 },
    camping: { label: 'Camping niño 5 a 12', price: 32000 }
  },

  alimentacion: {
    adulto: { label: 'Alimentación completa adulto', price: 159000 },
    nino: { label: 'Alimentación completa niño', price: 79500 }
  },

  actividades: {
    safariDiaCompleto: {
      label: 'Safari Jeep día completo',
      type: 'rango',
      prices: {
        '1-3': 1200000,
        '4-9': 350000,
        '10+': 320000
      }
    },
    safariMedioDia: {
      label: 'Safari Jeep medio día',
      type: 'rango',
      prices: {
        '1-3': 780000,
        '4-9': 195000,
        '10+': 175000
      }
    },
    cabalgata: {
      label: 'Cabalgata',
      type: 'persona',
      price: 180000
    },
    amanecer: {
      label: 'Amanecer',
      type: 'rango',
      prices: {
        '1-3': 780000,
        '4-9': 195000,
        '10+': 175000
      }
    },
    avistamientoRio: {
      label: 'Avistamiento río',
      type: 'persona',
      price: 150000
    },
    caminataDiurna: {
      label: 'Caminata diurna',
      type: 'persona',
      price: 130000
    },
    caminataNocturna: {
      label: 'Caminata nocturna',
      type: 'persona',
      price: 100000
    }
  },

  varios: {
    tourLider: { label: 'Tour líder', price: 252480 },
    honorariosStaff: { label: 'Honorarios staff', price: 252480 },
    comisionVenta: 0.02,
    margenDefecto: 0.35,
    margenMinimo: 0.25,
    minimoParticipantes: 1,
    sostenibilidadPersona: 0,
    costosAdministrativos: 0
  },

  paquetesPorNoches: {
    5: ['safariDiaCompleto', 'cabalgata', 'amanecer', 'avistamientoRio', 'caminataDiurna', 'caminataNocturna'],
    4: ['safariDiaCompleto', 'cabalgata', 'amanecer', 'avistamientoRio', 'caminataDiurna'],
    3: ['safariDiaCompleto', 'cabalgata', 'avistamientoRio', 'caminataDiurna'],
    2: ['safariDiaCompleto', 'cabalgata', 'avistamientoRio', 'caminataDiurna']
  }
};

module.exports = PRICES;
