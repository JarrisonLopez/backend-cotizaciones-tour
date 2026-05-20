const PRICES = require('../data/prices');

function getRangoPax(totalPax) {
  if (totalPax <= 3) return '1-3';
  if (totalPax <= 9) return '4-9';
  return '10+';
}

function round(value) {
  return Math.round(Number(value || 0));
}

function calcularActividad(activityKey, totalPax, participantesQuePagan, cantidadVeces = 1) {
  const activity = PRICES.actividades[activityKey];
  if (!activity) return null;

  if (activity.type === 'persona') {
    const total = activity.price * participantesQuePagan * cantidadVeces;
    return {
      label: activity.label,
      unitPrice: activity.price,
      quantity: participantesQuePagan * cantidadVeces,
      total
    };
  }

  if (activity.type === 'rango') {
    const rango = getRangoPax(totalPax);
    const unitPrice = activity.prices[rango];

    // Para 1-3 pax se cobra como tarifa cerrada por grupo.
    // Para 4+ se cobra por persona.
    const quantity = rango === '1-3' ? cantidadVeces : participantesQuePagan * cantidadVeces;
    const total = unitPrice * quantity;

    return {
      label: `${activity.label} (${rango} pax)`,
      unitPrice,
      quantity,
      total
    };
  }

  return null;
}

