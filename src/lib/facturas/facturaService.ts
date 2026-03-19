// src/lib/facturas/facturaService.ts
import { PDFParse } from 'pdf-parse';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import path from 'path';
import { pathToFileURL } from 'url';

// Configuración del worker para entorno servidor (Node.js)
if (typeof window === 'undefined') {
  try {
    const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
    // En Windows, las rutas absolutas deben ser file:// URLs para el cargador ESM de Node.js
    const workerUrl = pathToFileURL(workerPath).href;
    PDFParse.setWorker(workerUrl);
  } catch (e) {
    console.warn('No se pudo configurar el worker de PDF.js automáticamente:', e);
  }
}

export { prisma };

export interface FacturaParseResult {
  ok: boolean;
  facturaId?: number;
  duplicado?: boolean;
  error?: string;
  data?: any;
}

export async function procesarFacturaPDF(buffer: Buffer, filename: string): Promise<FacturaParseResult> {
  try {
    // 1. Extraer texto del PDF usando la nueva API de pdf-parse 2.x (clase PDFParse)
    const parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      throw new Error('No se pudo extraer texto del PDF. El archivo podría estar protegido o ser escaneado.');
    }

    // console.log('--- TEXTO EXTRAIDO ---');
    // console.log(text);
    // console.log('-----------------------');

    const parsed = parseAfipInvoiceText(text, filename);
    
    // Hash para evitar duplicidad por contenido de archivo idéntico (opcional)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Verificar duplicado por CUIT + Punto Venta + Número + Tipo
    const exist = await prisma.factura.findUnique({
      where: {
        UQ_factura: {
          cuitEmisor: parsed.cuitEmisor,
          puntoVenta: parsed.puntoVenta,
          numeroComprobante: parsed.numeroComprobante,
          tipoComprobante: parsed.tipoComprobante,
        },
      },
    });

    if (exist) {
      return { ok: true, duplicado: true, facturaId: exist.id, data: parsed };
    }

    // Guardar en base de datos
    const factura = await prisma.factura.create({
      data: {
        ...parsed,
        archivoOrigen: filename,
        hashArchivo: hash,
        estado: 'ok',
      },
    });

    return { ok: true, duplicado: false, facturaId: factura.id, data: parsed };
  } catch (error: any) {
    console.error('Error en procesarFacturaPDF:', error);
    return { ok: false, error: error.message || 'Error desconocido procesando el PDF' };
  }
}

