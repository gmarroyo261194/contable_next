"use server";

import { auth } from "@/auth";
import { getAuditLogEmpresa, AuditAccion } from "@/lib/audit/auditLogger";

/**
 * Server action para obtener los logs de auditoría de la empresa activa.
 * Valida la sesión antes de realizar la consulta.
 */
export async function getAuditLogsAction(params: {
  page?: number;
  pageSize?: number;
  entidad?: string;
  accion?: AuditAccion;
}) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) {
    throw new Error("No hay una empresa activa seleccionada o sesión expirada.");
  }

  // Llamada al servicio centralizado
  const result = await getAuditLogEmpresa(parseInt(empresaId), params);

  // Serialización para evitar errores de Next.js con objetos complejos/Date
  return JSON.parse(JSON.stringify(result));
}