function calculateQuote(payload) {
  const adultos = Number(payload.adultos || 0);
  const ninos = Number(payload.ninos || 0);
  const ninosMenores5 = Number(payload.ninosMenores5 || 0);
  const ninos5a12 = Number(payload.ninos5a12 ?? ninos);
  const ninosMayores7 = Number(payload.ninosMayores7 ?? ninos5a12);
  const dias = Number(payload.dias || 1);
  const noches = Math.max(dias - 1, 0);

  const totalPax = adultos + ninos5a12 + ninosMenores5;
  const paxHospedaje = adultos + ninos5a12;
  const paxActividades = adultos + ninosMayores7;

  const margen = Number(payload.margen ?? PRICES.varios.margenDefecto);
  const incluirComision = payload.incluirComision !== false;

  if (adultos < 0 || ninos5a12 < 0 || ninosMenores5 < 0 || dias < 1) {
    throw new Error('Los valores de adultos, niños y días deben ser válidos.');
  }

  if (totalPax <= 0) {
    throw new Error('Debe existir al menos un participante.');
  }

  if (margen < 0 || margen >= 1) {
    throw new Error('El margen debe estar entre 0 y 0.99. Ejemplo: 0.35 para 35%.');
  }

  const detail = [];
  let subtotal = 0;
  let costosVariables = 0;
  let costosFijos = 0;

  // Transporte: todo precio por día. Permite cantidad para camionetas u otros.
  const transporte = payload.transporte || {};
  Object.entries(transporte).forEach(([key, value]) => {
    if (!value) return;
    const item = PRICES.transporte[key];
    if (!item) return;

    const quantityFromFrontend = typeof value === 'object' ? Number(value.cantidad || 1) : 1;
    const quantity = quantityFromFrontend * dias;
    const total = item.price * quantity;

    subtotal += total;
    costosVariables += total;

    detail.push({
      category: 'Transporte',
      item: item.label,
      unitPrice: item.price,
      quantity,
      total
    });
  });

  // Hospedaje por noche.
  const hospedajeAdulto = payload.hospedajeAdulto || null;
  if (hospedajeAdulto && PRICES.hospedajeAdulto[hospedajeAdulto] && adultos > 0) {
    const item = PRICES.hospedajeAdulto[hospedajeAdulto];
    const quantity = adultos * noches;
    const total = item.price * quantity;

    subtotal += total;
    costosVariables += total;

    detail.push({
      category: 'Hospedaje adultos',
      item: item.label,
      unitPrice: item.price,
      quantity,
      total
    });
  }

  const hospedajeNino = payload.hospedajeNino || hospedajeAdulto;
  if (hospedajeNino && PRICES.hospedajeNino[hospedajeNino] && ninos5a12 > 0) {
    const item = PRICES.hospedajeNino[hospedajeNino];
    const quantity = ninos5a12 * noches;
    const total = item.price * quantity;

    subtotal += total;
    costosVariables += total;

    detail.push({
      category: 'Hospedaje niños 5 a 12',
      item: item.label,
      unitPrice: item.price,
      quantity,
      total
    });
  }

  if (ninosMenores5 > 0) {
    detail.push({
      category: 'Hospedaje niños menores de 5',
      item: 'Gratis',
      unitPrice: 0,
      quantity: ninosMenores5 * noches,
      total: 0
    });
  }

  // Alimentación por día.
  if (payload.incluirAlimentacion) {
    if (adultos > 0) {
      const item = PRICES.alimentacion.adulto;
      const quantity = adultos * dias;
      const total = item.price * quantity;
      subtotal += total;
      costosVariables += total;
      detail.push({ category: 'Alimentación', item: item.label, unitPrice: item.price, quantity, total });
    }

    if (ninos5a12 > 0) {
      const item = PRICES.alimentacion.nino;
      const quantity = ninos5a12 * dias;
      const total = item.price * quantity;
      subtotal += total;
      costosVariables += total;
      detail.push({ category: 'Alimentación', item: item.label, unitPrice: item.price, quantity, total });
    }
  }

  // Actividades seleccionadas manualmente o por paquete según noches.
  let selectedActivities = payload.actividades || {};

  if (payload.usarPaquetePorNoches) {
    const packageActivities = PRICES.paquetesPorNoches[noches] || [];
    selectedActivities = packageActivities.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
  }

  Object.entries(selectedActivities).forEach(([key, value]) => {
    if (!value) return;
    const cantidadVeces = typeof value === 'object' ? Number(value.cantidad || 1) : 1;
    const result = calcularActividad(key, totalPax, paxActividades, cantidadVeces);
    if (!result) return;

    subtotal += result.total;
    costosVariables += result.total;

    detail.push({
      category: 'Actividades',
      item: result.label,
      unitPrice: result.unitPrice,
      quantity: result.quantity,
      total: result.total
    });
  });

  if (paxActividades < totalPax) {
    detail.push({
      category: 'Actividades niños menores de 7',
      item: 'No pagan actividades',
      unitPrice: 0,
      quantity: totalPax - paxActividades,
      total: 0
    });
  }

  // Costos fijos y varios.
  const costoGuias = Number(payload.costoGuias ?? 0);
  if (costoGuias > 0) {
    subtotal += costoGuias;
    costosFijos += costoGuias;
    detail.push({ category: 'Varios', item: 'Costo guías total', unitPrice: costoGuias, quantity: 1, total: costoGuias });
  }

  const costosAdministrativos = Number(payload.costosAdministrativos ?? PRICES.varios.costosAdministrativos);
  if (costosAdministrativos > 0) {
    subtotal += costosAdministrativos;
    costosFijos += costosAdministrativos;
    detail.push({ category: 'Varios', item: 'Costos administrativos', unitPrice: costosAdministrativos, quantity: 1, total: costosAdministrativos });
  }

  const costoSostenibilidadPersona = Number(payload.costoSostenibilidadPersona ?? PRICES.varios.sostenibilidadPersona);
  if (costoSostenibilidadPersona > 0) {
    const quantity = totalPax;
    const total = costoSostenibilidadPersona * quantity;
    subtotal += total;
    costosVariables += total;
    detail.push({ category: 'Sostenibilidad', item: 'Aporte sostenibilidad por persona', unitPrice: costoSostenibilidadPersona, quantity, total });
  }

  if (payload.incluirTourLider) {
    const item = PRICES.varios.tourLider;
    const quantity = dias;
    const total = item.price * quantity;
    subtotal += total;
    costosFijos += total;
    detail.push({ category: 'Varios', item: item.label, unitPrice: item.price, quantity, total });
  }

  if (payload.incluirHonorariosStaff) {
    const item = PRICES.varios.honorariosStaff;
    const quantity = dias;
    const total = item.price * quantity;
    subtotal += total;
    costosFijos += total;
    detail.push({ category: 'Varios', item: item.label, unitPrice: item.price, quantity, total });
  }

  const comision = incluirComision ? subtotal * PRICES.varios.comisionVenta : 0;
  const costoTotal = subtotal + comision;
  const costoPorPersona = costoTotal / totalPax;

  // Fórmula financiera: Precio Venta = Costo Total / (1 - margen)
  const precioVentaTotal = costoTotal / (1 - margen);
  const precioVentaPersona = precioVentaTotal / totalPax;

  const costoVariablePorPersona = costosVariables / totalPax;
  const margenContribucionUnitario = precioVentaPersona - costoVariablePorPersona;
  const margenContribucionTotal = margenContribucionUnitario * totalPax;
  const margenPorcentajeSobreVenta = precioVentaPersona > 0 ? margenContribucionUnitario / precioVentaPersona : 0;
  const utilidadOperativa = margenContribucionTotal - costosFijos;

  const puntoEquilibrio = margenContribucionUnitario > 0
    ? Math.ceil(costosFijos / margenContribucionUnitario)
    : null;

  const viable = puntoEquilibrio !== null ? totalPax >= puntoEquilibrio : false;
  const margenBajo = margen < PRICES.varios.margenMinimo;

  return {
    ok: true,
    input: {
      adultos,
      ninos5a12,
      ninosMenores5,
      ninosMayores7,
      totalPax,
      paxHospedaje,
      paxActividades,
      dias,
      noches,
      hospedajeAdulto,
      hospedajeNino,
      margen,
      incluirComision
    },
    totals: {
      subtotal: round(subtotal),
      comision: round(comision),
      costoTotal: round(costoTotal),
      costoPorPersona: round(costoPorPersona),
      precioVentaTotal: round(precioVentaTotal),
      precioVentaPersona: round(precioVentaPersona),
      costosVariables: round(costosVariables),
      costosFijos: round(costosFijos),
      costoVariablePorPersona: round(costoVariablePorPersona),
      margenContribucionUnitario: round(margenContribucionUnitario),
      margenContribucionTotal: round(margenContribucionTotal),
      margenPorcentajeSobreVenta,
      utilidadOperativa: round(utilidadOperativa),
      puntoEquilibrio,
      viable,
      margenBajo
    },
    messages: {
      viabilidad: viable
        ? 'VIABLE: el grupo supera o iguala el punto de equilibrio.'
        : 'NO VIABLE: el grupo está por debajo del punto de equilibrio.',
      margen: margenBajo
        ? 'ADVERTENCIA: el margen está por debajo del mínimo sugerido del 25%.'
        : 'Margen dentro del rango recomendado.'
    },
    detail
  };
}

module.exports = { calculateQuote };
