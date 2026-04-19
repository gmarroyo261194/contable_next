/**
 * Traduce el código de tipo de comprobante de AFIP a un nombre descriptivo (de fantasía).
 * @param {string} tipo - Código del comprobante (ej: '11', '13').
 * @returns {string} Nombre descriptivo del comprobante.
 */
export function getTipoComprobanteNombre(tipo: string): string {
  const mapeo: Record<string, string> = {
    "1": "FC Factura A",
    "2": "ND Nota de Débito A",
    "3": "NC Nota de Crédito A",
    "6": "FC Factura B",
    "7": "ND Nota de Débito B",
    "8": "NC Nota de Crédito B",
    "11": "FC Factura C",
    "12": "ND Nota de Débito C",
    "13": "NC Nota de Crédito C",
    "19": "FC Factura E",
    "20": "ND Nota de Débito E",
    "21": "NC Nota de Crédito E",
  };

  return mapeo[tipo] || `Tipo ${tipo}`;
}
