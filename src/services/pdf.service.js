const PDFDocument = require("pdfkit");

const COLORS = {
  green: "#0B4A43",
  green2: "#123F35",
  gold: "#C9A14A",
  beige: "#F7F0E3",
  lightGreen: "#EAF3ED",
  text: "#1D2B24",
  muted: "#6B756E",
  border: "#D9E2DC",
  white: "#FFFFFF",
};

function getCurrencyFormatter(currency = "COP") {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

function getMoneyHelpers(quote) {
  const currency = quote.input?.moneda || "COP";
  const totals = currency === "USD" ? quote.totalsUSD : quote.totals;
  const formatter = getCurrencyFormatter(currency);

  function convert(value) {
    if (currency === "COP") return Number(value || 0);
    const rate = quote.exchange?.rate || 0;
    if (!rate) return Number(value || 0);
    return Number(value || 0) / rate;
  }

  function money(value) {
    return formatter.format(Number(value || 0));
  }

  return { currency, totals, money, convert };
}

function addLogo(doc, x, y) {
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(COLORS.gold)
    .text("COLOMBIA", x, y, { characterSpacing: 4 });

  doc
    .fontSize(9)
    .fillColor("#00A88E")
    .text("I N S P I R A", x + 42, y + 25, { characterSpacing: 5 });
}

function sectionTitle(doc, title, y) {
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(COLORS.green)
    .text(title, 55, y);

  doc
    .moveTo(55, y + 18)
    .lineTo(540, y + 18)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();
}

function card(doc, x, y, w, h, title, value, subtitle = "") {
  const valueText = String(value ?? "-");

  let fontSize = 15;
  if (valueText.length > 13) fontSize = 12;
  if (valueText.length > 17) fontSize = 10;

  doc
    .roundedRect(x, y, w, h, 12)
    .fillAndStroke(COLORS.lightGreen, COLORS.border);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(title, x + 14, y + 12, { width: w - 28 });

  doc
    .font("Helvetica-Bold")
    .fontSize(fontSize)
    .fillColor(COLORS.green)
    .text(valueText, x + 14, y + 30, {
      width: w - 28,
      height: 18,
      lineBreak: false,
    });

  if (subtitle) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(subtitle, x + 14, y + 52, { width: w - 28 });
  }
}

function infoLine(doc, label, value, x, y, width = 220) {
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.green)
    .text(label, x, y, { continued: true });

  doc
    .font("Helvetica")
    .fillColor(COLORS.text)
    .text(` ${value || "No especificado"}`, { width });
}

function drawFooter(doc) {
  const y = 785;

  doc
    .moveTo(55, y - 10)
    .lineTo(540, y - 10)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      "Colombia Inspira · Cotización generada automáticamente · Sujeta a disponibilidad y condiciones comerciales.",
      55,
      y,
      { width: 485, align: "center" }
    );
}

function checkPage(doc, y, needed = 80) {
  if (y + needed > 760) {
    drawFooter(doc);
    doc.addPage();
    return 55;
  }
  return y;
}

