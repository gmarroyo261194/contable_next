/**
 * Tipos de comprobantes AFIP (WSFEv1)
 */
export const TIPO_COMPROBANTE = {
  // Facturas
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,

  // Facturas de Exportación
  FACTURA_E: 19,
  NOTA_DEBITO_E: 20,
  NOTA_CREDITO_E: 21,

  // Notas de Débito
  NOTA_DEBITO_A: 2,
  NOTA_DEBITO_B: 7,
  NOTA_DEBITO_C: 12,

  // Notas de Crédito
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
  NOTA_CREDITO_C: 13,

  // Facturas de Crédito Electrónica MiPyME (FCE)
  FCE_A: 201,
  FCE_B: 206,
  FCE_C: 211,

  // Notas de Débito FCE MiPyME
  ND_FCE_A: 202,
  ND_FCE_B: 207,
  ND_FCE_C: 212,

  // Notas de Crédito FCE MiPyME
  NC_FCE_A: 203,
  NC_FCE_B: 208,
  NC_FCE_C: 213,
} as const;

export type TipoComprobante = (typeof TIPO_COMPROBANTE)[keyof typeof TIPO_COMPROBANTE];

export const TIPO_DOC = {
  CUIT: 80,
  CUIL: 86,
  CDI: 87,
  PASAPORTE: 89,
  DNI: 96,
  CONSUMIDOR_FINAL: 99,
} as const;

export type TipoDoc = (typeof TIPO_DOC)[keyof typeof TIPO_DOC];

export const CONCEPTO = {
  PRODUCTOS: 1,
  SERVICIOS: 2,
  PRODUCTOS_Y_SERVICIOS: 3,
} as const;

export type Concepto = (typeof CONCEPTO)[keyof typeof CONCEPTO];

export const TIPO_IVA = {
  NO_GRAVADO: 1,
  EXENTO: 2,
  IVA_0: 3,
  IVA_10_5: 4,
  IVA_21: 5,
  IVA_27: 6,
  IVA_5: 8,
  IVA_2_5: 9,
} as const;

export type TipoIva = (typeof TIPO_IVA)[keyof typeof TIPO_IVA];

/**
 * Labels legibles para cada tipo de comprobante
 */
export const TIPO_COMPROBANTE_LABEL: Record<number, string> = {
  1: 'Factura A',
  6: 'Factura B',
  11: 'Factura C',
  19: 'Factura E (Exportación)',
  20: 'Nota de Débito E',
  21: 'Nota de Crédito E',
  12: 'Nota de Débito C',
  13: 'Nota de Crédito C',
  211: 'Factura de Crédito Electrónica MiPyME C',
  202: 'ND FCE A',
  207: 'ND FCE B',
  212: 'ND FCE C',
  203: 'NC FCE A',
  208: 'NC FCE B',
  213: 'NC FCE C',
};

export const MONEDA = {
  PESOS: 'PES',
  DOLAR: 'DOL',
} as const;

export const PAISES_AFIP = [
  { Id: 200, Nombre: 'Estados Unidos' },
  { Id: 250, Nombre: 'Uruguay' },
  { Id: 205, Nombre: 'Chile' },
  { Id: 215, Nombre: 'Brasil' },
  { Id: 218, Nombre: 'Paraguay' },
  { Id: 211, Nombre: 'España' },
  { Id: 210, Nombre: 'Francia' },
  { Id: 212, Nombre: 'Italia' },
  { Id: 310, Nombre: 'China' },
] as const;

export interface AfipIvaItem {
  Id: TipoIva;   // Código de alícuota IVA
  BaseImp: number;  // Importe neto gravado
  Importe: number;  // Importe IVA
}

export interface AfipTributoItem {
  Id: number;
  Desc: string;
  BaseImp: number;
  Alic: number;
  Importe: number;
}

