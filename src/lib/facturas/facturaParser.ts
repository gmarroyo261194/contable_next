// src/lib/facturas/facturaParser.ts
import { PDFParse } from 'pdf-parse';

export interface ExtractedFacturaData {
  letra: string;
  puntoVenta: string;
  numero: string;
  fechaEmision: string; // ISO yyyy-mm-dd
  cuitEmisor: string;
  importeTotal: number;
  mesHonorarios?: number;
  anioHonorarios?: number;
  textoCompleto: string;
}

const MESES_NOMBRES: Record<string, number> = {
  'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4, 'MAYO': 5, 'JUNIO': 6,
  'JULIO': 7, 'AGOSTO': 8, 'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
};

export async function parseFacturaPDF(buffer: Buffer): Promise<ExtractedFacturaData> {
  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  const text = pdfData.text;

  if (!text || text.trim().length === 0) {
    throw new Error('No se pudo extraer texto del PDF.');
  }

  const data: ExtractedFacturaData = {
    letra: 'C', // Default
    puntoVenta: '',
    numero: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    cuitEmisor: '',
    importeTotal: 0,
    textoCompleto: text
  };

  // 1. Letra del Comprobante (FACTURA A, B, C, etc.)
  const tipoMatch = text.match(/FACTURA\s+([A-CM])/i);
  if (tipoMatch) data.letra = tipoMatch[1].toUpperCase();

  // 2. Punto de venta y Número
  // "Punto de Venta: Comp. Nro: 00002 00000119"
  const nroMatch = text.match(/Punto de Venta:.*?Comp\. Nro:.*?(\d+)\s+(\d+)/i);
  if (nroMatch) {
    data.puntoVenta = nroMatch[1].padStart(5, '0');
    data.numero = nroMatch[2].padStart(8, '0');
  }

  // 3. CUIT Emisor
  // Prioridad 1: Buscar arriba de "Ingresos Brutos:" (Basado en feedback del usuario)
  const lines = text.split('\n').map(l => l.trim());
  const iibvIndex = lines.findIndex(l => l.includes("Ingresos Brutos:"));
  let foundCuit = '';

  if (iibvIndex > 0) {
    // Buscamos en las 5 líneas anteriores
    for (let i = iibvIndex - 1; i >= Math.max(0, iibvIndex - 5); i--) {
      const match = lines[i].match(/\d{2}-?\d{8}-?\d{1}/);
      if (match) {
        foundCuit = match[0].replace(/-/g, '');
        break;
      }
    }
  }

  // Prioridad 2: Fallback al primer CUIT que aparezca en el texto
  if (!foundCuit) {
    const cuitMatch = text.match(/(?:CUIT|CUIL)[:\s]*(\d{2}-?\d{8}-?\d{1})/i);
    if (cuitMatch) {
      foundCuit = cuitMatch[1].replace(/-/g, '');
    } else {
      // Búsqueda agresiva de cualquier 11 dígitos que parezca CUIT
      const genericCuitMatch = text.match(/\b(\d{2}-?\d{8}-?\d{1})\b/);
      if (genericCuitMatch) {
        foundCuit = genericCuitMatch[1].replace(/-/g, '');
      }
    }
  }

  data.cuitEmisor = foundCuit;

  // 4. Fecha de Emisión
  // Buscamos fechas con formato dd/mm/yyyy. Suele haber varias.
  // Intentamos buscar una cerca de "Fecha de Emisión"
  const fechaEmisionMatch = text.match(/Fecha de Emisi[óo]n:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (fechaEmisionMatch) {
    const [d, m, y] = fechaEmisionMatch[1].split('/');
    data.fechaEmision = `${y}-${m}-${d}`;
  } else {
    // Si no está explícito, buscamos la primera fecha dd/mm/yyyy que aparezca (suele ser emisión o vencimiento)
    const genericDateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
    if (genericDateMatch) {
      const [d, m, y] = genericDateMatch[0].split('/');
      data.fechaEmision = `${y}-${m}-${d}`;
    }
  }

  // 5. Importe Total
  let foundTotal = 0;
  const totalIndex = lines.findIndex(l => l.includes("Importe Total:"));

  if (totalIndex !== -1) {
    // Caso 1: Está en la misma línea
    const sameLineMatch = lines[totalIndex].match(/Importe Total:.*?([\d\.,]+)/i);
    if (sameLineMatch && sameLineMatch[1].includes(',')) {
      const rawValue = sameLineMatch[1].replace(/\./g, '').replace(',', '.');
      foundTotal = parseFloat(rawValue);
    } 
    
    // Caso 2: Está en líneas anteriores (Típico en este generador)
    if (!foundTotal) {
      for (let i = totalIndex - 1; i >= Math.max(0, totalIndex - 5); i--) {
        // Buscamos un número que parezca un importe (ej: 906571,14)
        const match = lines[i].match(/^([\d\.]*,\d{2})$/);
        if (match) {
          const rawValue = match[1].replace(/\./g, '').replace(',', '.');
          foundTotal = parseFloat(rawValue);
          break;
        }
      }
    }
  }

  // Fallback: usar el regex original si lo anterior falla
  if (!foundTotal) {
    const totalMatch = text.match(/Importe Total:\s*\$\s*([\d\.,]+)/i);
    if (totalMatch) {
      const rawValue = totalMatch[1].replace(/\./g, '').replace(',', '.');
      foundTotal = parseFloat(rawValue);
    }
  }

  data.importeTotal = foundTotal;

  // 6. Mes y Año de Honorarios (Específico para estas facturas)
  // Ejemplo: "correspondiente al mes de JULIO de 2025"
  const honorariosMatch = text.match(/mes de\s+([A-Z]+)\s+de\s+(\d{4})/i);
  if (honorariosMatch) {
    const mesNombre = honorariosMatch[1].toUpperCase();
    if (MESES_NOMBRES[mesNombre]) {
      data.mesHonorarios = MESES_NOMBRES[mesNombre];
      data.anioHonorarios = parseInt(honorariosMatch[2]);
    }
  } else {
    // Fallback: usar el mes de la fecha de emisión si no se encuentra en el texto
    const dateParts = data.fechaEmision.split('-');
    data.anioHonorarios = parseInt(dateParts[0]);
    data.mesHonorarios = parseInt(dateParts[1]);
  }

  return data;
}
