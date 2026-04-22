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
    fechaEmision: new Date().toISOString().split('T')[0] + "T12:00:00",
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
  try {
    require('fs').writeFileSync('d:/contable_next/debug_pdf_text.txt', text);
  } catch (e) { }

  if (!data.puntoVenta || !data.numero) {
    console.log("[FacturaParser] Nro no detectado. Texto volcado a debug_pdf_text.txt");
  }

  // 3. CUIT Emisor - SE IGNORA SEGÚN INSTRUCCIÓN (solo se mantiene PV y Nro del encabezado)
  // No buscamos proactivamente el CUIT del emisor para evitar confusiones con el del receptor.
  const lines = text.split('\n').map(l => l.trim());
  let foundCuitEmisor = '';
  // Solo buscamos CUITs generales para tener la lista completa, pero no asignamos emisor desde el encabezado.

  // 3.1. CUITs (Emisor y Receptor)
  const allCuits = [...text.matchAll(/\b(\d{2}-?\d{8}-?\d{1})\b/g)];

  // Intentar encontrar el CUIT del receptor por cercanía extrema a su etiqueta (misma línea o adyacentes)
  const idxLabelReceptor = lines.findIndex(l => l.includes("Apellido y Nombre / Razón") || l.includes("ñor(es):"));
  // El usuario confirmó que 30640431373 es el CUIT que debe ignorarse
  const CUITS_A_IGNORAR = ["30640431373"];
  const NOMBRE_A_IGNORAR = "FUNDACION UNIVERSIDAD TECNOLOGICA";

  if (idxLabelReceptor !== -1) {
    for (let i = Math.max(0, idxLabelReceptor - 1); i <= Math.min(lines.length - 1, idxLabelReceptor + 2); i++) {
      const m = lines[i].match(/\b(\d{2}-?\d{8}-?\d{1})\b/);
      if (m) {
        const potentialCuit = m[1].replace(/-/g, '');
        if (!CUITS_A_IGNORAR.includes(potentialCuit)) {
          data.cuitReceptor = potentialCuit;
          break;
        }
      }
    }
  }

  if (allCuits.length >= 1) {
    if (!data.cuitReceptor) {
      // Si no se encontró por etiqueta directa, buscar el que esté MÁS ABAJO del label del receptor
      // (Ignorando los que están arriba en el encabezado y el CUIT específico a ignorar)
      let bestMatch = null;
      let minDistance = 999;

      allCuits.forEach((match) => {
        const potentialCuit = match[1].replace(/-/g, '');
        if (CUITS_A_IGNORAR.includes(potentialCuit)) return; // IGNORAR según instrucción

        const pos = match.index || 0;
        const lineIdx = text.substring(0, pos).split('\n').length - 1;

        // Solo considerar CUITs que están en la misma línea o DESPUÉS del label del receptor
        if (lineIdx >= idxLabelReceptor - 1) {
          const dist = Math.abs(lineIdx - idxLabelReceptor);
          if (dist < minDistance) {
            minDistance = dist;
            bestMatch = potentialCuit;
          }
        }
      });
      data.cuitReceptor = bestMatch || "";
    }

    // Identificar el otro CUIT como emisor solo si es necesario, pero priorizando el receptor
    const otherCuit = allCuits.find(m => m[1].replace(/-/g, '') !== data.cuitReceptor);
    if (otherCuit) {
      data.cuitEmisor = otherCuit[1].replace(/-/g, '');
    }
  }

  // 3.1. Nombre Emisor - SE IGNORA SEGÚN INSTRUCCIÓN
  data.nombreEmisor = "";
  // 3.2. Nombre Receptor
  const idxLabel = lines.findIndex(l => l.includes("Apellido y Nombre / Razón") || l.includes("ñor(es):"));
  if (idxLabel !== -1) {
    for (let i = idxLabel; i < Math.min(lines.length, idxLabel + 20); i++) {
      let l = lines[i].trim();
      if (!l) continue;
      if (l.includes("Apellido y Nombre") || l.includes("ñor(es):")) {
        const matchName = l.match(/(?:Apellido y Nombre \/ Raz[óo]n Social:|Se[ñn]or\(es\):)\s*(.+)/i);
        if (matchName && matchName[1].trim().length > 2) {
          let candidate = matchName[1].trim();
          if (candidate.toUpperCase().includes(NOMBRE_A_IGNORAR.toUpperCase())) {
            candidate = ""; // Ignorar si es la Fundación
          }

          if (candidate) {
            candidate = candidate.split(/Domicilio:/i)[0].trim();
            candidate = candidate.split(/Condici[óo]n/i)[0].trim();
          }

          if (candidate && candidate.length > 2) {
            data.nombreReceptor = candidate;
            // Verificar si la siguiente línea es continuación del nombre
            if (i + 1 < lines.length) {
              const nextLine = lines[i + 1].trim();
              // Si la siguiente línea es corta o tiene mayúsculas y no tiene etiquetas/números
              if (nextLine && nextLine.length > 3 && !nextLine.includes(":") && !nextLine.includes("/") && !/\b\d{4,}\b/.test(nextLine)) {
                data.nombreReceptor += " " + nextLine;
              }
            }
            break;
          }
        }
        continue;
      }
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

      // REFUERZO: Evitar absolutamente capturar a la Fundación
      if (l.toUpperCase().includes(NOMBRE_A_IGNORAR.toUpperCase())) continue;

      // Eliminado el chequeo de cuitReceptorIdx - 5 porque pdf-parse a veces coloca el CUIT del receptor 20 líneas por debajo de su nombre.
      // Como ya estamos bloqueando "FUNDACION" con NOMBRE_A_IGNORAR, no hay riesgo de capturar al emisor.

      // El primer string que pasa estos filtros suele ser el nombre
      data.nombreReceptor = l;

      // Soporte para nombres que ocupan 2 líneas (ej: EMPRESA MENDOCINA DE ENERGIA... en la línea 1 y CON PARTICIPAC en la línea 2)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        // Si la siguiente línea es corta, no contiene números (como una dirección postal) ni símbolos extraños
        if (nextLine && nextLine.length > 2 && nextLine.length < 50 && !/\d/.test(nextLine) && !nextLine.includes(":") && !nextLine.includes("/")) {
          data.nombreReceptor += " " + nextLine;
        }
      }
      break;
    }
  }

  // Fallback 1: Buscar cerca del CUIT del receptor (ESTA ES LA UBICACIÓN MÁS FIABLE)
  // SOLO usar fallback si no tenemos un nombre válido
  if (!data.nombreReceptor || data.nombreReceptor.trim().length <= 2) {
    const cuitLineIdx = lines.findIndex(l => l.replace(/-/g, '').includes(data.cuitReceptor));
    if (cuitLineIdx !== -1) {
      for (let offset of [1, 2, 3, 4, 5, -1, -2]) {
        const idx = cuitLineIdx + offset;
        if (idx >= 0 && idx < lines.length) {
          let l = lines[idx].trim();
          if (!l || l.length < 3 || l.includes(":") || l.includes("/") || l.includes("$")) continue;
          if (l.toUpperCase().includes("CÓDIGO") || l.toUpperCase().includes("PRODUCTO") || l.toUpperCase().includes("CANTIDAD") || l.toUpperCase().includes("UNIDADES")) continue;
          if (data.nombreEmisor && l.toUpperCase().includes(data.nombreEmisor.toUpperCase().substring(0, 5))) continue;

          // REFUERZO: Evitar absolutamente capturar a la Fundación
          if (l.toUpperCase().includes(NOMBRE_A_IGNORAR.toUpperCase())) continue;

          data.nombreReceptor = l;
          break;
        }
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
  // Se agrega T12:00:00 para evitar desfasajes de huso horario (ej. -3 horas en Argentina resta un día si son las 00:00)
  const fechaEmisionMatch = text.match(/Fecha de Emisi[óo]n:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (fechaEmisionMatch) {
    const [d, m, y] = fechaEmisionMatch[1].split('/');
    data.fechaEmision = `${y}-${m}-${d}T12:00:00`;
  } else {
    const genericDateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
    if (genericDateMatch) {
      const [d, m, y] = genericDateMatch[0].split('/');
      data.fechaEmision = `${y}-${m}-${d}T12:00:00`;
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
        // El regex para AFIP debe aislar la descripción de la Cantidad + Unidad.
        // Toleramos cualquier cantidad de números al final porque pdf-parse puede desordenar las columnas.
        const matchEndsNums = line.match(/(.*?)\s+([\d\.,]+)\s+(unidades|u\.|kg|lts|litros|mts|km|hs|horas|dias|días|meses|gramos|gr|cm)\b\s*([\d\.,\s]*)$/i);

        if (matchEndsNums) {
          const rawCant = matchEndsNums[2].replace(/\./g, "").replace(",", ".");
          const cant = parseFloat(rawCant);
          const um = matchEndsNums[3];
          
          let precioUnit = cant > 0 && data.importeTotal ? data.importeTotal / cant : 0;
          const tailNums = matchEndsNums[4].trim().split(/\s+/).filter(n => /^[\d\.,]+$/.test(n));
          
          if (tailNums.length > 0) {
            precioUnit = parseFloat(tailNums[0].replace(/\./g, "").replace(",", "."));
          }

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
        // Limpiar por si acado quedaron números y "unidades" atorados al final
        let finalDesc = currentDesc.trim();
        const cleanup = finalDesc.match(/(.*?)\s+[\d\.,]+\s+(?:unidades|u\.|kg|lts|litros|mts|km|hs|horas|dias|días|meses|gramos|gr|cm)\b/i);
        if (cleanup) finalDesc = cleanup[1].trim();

        data.items.push({
          descripcion: finalDesc,
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
