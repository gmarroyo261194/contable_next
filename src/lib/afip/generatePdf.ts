import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
// @ts-ignore
import { NumeroALetras } from 'numero-a-letras';
import { TIPO_COMPROBANTE_LABEL, CONDICION_IVA_LABEL } from './voucherTypes';

export interface PdfInvoiceData {
  Id: number;
  PtoVenta: number;
  NroComprobante: number;
  Tipo: string;
  NroCae: string | null;
  FechaVtoCae: string | Date | null;
  ServicioId: number;
  Clientes: {
    Nombre: string;
    Identificacion: string;
    CondicionIva?: number;
    Direccion?: string | null;
  };
  FechasComprobantes?: {
    FechaDesde: string | Date;
    FechaHasta: string | Date;
    VtoPago: string | Date;
  } | null;
  ItemsComprobantes: Array<{
    Linea: string;
    Cantidad: number;
    ImporteUnit: number;
    ImporteTotal: number;
  }>;
}

export async function generateInvoicePdf(data: PdfInvoiceData, returnType: 'save' | 'arraybuffer' = 'save'): Promise<ArrayBuffer | void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Configuración de la empresa (Hardcoded según el modelo del cliente)
  const orgInfo = {
    nombre: 'FUNDACION UNIVERSIDAD TECNOLOGICA REGIONAL',
    razonSocial: 'FUNDACION UNIVERSIDAD TECNOLOGICA REGIONAL MENDOZA',
    domicilio: 'Rodriguez 273 - Mendoza, Mendoza',
    cuit: process.env.NEXT_PUBLIC_AFIP_CUIT || '30640431373',
    iva: 'IVA Sujeto Exento',
    ingBrutos: 'Exento',
    inicioAct: '20/05/1990'
  };

  const margin = 10;
  const headerHeight = 55;

  // 1. MARCO PRINCIPAL Y CABECERA
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, pageWidth - 2 * margin, headerHeight); // Recuadro cabecera
  doc.line(pageWidth / 2, margin + 18, pageWidth / 2, margin + headerHeight); // Línea divisoria vertical central

  // Caja del Tipo de Comprobante (El cuadradito con la C o A)
  const boxSize = 14;
  const boxX = (pageWidth / 2) - (boxSize / 2);
  const boxY = margin;
  doc.rect(boxX, boxY, boxSize, boxSize, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const letra = data.Tipo === '11' || data.Tipo === '12' || data.Tipo === '13' || data.Tipo === '211' ? 'C' : 'A';
  doc.text(letra, boxX + 3.5, boxY + 11);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(`COD. ${data.Tipo.padStart(3, '0')}`, boxX + 1, boxY + boxSize + 4);

  // TEXTO CABECERA IZQUIERDA (Empresa)
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  // Centrar título principal en la mitad izquierda
  const leftMid = (margin + pageWidth / 2) / 2;
  doc.text('FUNDACION UNIVERSIDAD', leftMid, margin + 12, { align: 'center' });
  doc.text('TECNOLOGICA REGIONAL', leftMid, margin + 19, { align: 'center' });

  doc.setFontSize(8);
  doc.text('Razón Social:', margin + 2, margin + 30);
  doc.setFont('helvetica', 'normal');
  // Split manual según pedido del usuario: Regional Mendoza a la segunda línea
  doc.text('FUNDACION UNIVERSIDAD TECNOLOGICA', margin + 22, margin + 30);
  doc.text('REGIONAL MENDOZA', margin + 22, margin + 34);

  doc.setFont('helvetica', 'bold');
  doc.text('Domicilio Comercial:', margin + 2, margin + 40);
  doc.setFont('helvetica', 'normal');
  doc.text(orgInfo.domicilio, margin + 32, margin + 40);

  doc.setFont('helvetica', 'bold');
  doc.text('Condición frente al IVA:', margin + 2, margin + 47);
  doc.setFont('helvetica', 'normal');
  doc.text(orgInfo.iva, margin + 35, margin + 47);

  // TEXTO CABECERA DERECHA (Factura info)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const isFCE = ['201', '206', '211', '212', '213'].includes(data.Tipo);

  let line1 = '';
  let line2 = '';

  if (data.Tipo === '11') {
    line1 = 'FACTURA';
  } else if (data.Tipo === '12' || data.Tipo === '212') {
    line1 = 'NOTA DE DÉBITO';
  } else if (data.Tipo === '13' || data.Tipo === '213') {
    line1 = 'NOTA DE CRÉDITO';
  } else if (isFCE) {
    line1 = 'FACTURA DE CRÉDITO';
  } else {
    line1 = 'COMPROBANTE';
  }

  if (isFCE) {
    // line1 += ' ELECTRÓNICA';
    line2 = 'ELECTRÓNICA MiPyMEs (FCE)';
  }

  doc.text(line1, pageWidth / 2 + 15, margin + 11);
  if (line2) {
    doc.setFontSize(11);
    doc.text(line2, pageWidth / 2 + 15, margin + 16);
  }

  doc.setFontSize(9);
  doc.text('Punto de Venta:', pageWidth / 2 + 15, margin + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(String(data.PtoVenta).padStart(5, '0'), pageWidth / 2 + 42, margin + 22);
  doc.setFont('helvetica', 'bold');
  doc.text('Comp. Nro:', pageWidth / 2 + 58, margin + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(String(data.NroComprobante).padStart(8, '0'), pageWidth / 2 + 78, margin + 22);

  const fechaEmi = data.FechasComprobantes?.FechaDesde ? new Date(data.FechasComprobantes.FechaDesde) : new Date();
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Emisión:', pageWidth / 2 + 15, margin + 30);
  doc.setFont('helvetica', 'normal');
  const fEmiStr = `${fechaEmi.getUTCDate()}/${fechaEmi.getUTCMonth() + 1}/${fechaEmi.getUTCFullYear()}`;
  doc.text(fEmiStr, pageWidth / 2 + 45, margin + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('CUIT:', pageWidth / 2 + 15, margin + 38);
  doc.setFont('helvetica', 'normal');
  doc.text(orgInfo.cuit, pageWidth / 2 + 25, margin + 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Ingresos Brutos:', pageWidth / 2 + 52, margin + 38);
  doc.setFont('helvetica', 'normal');
  doc.text(orgInfo.ingBrutos, pageWidth / 2 + 80, margin + 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Inicio de Actividades:', pageWidth / 2 + 15, margin + 47);
  doc.setFont('helvetica', 'normal');
  doc.text(orgInfo.inicioAct, pageWidth / 2 + 65, margin + 47);

  // 2. PERIODO Y DATOS RECEPTOR
  let currentY = margin + headerHeight + 8;

  doc.rect(margin, currentY, pageWidth - 2 * margin, 28);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  // Periodo Facturado
  doc.text('Período Facturado Desde:', margin + 2, currentY + 5);
  doc.setFont('helvetica', 'normal');
  const dD = data.FechasComprobantes?.FechaDesde ? new Date(data.FechasComprobantes.FechaDesde) : null;
  const dH = data.FechasComprobantes?.FechaHasta ? new Date(data.FechasComprobantes.FechaHasta) : null;
  const dV = data.FechasComprobantes?.VtoPago ? new Date(data.FechasComprobantes.VtoPago) : null;

  const pDesde = dD ? `${dD.getUTCDate()}/${dD.getUTCMonth() + 1}/${dD.getUTCFullYear()}` : '-';
  const pHasta = dH ? `${dH.getUTCDate()}/${dH.getUTCMonth() + 1}/${dH.getUTCFullYear()}` : '-';
  const pVto = dV ? `${dV.getUTCDate()}/${dV.getUTCMonth() + 1}/${dV.getUTCFullYear()}` : '-';

  doc.text(pDesde, margin + 42, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Hasta:', margin + 62, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(pHasta, margin + 74, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Vto. para el pago:', margin + 110, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(pVto, margin + 152, currentY + 5);

  doc.line(margin, currentY + 8, pageWidth - margin, currentY + 8);

  // Datos del Cliente
  doc.setFont('helvetica', 'bold');
  doc.text('CUIT / DNI:', margin + 2, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(data.Clientes.Identificacion, margin + 22, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Apellido y Nombre / Razón Social:', margin + 65, currentY + 14);
  doc.setFont('helvetica', 'normal');
  const maxNameWidth = (pageWidth - margin) - (margin + 120) - 2;
  doc.text(data.Clientes.Nombre, margin + 120, currentY + 14, { maxWidth: maxNameWidth });

  doc.setFont('helvetica', 'bold');
  doc.text('Condición frente al IVA:', margin + 2, currentY + 21);
  doc.setFont('helvetica', 'normal');
  const condIva = data.Clientes.CondicionIva ? CONDICION_IVA_LABEL[data.Clientes.CondicionIva] : 'Consumidor Final';
  doc.text(condIva, margin + 38, currentY + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Domicilio:', margin + 100, currentY + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(data.Clientes.Direccion || '-', margin + 120, currentY + 21, { maxWidth: maxNameWidth });

  doc.setFont('helvetica', 'bold');
  doc.text('Condición de venta:', margin + 2, currentY + 27);
  doc.setFont('helvetica', 'normal');
  doc.text('Otra', margin + 35, currentY + 27);


  // 3. TABLA DE ITEMS
  currentY += 35;

  const tableData = data.ItemsComprobantes.map(it => [
    data.ServicioId || '', // Código
    it.Linea,
    Number(it.Cantidad).toFixed(2),
    'unidades',
    Number(it.ImporteUnit).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
    '0,00',
    '0,00',
    Number(it.ImporteTotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Código', 'Producto / Servicio', 'Cantidad', 'U. Medida', 'Precio Unit.', '% Bonif', 'Imp. Bonif.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontSize: 8,
      halign: 'center',
      lineWidth: 0.1
    },
    bodyStyles: { fontSize: 8, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 12, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  // 5. PIE DE PÁGINA (QR, AFIP LOGO, CAE)
  const footerHeight = 35;
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - footerHeight;

  // 4. TOTALES (Posicionados sobre el pie de página)
  // Caja de totales siempre al final para coincidir con el modelo
  const totalsBoxHeight = 32;
  // Subimos la caja considerablemente si es FCE para que entre el recuadro rojo debajo
  const totalsY = isFCE ? (footerY - totalsBoxHeight - 20) : (footerY - totalsBoxHeight - 5);

  doc.rect(margin, totalsY, pageWidth - 2 * margin, totalsBoxHeight);
  doc.setFontSize(10);

  const total = data.ItemsComprobantes.reduce((sum, it) => sum + Number(it.ImporteTotal), 0);

  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal: $', pageWidth - 70, totalsY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(total.toLocaleString('es-AR', { minimumFractionDigits: 2 }), pageWidth - 15, totalsY + 10, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Importe Otros Tributos: $', pageWidth - 70, totalsY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text('0,00', pageWidth - 15, totalsY + 18, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Importe Total: $', pageWidth - 70, totalsY + 27);
  doc.text(total.toLocaleString('es-AR', { minimumFractionDigits: 2 }), pageWidth - 15, totalsY + 27, { align: 'right' });
  // Recuadro Rojo FCE (Ubicado entre totales y pie de página)
  if (isFCE) {
    const boxLegalY = totalsY + totalsBoxHeight + 2; 
    doc.setDrawColor(180, 0, 0); 
    doc.setLineWidth(0.4);
    doc.rect(margin, boxLegalY, pageWidth - 2 * margin, 12);
    doc.setFontSize(6.5);
    doc.setTextColor(180, 0, 0);
    doc.setFont('helvetica', 'italic');
    const legalText1 = 'Luego de su aceptación tácita o expresa, esta Factura de Crédito Electrónica MiPyMEs será transmitida a El Sistema de Circulación Abierta para Facturas de Crédito Electrónicas MiPyMEs, para su';
    const legalText2 = 'circulación y negociación, incluso en los Mercados de Valores, en este caso, a través de un Agente de Depósito Colectivo o agentes que cumplan similares funciones.';
    
    // Justificado simulado con maxWidth
    doc.text(legalText1, margin + 2, boxLegalY + 4, { align: 'justify', maxWidth: pageWidth - 2 * margin - 4 });
    doc.text(legalText2, margin + 2, boxLegalY + 9, { align: 'justify', maxWidth: pageWidth - 2 * margin - 4 });
    
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
  }

  try {
    // CAE y VTO
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`CAE N°: ${data.NroCae || '-'}`, pageWidth - margin, footerY + 5, { align: 'right' });
    const fVtoCae = data.FechaVtoCae ? new Date(data.FechaVtoCae).toLocaleDateString('es-AR') : '-';
    doc.text(`Fecha de Vto. de CAE: ${fVtoCae}`, pageWidth - margin, footerY + 12, { align: 'right' });

    // QR Code
    if (data.NroCae) {
      try {
        const qrDataObj = {
          ver: 1,
          fecha: fechaEmi.toISOString().split('T')[0],
          cuit: Number(orgInfo.cuit),
          ptoVta: data.PtoVenta,
          tipoCmp: Number(data.Tipo),
          nroCmp: data.NroComprobante,
          importe: total,
          moneda: 'PES',
          ctz: 1,
          tipoDocRec: data.Clientes.Identificacion.length > 8 ? 80 : 96,
          nroDocRec: Number(data.Clientes.Identificacion.replace(/\D/g, '')),
          tipoCodAut: 'E',
          codAut: Number(data.NroCae)
        };
        const qrJson = JSON.stringify(qrDataObj);
        // btoa seguro para UTF-8
        const qrBase64 = Buffer.from(qrJson).toString('base64');
        const qrUrl = `https://www.afip.gob.ar/genericos/comprobante.aspx?p=${qrBase64}`;
        const qrImage = await QRCode.toDataURL(qrUrl);
        doc.addImage(qrImage, 'PNG', margin, footerY - 5, 25, 25);
      } catch (e) {
        console.error("Error generating QR", e);
      }
    }

    // AFIP Logo
    doc.setFontSize(20);
    doc.setFont('times', 'italic');
    doc.text('AFIP', margin + 30, footerY + 10);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprobante Autorizado', margin + 30, footerY + 15);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Esta Administración Federal no se responsabiliza por los datos ingresados en el detalle de la operación', margin + 30, footerY + 22);

    doc.setFontSize(9);
    doc.text('Pág. 1/1', pageWidth / 2, footerY + 5, { align: 'center' });

    // Guardar / Descargar
    if (returnType === 'save') {
      doc.save(`${orgInfo.cuit}_${data.Tipo.padStart(3, '0')}_${String(data.PtoVenta).padStart(5, '0')}_${String(data.NroComprobante).padStart(8, '0')}.pdf`);
    } else {
      return doc.output('arraybuffer');
    }
  } catch (error) {
    console.error("CRITICAL ERROR IN PDF GENERATION:", error);
    throw error;
  }
}
