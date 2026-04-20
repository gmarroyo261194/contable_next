// src/lib/facturas/facturaParser.ts
import { PDFParse } from 'pdf-parse';

export interface FacturaItem {
  descripcion: string;
  cantidad: number;
  unidades?: string;
  precioUnitario: number;
  importeTotal: number;
}

export interface ExtractedFacturaData {
  letra: string;
  tipoComprobante?: string;
  puntoVenta: string;
  numero: string;
  fechaEmision: string; // ISO yyyy-mm-dd
  cuitEmisor: string;
  nombreEmisor?: string;
  cuitReceptor: string;
  nombreReceptor?: string;
  importeTotal: number;
  items: FacturaItem[];
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
    nombreEmisor: '',
    cuitReceptor: '',
    nombreReceptor: '',
    importeTotal: 0,
    items: [],
    textoCompleto: text
  };

  // 1. Letra del Comprobante y Tipo (CÓDIGOS INTERNOS AFIP)
  const codMatch = text.match(/C[ÓO]D\.\s*(\d+)/i);
  if (codMatch) {
    const code = codMatch[1];
    data.tipoComprobante = parseInt(code, 10).toString(); // Guardar el Nro interno numérico como string (ej. "211")
    const mapCodes: Record<string, { letra: string }> = {
      '001': { letra: 'A' },
      '006': { letra: 'B' },
      '011': { letra: 'C' },
      '019': { letra: 'E' },
      '201': { letra: 'A' },
      '206': { letra: 'B' },
      '211': { letra: 'C' },
    };
    if (mapCodes[code]) {
      data.letra = mapCodes[code].letra;
    }
  }

  if (!data.tipoComprobante) {
    const tipoMatch = text.match(/(FACTURA|NOTA DE D[ÉE]BITO|NOTA DE CR[ÉE]DITO)\s+([A-CE])/i);
    if (tipoMatch) {
      data.letra = tipoMatch[2].toUpperCase();
      const tipo = tipoMatch[1].toUpperCase();
      // Map back to codes if possible
      if (tipo === 'FACTURA' && data.letra === 'A') data.tipoComprobante = '1';
      else if (tipo === 'FACTURA' && data.letra === 'B') data.tipoComprobante = '6';
      else if (tipo === 'FACTURA' && data.letra === 'C') data.tipoComprobante = '11';
      else if (tipo === 'FACTURA' && data.letra === 'E') data.tipoComprobante = '19';
      else data.tipoComprobante = `${tipo} ${data.letra}`; // Fallback textual
    }
  }

  // 2. Punto de venta y Número
  // El número de factura en AFIP puede desarmarse si el PDF se lee por columnas (ej: "Pto Venta Nro Comp 00005 00000087").
  // Por lo tanto, buscamos con ".*?" (difuso) para tolerar que haya texto estorbo o que estén desordenados.
  const ptoSearch = text.match(/(?:(?:Punto|Pto\.?)\s*de\s*Venta|Venta).*?\b(\d{4,5})\b/i);
  const nroSearch = text.match(/(?:Comp\.?\s*Nro|Nro\.?|Nº).*?\b(\d{8})\b/i);

  if (ptoSearch && ptoSearch[1]) {
    data.puntoVenta = ptoSearch[1].padStart(5, '0');
  }
  if (nroSearch && nroSearch[1]) {
    data.numero = nroSearch[1];
  }

  // DIAGNÓSTICO: Si aún no extrajo el punto de venta o número, volcar el texto para análisis
  if (!data.puntoVenta || !data.numero) {
    try {
      require('fs').writeFileSync('d:/contable_next/debug_pdf_text.txt', text);
      console.log("[FacturaParser] Nro no detectado. Texto volcado a debug_pdf_text.txt");
    } catch(e) {}
  }

  // 3. CUIT Emisor
  const lines = text.split('\n').map(l => l.trim());
  const iibvIndex = lines.findIndex(l => l.includes("Ingresos Brutos:"));
  let foundCuit = '';

  if (iibvIndex > 0) {
    for (let i = iibvIndex - 1; i >= Math.max(0, iibvIndex - 5); i--) {
      const match = lines[i].match(/\d{2}-?\d{8}-?\d{1}/);
      if (match) {
        foundCuit = match[0].replace(/-/g, '');
        break;
      }
    }
  }

  if (!foundCuit) {
    const cuitMatch = text.match(/(?:CUIT|CUIL)[:\s]*(\d{2}-?\d{8}-?\d{1})/i);
    if (cuitMatch) {
      foundCuit = cuitMatch[1].replace(/-/g, '');
    } else {
      const genericCuitMatch = text.match(/\b(\d{2}-?\d{8}-?\d{1})\b/);
      if (genericCuitMatch) {
        foundCuit = genericCuitMatch[1].replace(/-/g, '');
      }
    }
  }
  data.cuitEmisor = foundCuit;

  // 3.1. CUIT Receptor
  const allCuits = [...text.matchAll(/\b(\d{2}-?\d{8}-?\d{1})\b/g)];
  if (allCuits.length >= 2) {
    // En AFIP, emisor es el primero, receptor el segundo
    data.cuitReceptor = allCuits[1][1].replace(/-/g, '');
  }

  // 3.2. Nombre Receptor
  const idxLabel = lines.findIndex(l => l.includes("Apellido y Nombre / Razón") || l.includes("ñor(es):"));
  if (idxLabel !== -1) {
    for (let i = idxLabel; i < Math.min(lines.length, idxLabel + 15); i++) {
        let l = lines[i].trim();
        if (!l) continue;
        if (l.includes("Apellido y Nombre") || l.includes("ñor(es):")) continue;
        if (l.includes("Domicilio:") || l.includes("Condición frente al IVA:")) continue;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(l)) continue; // date
        if (/^\d{2}-?\d{8}-?\d{1}$/.test(l) || /^\d{11}$/.test(l)) continue; // cuit
        if (l.includes("CUIT:") || l.includes("Ingresos Brutos")) continue;
        
        // El primer string que pasa estos filtros suele ser el nombre
        data.nombreReceptor = l;
        break;
    }
  }

  // Fallback si no lo encontró
  if (!data.nombreReceptor) {
    const nombreMatches = [...text.matchAll(/(?:Apellido y Nombre \/ Raz[óo]n Social:|Se[ñn]or\(es\):)\s*(.+)/gi)];
    if (nombreMatches.length > 0) {
      const match = nombreMatches.length >= 2 ? nombreMatches[1] : nombreMatches[0];
      let candidate = match[1].trim();
      candidate = candidate.split(/DOMICILIO:/i)[0].trim();
      candidate = candidate.split(/CONDICI[OÓ]N VENTA:/i)[0].trim();
      data.nombreReceptor = candidate;
    }
  }

  // 4. Fecha de Emisión
  const fechaEmisionMatch = text.match(/Fecha de Emisi[óo]n:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (fechaEmisionMatch) {
    const [d, m, y] = fechaEmisionMatch[1].split('/');
    data.fechaEmision = `${y}-${m}-${d}`;
  } else {
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
    const sameLineMatch = lines[totalIndex].match(/Importe Total:.*?([\d\.,]+)/i);
    if (sameLineMatch && sameLineMatch[1].includes(',')) {
      const rawValue = sameLineMatch[1].replace(/\./g, '').replace(',', '.');
      foundTotal = parseFloat(rawValue);
    } 
    if (!foundTotal) {
      for (let i = totalIndex - 1; i >= Math.max(0, totalIndex - 5); i--) {
        const match = lines[i].match(/^([\d\.]*,\d{2})$/);
        if (match) {
          const rawValue = match[1].replace(/\./g, '').replace(',', '.');
          foundTotal = parseFloat(rawValue);
          break;
        }
      }
    }
  }
  if (!foundTotal) {
    const totalMatch = text.match(/Importe Total:\s*\$\s*([\d\.,]+)/i);
    if (totalMatch) {
      const rawValue = totalMatch[1].replace(/\./g, '').replace(',', '.');
      foundTotal = parseFloat(rawValue);
    }
  }
  data.importeTotal = foundTotal;

  // 6. Mes y Año de Honorarios
  const honorariosMatch = text.match(/mes de\s+([A-Z]+)\s+de\s+(\d{4})/i);
  if (honorariosMatch) {
    const mesNombre = honorariosMatch[1].toUpperCase();
    if (MESES_NOMBRES[mesNombre]) {
      data.mesHonorarios = MESES_NOMBRES[mesNombre];
      data.anioHonorarios = parseInt(honorariosMatch[2]);
    }
  } else {
    const dateParts = data.fechaEmision.split('-');
    data.anioHonorarios = parseInt(dateParts[0]);
    data.mesHonorarios = parseInt(dateParts[1]);
  }

  // 7. Extracción de Ítems
  try {
    const startIndex = lines.findIndex(l => l.toLowerCase().includes("producto / servicio"));
    const endIndex = lines.findIndex(l => l.toLowerCase().includes("importe total") || l.toLowerCase().includes("otros tributos") || l.toLowerCase().includes("subtotal: $"));
    if (startIndex !== -1) {
      let currentDesc = "";
      
      for (let i = startIndex + 1; i < (endIndex !== -1 ? endIndex : lines.length); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Ignorar basura del encabezado de la tabla AFIP
        if (line.includes("Opción de Transferencia") || line.includes("CBU del Emisor") || line.includes("Fecha de Vto. para el pago")) continue;
        if (/Subtotal/i.test(line) || /^[\d\.,]+$/.test(line)) continue; // ignore stray numbers
        
        const textUpper = line.toUpperCase().trim();
        if (textUpper.includes("FUNDACION UNIVERSIDAD") || textUpper.includes("REGIONAL MENDOZA") || textUpper === "MENDOZA" || textUpper === "FUNDACION" || textUpper === "UNIVERSIDAD") continue;

        // Matches line starting with amounts or ending with amounts
        const matchStartsNums = line.match(/^([\d\.,]+)\s+([A-Za-z]+)\s+([\d\.,]+)/);
        const matchEndsNums = line.match(/(.*?)\s+([\d\.,]+)\s+([A-Za-z]+)\s+([\d\.,]+)\s+([\d\.,]+)\s+([\d\.,]+)\s+([\d\.,]+)$/);
        
        if (matchEndsNums) {
            // E.g: "Servicio Limpieza 1,00 unidades 1000,00 1000,00 0,00 0,00"
            const cant = parseFloat(matchEndsNums[2].replace(/\./g, "").replace(",", "."));
            const um = matchEndsNums[3];
            const precioUnit = parseFloat(matchEndsNums[4].replace(/\./g, "").replace(",", "."));
            
            const descPart = (currentDesc + " " + matchEndsNums[1]).trim();
            data.items.push({
                descripcion: descPart,
                cantidad: cant,
                unidades: um,
                precioUnitario: precioUnit,
                importeTotal: cant * precioUnit
            });
            currentDesc = ""; // Reset
        } else if (matchStartsNums) {
            // E.g: "1,00 unidades 4105060,03 4105060,03 0,00 0,00"
            const cant = parseFloat(matchStartsNums[1].replace(/\./g, "").replace(",", "."));
            const um = matchStartsNums[2];
            const precioUnit = parseFloat(matchStartsNums[3].replace(/\./g, "").replace(",", "."));
            
            data.items.push({
                descripcion: currentDesc.trim() || "Ítem sin detalle",
                cantidad: cant,
                unidades: um,
                precioUnitario: precioUnit,
                importeTotal: cant * precioUnit
            });
            currentDesc = ""; // Reset
        } else {
            // Es parte de la descripción, la acumulamos.
            currentDesc += (currentDesc ? " " : "") + line;
        }
      }
      
      // Si quedó una descripción sin procesar, la guardamos
      if (currentDesc.trim() && data.items.length === 0) {
        data.items.push({
            descripcion: currentDesc.trim(),
            cantidad: 1,
            unidades: 'unidades',
            precioUnitario: data.importeTotal,
            importeTotal: data.importeTotal
        });
      }
    }
  } catch (err) {
    console.error("Error al extraer ítems:", err);
  }

  return data;
}
