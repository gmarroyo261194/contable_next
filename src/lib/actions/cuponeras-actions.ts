'use server';

import { dbLegacyFacturacion } from '@/lib/dbFacturacion';
import prisma from '@/lib/prisma';

export interface CuponeraLegacy {
  id_factura: number;
  numfactura: number;
  serie: string;
  id_personaf: number;
  nrodoc: string;
  nombre: string;
  apellido: string;
  nombre_persona: string;
  id_rubro: number;
  id_detallerubro: number;
  id_curso: number;
  estado: number;
  estado_label: string;
  cuotas: CuotaLegacy[];
  alumno?: { id: number; documento: string; nombre: string; apellido: string };
  rubro?: { id: number; nombre: string };
  servicio?: { id: number; nombre: string };
}

export interface CuotaLegacy {
  id_cuotas: number;
  id_factura: number;
  num_cuota: number;
  importe_cuota: number;
  estado: number;
  estado_pagado: number;
  fecha_vto: Date;
  recargo_cuota: number;
  estado_label: string;
  pagada_label: string;
}

/**
 * Obtiene las cuponeras asociadas a un curso desde la base de datos legacy.
 * @param idCurso ID del curso en la base legacy.
 * @returns Lista de cuponeras con sus cuotas y relaciones locales.
 */
export async function getCuponerasByCurso(idCurso: number) {
  try {
    // 1. Obtener facturas (cuponeras) de la base legacy
    const facturas = await dbLegacyFacturacion.$queryRawUnsafe<{
      id_factura: number;
      numfactura: number;
      serie: string;
      id_personaf: number;
      nrodoc: string;
      nombre: string;
      apellido: string;
      nombre_persona: string;
      id_rubro: number;
      id_detallerubro: number;
      id_curso: number;
      estado: number;
    }[]>(`
      SELECT 
        f.id_factura, 
        f.numfactura, 
        f.serie, 
        f.id_personaf, 
        p.nrodoc, 
        p.nombre,
        p.apellido,
        p.nombre + ' ' + p.apellido as nombre_persona,
        f.id_rubro, 
        f.id_detallerubro, 
        f.id_curso, 
        f.estado
      FROM Facturas f
      LEFT JOIN PersonasFisicas p ON f.id_personaf = p.id_personaf
      WHERE f.id_curso = ${idCurso} 
        AND f.serie = 'C' 
        AND f.estado = 0
    `);

    if (!facturas || facturas.length === 0) return [];

    // 2. Obtener cuotas para estas facturas
    const idFacturas = facturas.map(f => f.id_factura).join(',');
    const cuotasRaw = await dbLegacyFacturacion.$queryRawUnsafe<{
      id_cuotas: number;
      id_factura: number;
      num_cuota: number;
      importe_cuota: number;
      recargo_cuota: number;
      fecha_vto: Date;
      estado: number;
      estado_pagado: number;
    }[]>(`
      SELECT 
        id_cuotas, 
        id_factura, 
        num_cuota, 
        importe_cuota, 
        recargo_cuota,
        fecha_vto,
        estado, 
        estado_pagado
      FROM Cuotas
      WHERE id_factura IN (${idFacturas})
    `);

    // 3. Obtener datos locales (Alumnos, Rubros, Servicios)
    const documentos = facturas.map(f => String(f.nrodoc)).filter(Boolean);
    const alumnos = await prisma.alumno.findMany({
      where: { documento: { in: documentos } }
    });

    const rubroIds = [...new Set(facturas.map(f => f.id_rubro))];
    const rubros = await prisma.rubro.findMany({
      where: { id: { in: rubroIds } }
    });

    const servicioIds = [...new Set(facturas.map(f => f.id_detallerubro))];
    const servicios = await prisma.servicio.findMany({
      where: { id: { in: servicioIds } }
    });

    // 4. Mapear y combinar todo
    const result: CuponeraLegacy[] = facturas.map(f => {
      const cuotas = cuotasRaw
        .filter(c => c.id_factura === f.id_factura)
        .map(c => ({
          ...c,
          estado_label: c.estado === 1 ? 'Anulada' : 'Activa',
          pagada_label: c.estado_pagado === 1 ? 'Pagada' : 'Pendiente'
        }));

      return {
        ...f,
        estado_label: f.estado === 1 ? 'Anulada' : 'Activa',
        cuotas,
        alumno: alumnos.find(a => a.documento === String(f.nrodoc)),
        rubro: rubros.find(r => r.id === f.id_rubro),
        servicio: servicios.find(s => s.id === f.id_detallerubro)
      };
    });

    return result;
  } catch (error) {
    console.error('Error al obtener cuponeras legacy:', error);
    throw new Error('No se pudieron obtener las cuponeras.');
  }
}