export const CONDICION_IVA = {
  IVA_RESPONSABLE_INSCRIPTO: 1,
  IVA_RESPONSABLE_NO_INSCRIPTO: 2,
  IVA_NO_RESPONSABLE: 3,
  IVA_SUJETO_EXENTO: 4,
  CONSUMIDOR_FINAL: 5,
  RESPONSABLE_MONOTRIBUTO: 6,
  SUJETO_NO_CATEGORIZADO: 7,
  PROVEEDOR_DEL_EXTERIOR: 8,
  CLIENTE_DEL_EXTERIOR: 9,
  IVA_LIBERADO_LEY_19640: 10,
  IVA_RESP_INSCRIPTO_AG_PERCEP: 11,
  PEQUENO_CONTRIBUYENTE_EVENTUAL: 12,
  MONOTRIBUTO_SOCIAL: 13,
  PEQUENO_CONTRIBUYENTE_EVENTUAL_SOCIAL: 14,
} as const;

export type CondicionIva = (typeof CONDICION_IVA)[keyof typeof CONDICION_IVA];

export const CONDICION_IVA_LABEL: Record<number, string> = {
  1: 'Responsable Inscripto',
  2: 'Responsable no Inscripto',
  3: 'IVA no Responsable',
  4: 'Sujeto Exento',
  5: 'Consumidor Final',
  6: 'Responsable Monotributo',
  7: 'Sujeto no Categorizado',
  8: 'Proveedor del Exterior',
  9: 'Cliente del Exterior',
  10: 'IVA Liberado – Ley Nº 19.640',
  11: 'IVA RI – Agente de Percepción',
  12: 'Pequeño Contribuyente Eventual',
  13: 'Monotributo Social',
  14: 'Pequeño Contribuyente Eventual Social',
};

export interface AfipItem {
  Desc: string;
  Cant: number;
  PrecioUnit: number;
  ImporteTotal: number;
}

export interface AfipVoucherData {
  CantReg: number;        // Cantidad de comprobantes (siempre 1 en uso normal)
  PtoVta: number;         // Punto de venta
  CbteTipo: TipoComprobante; // Tipo de comprobante
  Concepto: Concepto;     // Tipo de concepto
  DocTipo: TipoDoc;       // Tipo de documento receptor
  DocNro: number;         // Número de documento receptor
  CondicionIVAReceptorId: CondicionIva; // NUEVO: Condicion IVA (RG 5616)
  CbteDesde: number;      // Número de comprobante desde
  CbteHasta: number;      // Número de comprobante hasta
  CbteFch: number;        // Fecha del comprobante (yyyymmdd)
  ImpTotal: number;       // Importe total
  ImpTotConc: number;     // Importe neto no gravado
  ImpNeto: number;        // Importe neto gravado
  ImpOpEx: number;        // Importe exento de IVA
  ImpIVA: number;         // Importe total de IVA
  ImpTrib: number;        // Importe total de tributos
  MonId: string;          // Código de moneda ('PES' = pesos)
  MonCotiz: number;       // Cotización de la moneda
  DstCmp?: number;        // Destino del comprobante (Código AFIP del país) – para Exp.
  FchServDesde?: number;  // Fecha desde del servicio (yyyymmdd) – requerido si Concepto = 2 o 3
  FchServHasta?: number;  // Fecha hasta del servicio (yyyymmdd)
  FchVtoPago?: number;    // Fecha vto de pago (yyyymmdd)
  Iva?: AfipIvaItem[];    // Array de alícuotas IVA (no aplica Factura C)
  Tributos?: AfipTributoItem[];
  CbtesAsoc?: Array<{    // Comprobantes asociados (para NC/ND)
    Tipo: number;
    PtoVta: number;
    Nro: number;
  }>;
  Opcionales?: Array<{
    Id: string;
    Valor: string;
  }>;
  Nombre?: string;        // Nombre del cliente (para Exportación)
  Domicilio?: string;     // Domicilio del cliente (para Exportación)
  Items?: AfipItem[];     // Detalle de ítems (requerido para Exportación)
}

export interface AfipVoucherResult {
  CAE: string;
  CAEFchVto: string;  // yyyy-mm-dd
  voucher_number: number;
}

export interface AfipLastVoucherResult {
  numeroComprobante: number;
  tipoComprobante: number;
  ptoVenta: number;
}
