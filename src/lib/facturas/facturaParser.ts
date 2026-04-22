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

  // 3.1.5. Nombre Emisor (para evitar confundirlo con el receptor)
  const emisorCuitLineIdx = lines.findIndex(l => l.replace(/-/g, '').includes(data.cuitEmisor));
  if (emisorCuitLineIdx !== -1) {
    for (let offset of [1, -1, 2, -2, 3, -3]) {
      const idx = emisorCuitLineIdx + offset;
      if (idx >= 0 && idx < lines.length) {
        const l = lines[idx].trim();
        if (l.length > 5 && !/CUIT|Ingresos|Inicio|Fecha|Domicilio|Punto|Comercial|Comp\.|Nro/i.test(l)) {
          data.nombreEmisor = l;
          break;
        }
      }
    }
  }

  // 3.2. Nombre Receptor
  const idxLabel = lines.findIndex(l => l.includes("Apellido y Nombre / Razón") || l.includes("ñor(es):"));
  if (idxLabel !== -1) {
    for (let i = idxLabel; i < Math.min(lines.length, idxLabel + 20); i++) {
        let l = lines[i].trim();
        if (!l) continue;
        if (l.includes("Apellido y Nombre") || l.includes("ñor(es):")) continue;
        if (l.includes("Domicilio:") || l.includes("Condición frente al IVA:") || l.includes("Condición de venta:")) continue;
        
        // Filtro de fechas más robusto (si contiene una fecha o formato de periodo)
        if (l.includes("/") && /\d{2}\/\d{2}\/\d{4}/.test(l)) continue; 
        
        // Filtro de CUITs y números largos
        if (l.replace(/-/g, '').match(/^\d{11}$/)) continue;
        if (l.includes("CUIT:") || l.includes("Ingresos Brutos") || l.includes("Inicio de Actividades")) continue;
        
        // Filtro de palabras que indican que es parte del encabezado/periodo y no el nombre
        if (l.toLowerCase().includes("período") || l.toLowerCase().includes("hasta:") || l.toLowerCase().includes("vto.")) continue;
        
        // Evitar capturar el nombre del emisor si aparece por error
        if (data.nombreEmisor && l.toUpperCase().includes(data.nombreEmisor.toUpperCase().substring(0, 5))) continue;
        
        // Si el receptor CUIT está más adelante en el texto, y esta línea está muy arriba, 
        // podría ser el emisor. En AFIP el receptor suele estar cerca de su CUIT.
        const cuitReceptorIdx = lines.findIndex(line => line.includes(data.cuitReceptor));
        if (cuitReceptorIdx !== -1 && i < cuitReceptorIdx - 5) {
            // Si está muy lejos del CUIT del receptor, probablemente no sea el nombre del receptor
            // a menos que no haya nada más.
            continue; 
        }

        // El primer string que pasa estos filtros suele ser el nombre
        data.nombreReceptor = l;
        break;
    }
  }

  // Fallback 1: Buscar cerca del CUIT del receptor (ESTA ES LA UBICACIÓN MÁS FIABLE)
  const cuitLineIdx = lines.findIndex(l => l.replace(/-/g, '').includes(data.cuitReceptor));
  if (cuitLineIdx !== -1) {
    for (let offset of [1, 2, 3, 4, 5, -1, -2]) {
      const idx = cuitLineIdx + offset;
      if (idx >= 0 && idx < lines.length) {
        let l = lines[idx].trim();
        if (!l || l.length < 3 || l.includes(":") || l.includes("/") || l.includes("$")) continue;
        if (l.toUpperCase().includes("CÓDIGO") || l.toUpperCase().includes("PRODUCTO") || l.toUpperCase().includes("CANTIDAD") || l.toUpperCase().includes("UNIDADES")) continue;
        if (data.nombreEmisor && l.toUpperCase().includes(data.nombreEmisor.toUpperCase().substring(0, 5))) continue;
        
        // Si ya teníamos un nombre pero este está más cerca del CUIT, preferimos este
        data.nombreReceptor = l;
        break;
      }
    }
  }

  // Fallback 2: Expresión regular clásica
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
        // El regex para AFIP debe ser estricto: Descripción + Cantidad + Unidad + P.Unit + %Bonif + I.Bonif + Subtotal
        // Buscamos que termine con al menos 4-5 bloques numéricos con formato de moneda (X.XXX,XX)
        const matchEndsNums = line.match(/(.*?)\s+([\d\.,]+)\s+([A-Za-z]+)\s+([\d\.,]+)\s+([\d\.,]+)\s+([\d\.,]+)\s+([\d\.,]+)$/);
        
        if (matchEndsNums) {
            const rawCant = matchEndsNums[2].replace(/\./g, "").replace(",", ".");
            const cant = parseFloat(rawCant);
            const um = matchEndsNums[3];
            const precioUnit = parseFloat(matchEndsNums[4].replace(/\./g, "").replace(",", "."));
            
            // Validación: la cantidad en facturas de servicios suele ser pequeña o tener coma. 
            // Si es un número gigante (pedido) sin coma decimal original, es probable que sea descripción.
            const looksLikeId = !matchEndsNums[2].includes(",") && cant > 1000000;

            if (!looksLikeId) {
              const descPart = (currentDesc + " " + matchEndsNums[1]).trim();
              data.items.push({
                  descripcion: descPart,
                  cantidad: cant,
                  unidades: um,
                  precioUnitario: precioUnit,
                  importeTotal: cant * precioUnit
              });
              currentDesc = ""; // Reset
              continue;
            }
        }
        
        // Si no es una línea de valores, es parte de la descripción (o basura que limpiaremos después)
        currentDesc += (currentDesc ? " " : "") + line;
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
