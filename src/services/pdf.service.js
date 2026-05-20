const PDFDocument = require('pdfkit');
const { formatCOP } = require('../utils/money');

function addRow(doc, y, columns) {
  doc.fontSize(9);
  doc.text(columns[0], 40, y, { width: 170 });
  doc.text(columns[1], 215, y, { width: 80, align: 'right' });
  doc.text(columns[2], 305, y, { width: 60, align: 'right' });
  doc.text(columns[3], 375, y, { width: 90, align: 'right' });
  doc.text(columns[4], 475, y, { width: 80, align: 'right' });
}

function generateQuotePdf(quote, client = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).text('COLOMBIA INSPIRA', { align: 'center' });
      doc.fontSize(13).text('Cotización oficial de experiencia turística', { align: 'center' });
      doc.moveDown();

      const today = new Date().toLocaleDateString('es-CO');
      doc.fontSize(10).text(`Fecha: ${today}`);
      doc.text(`Cliente: ${client.nombre || 'No especificado'}`);
      doc.text(`Correo: ${client.email || 'No especificado'}`);
      doc.text(`Teléfono: ${client.telefono || 'No especificado'}`);
      doc.moveDown();

      doc.fontSize(12).text('Resumen de la experiencia', { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(10)
        .text(`Adultos: ${quote.input.adultos}`)
        .text(`Niños 5 a 12 años: ${quote.input.ninos5a12}`)
        .text(`Niños menores de 5 años: ${quote.input.ninosMenores5}`)
        .text(`Total participantes: ${quote.input.totalPax}`)
        .text(`Días: ${quote.input.dias}`)
        .text(`Noches: ${quote.input.noches}`)
        .text(`Margen aplicado: ${(quote.input.margen * 100).toFixed(1)}%`);

      doc.moveDown();
      doc.fontSize(12).text('Resumen financiero', { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(10)
        .text(`Costo total: ${formatCOP(quote.totals.costoTotal)}`)
        .text(`Costo por persona: ${formatCOP(quote.totals.costoPorPersona)}`)
        .text(`Precio de venta total: ${formatCOP(quote.totals.precioVentaTotal)}`)
        .text(`Precio de venta por persona: ${formatCOP(quote.totals.precioVentaPersona)}`)
        .text(`Punto de equilibrio: ${quote.totals.puntoEquilibrio ?? 'No calculable'} participantes`)
        .text(`Viabilidad: ${quote.messages.viabilidad}`);

      doc.moveDown();
      doc.fontSize(12).text('Detalle de servicios seleccionados', { underline: true });
      doc.moveDown(0.5);

      let y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      addRow(doc, y, ['Ítem', 'Valor unitario', 'Cant.', 'Categoría', 'Total']);
      doc.font('Helvetica');
      y += 18;
      doc.moveTo(40, y - 4).lineTo(555, y - 4).stroke();

      quote.detail.forEach(row => {
        if (y > 740) {
          doc.addPage();
          y = 50;
        }

        addRow(doc, y, [
          row.item,
          formatCOP(row.unitPrice),
          String(row.quantity),
          row.category,
          formatCOP(row.total)
        ]);
        y += 24;
      });

      doc.moveDown(2);
      if (y > 680) {
        doc.addPage();
        y = 50;
      }

      doc.y = y + 10;
      doc.fontSize(9).text('Notas:', { underline: true });
      doc.text('- Los niños menores de 5 años no pagan hospedaje según la regla registrada.');
      doc.text('- En actividades, todo mayor de 7 años paga el 100% de la tarifa.');
      doc.text('- Esta cotización puede ajustarse por cambios en transporte, disponibilidad o condiciones comerciales.');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateQuotePdf };
