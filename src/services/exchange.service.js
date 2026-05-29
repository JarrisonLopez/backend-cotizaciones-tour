async function getUsdCopRate() {
  try {
    const response = await fetch(
      "https://v6.exchangerate-api.com/v6/e835f3dc4b97c12c624c2bc6/latest/USD"
    );

    if (!response.ok) {
      throw new Error("No se pudo consultar la tasa de cambio.");
    }

    const data = await response.json();

    const rate = data?.conversion_rates?.COP;

    if (!rate) {
      throw new Error("La API no devolvió tasa COP.");
    }

    return {
      rate,
      base: "USD",
      target: "COP",
      date: data?.time_last_update_utc || null,
      nextUpdate: data?.time_next_update_utc || null,
      source: "ExchangeRate-API",
    };
  } catch (error) {
    return {
      rate: 4100,
      base: "USD",
      target: "COP",
      date: null,
      nextUpdate: null,
      source: "fallback",
      warning:
        "No se pudo consultar la tasa de cambio. Se usó una tasa de respaldo.",
    };
  }
}

module.exports = { getUsdCopRate };