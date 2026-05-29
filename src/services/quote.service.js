const PRICES = require("../data/prices");
const { getUsdCopRate } = require("./exchange.service");

function getRangoPax(totalPax) {
  if (totalPax <= 3) return "1-3";
  if (totalPax <= 9) return "4-9";
  return "10+";
}

function round(value) {
  return Math.round(Number(value || 0));
}

function calcularActividad(activityKey, totalPax, participantesQuePagan, cantidadVeces = 1) {
  const activity = PRICES.actividades[activityKey];
  if (!activity) return null;

  if (activity.type === "persona") {
    const total = activity.price * participantesQuePagan * cantidadVeces;

    return {
      label: activity.label,
      unitPrice: activity.price,
      quantity: participantesQuePagan * cantidadVeces,
      total,
    };
  }

  if (activity.type === "rango") {
    const rango = getRangoPax(totalPax);
    const unitPrice = activity.prices[rango];

    const quantity =
      rango === "1-3" ? cantidadVeces : participantesQuePagan * cantidadVeces;

    const total = unitPrice * quantity;

    return {
      label: `${activity.label} (${rango} pax)`,
      unitPrice,
      quantity,
      total,
    };
  }

  return null;
}

async function calculateQuote(payload) {
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

  const margen = PRICES.varios.margenDefecto;
  const incluirComision = true;

  const incluirTourLider = Boolean(payload.incluirTourLider);
  const incluirStaff = Boolean(payload.incluirStaff || payload.incluirHonorariosStaff);

  if (adultos < 0 || ninos5a12 < 0 || ninosMenores5 < 0 || dias < 1) {
    throw new Error("Los valores de adultos, niños y días deben ser válidos.");
  }

  if (totalPax <= 0) {
    throw new Error("Debe existir al menos un participante.");
  }

  if (totalPax < PRICES.varios.minimoPaxParaTourLider && incluirTourLider) {
    throw new Error("Para grupos menores a 4 personas no se puede incluir tour líder.");
  }

  if (totalPax < PRICES.varios.minimoPaxParaStaff && incluirStaff) {
    throw new Error("Para grupos menores a 4 personas no se puede incluir staff.");
  }

  const detail = [];
  let subtotal = 0;
  let costosVariables = 0;
  let costosFijos = 0;

  const transporte = payload.transporte || {};

  Object.entries(transporte).forEach(([key, value]) => {
    if (!value) return;

    const item = PRICES.transporte[key];
    if (!item) return;

    const quantityFromFrontend =
      typeof value === "object" ? Number(value.cantidad || 1) : 1;

    const quantity = quantityFromFrontend * dias;
    const total = item.price * quantity;

    subtotal += total;
    costosVariables += total;

    detail.push({
      category: "Transporte",
      item: item.label,
      unitPrice: item.price,
      quantity,
      total,
    });
  });

  const hospedajeAdulto = payload.hospedajeAdulto || null;

  if (hospedajeAdulto && PRICES.hospedajeAdulto[hospedajeAdulto] && adultos > 0) {
    const item = PRICES.hospedajeAdulto[hospedajeAdulto];
    const quantity = adultos * noches;
    const total = item.price * quantity;

    subtotal += total;
    costosVariables += total;

    detail.push({
      category: "Hospedaje adultos",
      item: item.label,
      unitPrice: item.price,
      quantity,
      total,
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
      category: "Hospedaje niños 5 a 12",
      item: item.label,
      unitPrice: item.price,
      quantity,
      total,
    });
  }

  if (ninosMenores5 > 0) {
    detail.push({
      category: "Hospedaje niños menores de 5",
      item: "Gratis",
      unitPrice: 0,
      quantity: ninosMenores5 * noches,
      total: 0,
    });
  }

  if (payload.incluirAlimentacion) {
    if (adultos > 0) {
      const item = PRICES.alimentacion.adulto;
      const quantity = adultos * dias;
      const total = item.price * quantity;

      subtotal += total;
      costosVariables += total;

      detail.push({
        category: "Alimentación",
        item: item.label,
        unitPrice: item.price,
        quantity,
        total,
      });
    }

    if (ninos5a12 > 0) {
      const item = PRICES.alimentacion.nino;
      const quantity = ninos5a12 * dias;
      const total = item.price * quantity;

      subtotal += total;
      costosVariables += total;

      detail.push({
        category: "Alimentación",
        item: item.label,
        unitPrice: item.price,
        quantity,
        total,
      });
    }
  }

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

    const cantidadVeces =
      typeof value === "object" ? Number(value.cantidad || 1) : 1;

    const result = calcularActividad(
      key,
      totalPax,
      paxActividades,
      cantidadVeces
    );

    if (!result) return;

    subtotal += result.total;
    costosVariables += result.total;

    detail.push({
      category: "Actividades",
      item: result.label,
      unitPrice: result.unitPrice,
      quantity: result.quantity,
      total: result.total,
    });
  });

  if (paxActividades < totalPax) {
    detail.push({
      category: "Actividades niños menores de 7",
      item: "No pagan actividades",
      unitPrice: 0,
      quantity: totalPax - paxActividades,
      total: 0,
    });
  }

  const costoGuias = Number(payload.costoGuias ?? 0);

  if (costoGuias > 0) {
    subtotal += costoGuias;
    costosFijos += costoGuias;

    detail.push({
      category: "Varios",
      item: "Costo guías total",
      unitPrice: costoGuias,
      quantity: 1,
      total: costoGuias,
    });
  }

  const costosAdministrativos = Number(
    payload.costosAdministrativos ?? PRICES.varios.costosAdministrativos
  );

  if (costosAdministrativos > 0) {
    subtotal += costosAdministrativos;
    costosFijos += costosAdministrativos;

    detail.push({
      category: "Varios",
      item: "Costos administrativos",
      unitPrice: costosAdministrativos,
      quantity: 1,
      total: costosAdministrativos,
    });
  }

  const costoSostenibilidadPersona = Number(
    payload.costoSostenibilidadPersona ?? PRICES.varios.sostenibilidadPersona
  );

  if (costoSostenibilidadPersona > 0) {
    const quantity = totalPax;
    const total = costoSostenibilidadPersona * quantity;

    subtotal += total;
    costosVariables += total;

    detail.push({
      category: "Sostenibilidad",
      item: "Aporte sostenibilidad por persona",
      unitPrice: costoSostenibilidadPersona,
      quantity,
      total,
    });
  }

  if (incluirTourLider) {
    const item = PRICES.varios.tourLider;
    const quantity = dias;
    const total = item.price * quantity;

    subtotal += total;
    costosFijos += total;

    detail.push({
      category: "Varios",
      item: item.label,
      unitPrice: item.price,
      quantity,
      total,
    });
  }

  if (incluirStaff) {
    const staff = PRICES.varios.staff;

    const unitPrice =
      staff.tiquetesStaff + staff.comidaStaff + staff.honorariosStaff;

    const quantity = dias;
    const total = unitPrice * quantity;

    subtotal += total;
    costosFijos += total;

    detail.push({
      category: "Varios",
      item: staff.label,
      unitPrice,
      quantity,
      total,
    });
  }

  const comision = incluirComision ? subtotal * PRICES.varios.comisionVenta : 0;

  const costoTotal = subtotal + comision;
  const costoPorPersona = costoTotal / totalPax;

  const precioVentaTotal = costoTotal / (1 - margen);
  const precioVentaPersona = precioVentaTotal / totalPax;

  const costoVariablePorPersona = costosVariables / totalPax;
  const margenContribucionUnitario =
    precioVentaPersona - costoVariablePorPersona;

  const margenContribucionTotal = margenContribucionUnitario * totalPax;

  const margenPorcentajeSobreVenta =
    precioVentaPersona > 0
      ? margenContribucionUnitario / precioVentaPersona
      : 0;

  const utilidadOperativa = margenContribucionTotal - costosFijos;

  const puntoEquilibrio =
    costosFijos > 0 && margenContribucionUnitario > 0
      ? Math.ceil(costosFijos / margenContribucionUnitario)
      : null;

  const viable =
    puntoEquilibrio === null
      ? true
      : totalPax >= puntoEquilibrio;

  const margenBajo = margen < PRICES.varios.margenMinimo;

  const exchange = await getUsdCopRate();

  function toUSD(valueCOP) {
    return exchange.rate > 0 ? valueCOP / exchange.rate : 0;
  }

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
      incluirComision,
      incluirTourLider,
      incluirStaff,
      moneda: payload.moneda || "COP",
    },

    exchange,

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
      margenBajo,
    },

    totalsUSD: {
      subtotal: round(toUSD(subtotal)),
      comision: round(toUSD(comision)),
      costoTotal: round(toUSD(costoTotal)),
      costoPorPersona: round(toUSD(costoPorPersona)),
      precioVentaTotal: round(toUSD(precioVentaTotal)),
      precioVentaPersona: round(toUSD(precioVentaPersona)),
      costosVariables: round(toUSD(costosVariables)),
      costosFijos: round(toUSD(costosFijos)),
      costoVariablePorPersona: round(toUSD(costoVariablePorPersona)),
      margenContribucionUnitario: round(toUSD(margenContribucionUnitario)),
      margenContribucionTotal: round(toUSD(margenContribucionTotal)),
      utilidadOperativa: round(toUSD(utilidadOperativa)),
    },

    messages: {
      viabilidad: viable
        ? "VIABLE: el grupo supera o iguala el punto de equilibrio."
        : "NO VIABLE: el grupo está por debajo del punto de equilibrio.",
      margen: "Margen objetivo aplicado automáticamente: 25%.",
      comision: "Comisión de venta aplicada automáticamente: 2%.",
      reglaStaff:
        totalPax < 4
          ? "Para grupos menores a 4 personas no se permite incluir tour líder ni staff."
          : "Tour líder y staff disponibles para este grupo.",
    },

    detail,
  };
}

module.exports = { calculateQuote };