function parseAfipInvoiceText(text: string, filename?: string) {
  // Inicializar objeto con valores por defecto
  const data: any = {
    tipoComprobante: 'FACTURA',
    puntoVenta: '',
    numeroComprobante: '',
    fechaEmision: new Date(),
    razonSocialEmisor: '',
    cuitEmisor: '',
    subtotal: 0,
    importeTotal: 0,
    otrosTributos: 0,
    caeNumero: '',
  };

  // 1. Tipo de Comprobante (FACTURA A, B, C, etc.)
  const tipoMatch = text.match(/FACTURA\s+([A-CM])/i);
  if (tipoMatch) data.tipoComprobante = `FACTURA ${tipoMatch[1]}`;

  // 2. Punto de venta y Número
  // "Punto de Venta: 00005 Comp. Nro: 00000001"
  const nroMatch = text.match(/Punto de Venta:\s*(\d+)\s*Comp\. Nro:\s*(\d+)/i);
  if (nroMatch) {
    data.puntoVenta = nroMatch[1].padStart(5, '0');
    data.numeroComprobante = nroMatch[2].padStart(8, '0');
  }

  // 3. Fecha de Emisión
  // "Fecha de Emisión: 10/03/2026"
  const fechaMatch = text.match(/Fecha de Emisi[óo]n:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (fechaMatch) {
    const [d, m, y] = fechaMatch[1].split('/');
    data.fechaEmision = new Date(`${y}-${m}-${d}T12:00:00Z`);
  }

  // 4. CUIT Emisor
  // Intentar encontrar CUIT con prefijo
  const cuitMatch = text.match(/(?:CUIT|CUIL)[:\s]*(\d{2}-?\d{8}-?\d{1})/i);
  if (cuitMatch) {
    let val = cuitMatch[1];
    if (val.length === 11 && !val.includes('-')) {
        val = `${val.slice(0,2)}-${val.slice(2,10)}-${val.slice(10)}`;
    }
    data.cuitEmisor = val;
  } else {
    // Si no hay prefijo, buscar cualquier patrón de CUIT que no sea del receptor
    const allCuits = text.match(/\b\d{2}-?\d{8}-?\d{1}\b/g);
    if (allCuits && allCuits.length > 0) {
        // El primer CUIT que aparece suele ser el del emisor
        let val = allCuits[0];
        if (val.length === 11 && !val.includes('-')) {
            val = `${val.slice(0,2)}-${val.slice(2,10)}-${val.slice(10)}`;
        }
        data.cuitEmisor = val;
    }
  }

  // 5. Razón Social Emisor
  // Generalmente está al principio antes del CUIT o cerca del logo
  // Es difícil con Regex puro, pero solemos buscar la primera línea con texto significativo o entre "ORIGINAL" y "CUIT"
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    // A veces la primera línea es "ORIGINAL" o el Tipo de Comprobante
    // Buscamos algo que no sea técnico
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        if (!/ORIGINAL|DUPLICADO|FACTURA|Punto de Venta|CUIT|FECHA/i.test(lines[i]) && lines[i].length > 3) {
            data.razonSocialEmisor = lines[i];
            break;
        }
    }
  }

  // 6. CAE
  const caeMatch = text.match(/CAE N[°º]:\s*(\d+)/i);
  if (caeMatch) data.caeNumero = caeMatch[1];

  const caeVtoMatch = text.match(/Fecha de Vto\. de CAE:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (caeVtoMatch) {
    const [d, m, y] = caeVtoMatch[1].split('/');
    data.caeVto = new Date(`${y}-${m}-${d}T12:00:00Z`);
  }

  // 7. Importes
  // "Importe Total: $ 1.250,00" o "Importe Neto Gravado: $ ..."
  // "Subtotal: $ ..."
  
  const parseNumber = (s: string) => {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  };

  const totalMatch = text.match(/Importe Total:\s*\$\s*([\d\.,]+)/i);
  if (totalMatch) data.importeTotal = parseNumber(totalMatch[1]);

  const subtotalMatch = text.match(/Subtotal:\s*\$\s*([\d\.,]+)/i);
  if (subtotalMatch) data.subtotal = parseNumber(subtotalMatch[1]);

  const ivaMatch = text.match(/IVA \d+%:\s*\$\s*([\d\.,]+)/i);
  // Un comprobante puede tener varios IVAs. Aquí simplificamos o sumamos.
  
  // Si no hay subtotal, restamos IVAs del total o algo similar
  if (data.subtotal === 0) data.subtotal = data.importeTotal;

  // 8. Receptor (Opcional)
  const cuitReceptorMatch = text.match(/CUIT\s*Receptor:\s*(\d{2}-\d{8}-\d{1})/i);
  if (cuitReceptorMatch) data.cuitReceptor = cuitReceptorMatch[1];
  
  const rsReceptorMatch = text.match(/Apellido y Nombre \/ Raz[óo]n Social:\s*(.*)/i);
  if (rsReceptorMatch) data.razonSocialReceptor = rsReceptorMatch[1].trim();
  
  // 9. Fallback CUIT desde Nombre de Archivo
  if (!data.cuitEmisor && filename) {
    const fileMatch = filename.match(/^(\d{11})/);
    if (fileMatch) {
        const val = fileMatch[1];
        data.cuitEmisor = `${val.slice(0,2)}-${val.slice(2,10)}-${val.slice(10)}`;
    }
  }

  return data;
}
