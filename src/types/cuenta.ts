export type TipoCuenta = "ACTIVO" | "PASIVO" | "RESULTADO" | "PATRIMONIO_NETO" | "CUENTAS TRANSITORIAS";

export interface Cuenta {
  id: number;
  codigo: string;
  codigoCorto?: number | null;
  nombre: string;
  tipo: TipoCuenta | string;
  imputable: boolean;
  padreId?: number | null;
  path?: string | null;
  level: number;
  hasChildren: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  padre?: Cuenta | null;
}

export interface ImportResult {
  success: boolean;
  count: number;
  message: string;
}