function generateQuotePdf(quote, client = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 0,
        size: "A4",
        bufferPages: true,
      });

      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      const { currency, totals, money, convert } = getMoneyHelpers(quote);

      const today = new Date().toLocaleDateString("es-CO");

      doc.rect(0, 0, 595, 120).fill(COLORS.beige);

      addLogo(doc, 55, 30);

      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor(COLORS.green)
        .text("Cotización oficial", 330, 35, {
          width: 210,
          align: "right",
        });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text("Experiencia turística a la medida", 330, 60, {
          width: 210,
          align: "right",
        });

      doc
        .roundedRect(55, 145, 485, 78, 14)
        .fillAndStroke(COLORS.green, COLORS.green);

      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(COLORS.white)
        .text("Resumen de la experiencia", 75, 165);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.white)
        .text(
          `${quote.input.totalPax} participante(s) · ${quote.input.dias} día(s) · ${quote.input.noches} noche(s) · Moneda: ${currency}`,
          75,
          190,
          { width: 445 }
        );

      let y = 250;

      sectionTitle(doc, "Datos de la cotización", y);
      y += 32;

      doc
        .roundedRect(55, y, 485, 85, 12)
        .fillAndStroke("#FFFFFF", COLORS.border);

      infoLine(doc, "Fecha:", today, 75, y + 16);
      infoLine(doc, "Cliente:", client.nombre || "No especificado", 75, y + 36);
      infoLine(doc, "Correo:", client.email || "No especificado", 75, y + 56);

      infoLine(doc, "Teléfono:", client.telefono || "No especificado", 315, y + 16);
      infoLine(doc, "Moneda:", currency, 315, y + 36);

      if (quote.exchange) {
        infoLine(
          doc,
          "TRM:",
          `1 USD = ${getCurrencyFormatter("COP").format(quote.exchange.rate)} COP`,
          315,
          y + 56
        );
      }

      y += 115;

      sectionTitle(doc, "Resumen financiero", y);
      y += 32;

      card(doc, 55, y, 110, 70, "Costo total", money(totals?.costoTotal));
      card(doc, 180, y, 110, 70, "Precio venta", money(totals?.precioVentaTotal));
      card(doc, 305, y, 110, 70, "Por persona", money(totals?.precioVentaPersona));

      card(
        doc,
        430,
        y,
        110,
        70,
        "Punto equilibrio",
        quote.totals?.puntoEquilibrio
          ? `${quote.totals.puntoEquilibrio} pax`
          : "-"
      );

      y += 100;

      sectionTitle(doc, "Detalle general", y);
      y += 32;

      doc
        .roundedRect(55, y, 485, 88, 12)
        .fillAndStroke("#FFFFFF", COLORS.border);

      infoLine(doc, "Adultos:", quote.input.adultos, 75, y + 15);
      infoLine(doc, "Niños 5 a 12:", quote.input.ninos5a12, 75, y + 35);
      infoLine(doc, "Menores de 5:", quote.input.ninosMenores5, 75, y + 55);

      infoLine(doc, "Total:", `${quote.input.totalPax} participantes`, 315, y + 15);
      infoLine(doc, "Días:", quote.input.dias, 315, y + 35);
      infoLine(doc, "Noches:", quote.input.noches, 315, y + 55);

      y += 118;

      y = checkPage(doc, y, 160);
      sectionTitle(doc, "Servicios seleccionados", y);
      y += 35;

      const tableX = 55;
      const tableW = 485;

      doc
        .roundedRect(tableX, y, tableW, 26, 8)
        .fill(COLORS.green);

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.white)
        .text("Servicio", tableX + 12, y + 9, { width: 180 })
        .text("Categoría", tableX + 210, y + 9, { width: 95 })
        .text("Cant.", tableX + 315, y + 9, { width: 45, align: "right" })
        .text("Unitario", tableX + 365, y + 9, { width: 55, align: "right" })
        .text("Total", tableX + 425, y + 9, { width: 48, align: "right" });

      y += 32;

      quote.detail.forEach((row, index) => {
        y = checkPage(doc, y, 38);

        const rowHeight = 34;
        const bg = index % 2 === 0 ? "#FFFFFF" : "#F7FAF8";

        doc
          .roundedRect(tableX, y, tableW, rowHeight, 4)
          .fillAndStroke(bg, COLORS.border);

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.text)
          .text(row.item, tableX + 12, y + 8, { width: 180 })
          .text(row.category, tableX + 210, y + 8, { width: 95 })
          .text(String(row.quantity ?? "-"), tableX + 315, y + 8, {
            width: 45,
            align: "right",
          })
          .text(money(convert(row.unitPrice)), tableX + 365, y + 8, {
            width: 55,
            align: "right",
          })
          .text(money(convert(row.total)), tableX + 425, y + 8, {
            width: 48,
            align: "right",
          });

        y += rowHeight + 4;
      });

      y += 20;

      y = checkPage(doc, y, 150);

      sectionTitle(doc, "Condiciones y notas", y);
      y += 32;

      doc
        .roundedRect(55, y, 485, 120, 12)
        .fillAndStroke(COLORS.beige, COLORS.border);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.text)
        .text(`• ${quote.messages?.viabilidad || ""}`, 75, y + 16, {
          width: 445,
        })
        .text("• Los niños menores de 5 años no pagan hospedaje según la regla registrada.", 75, y + 36, {
          width: 445,
        })
        .text("• En actividades, todo mayor de 7 años paga el 100% de la tarifa.", 75, y + 56, {
          width: 445,
        })
        .text("• Esta cotización puede ajustarse por cambios en transporte, disponibilidad o condiciones comerciales.", 75, y + 76, {
          width: 445,
        });

      if (quote.exchange?.warning) {
        doc.text(`• ${quote.exchange.warning}`, 75, y + 96, { width: 445 });
      }

      drawFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateQuotePdf };