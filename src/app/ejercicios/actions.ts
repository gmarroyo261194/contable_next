"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";

export async function getEjercicios() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) return [];

  return await prisma.ejercicio.findMany({
    where: {
      empresaId: parseInt(empresaId),
    },
    orderBy: {
      numero: "desc",
    },
  });
}

export async function createEjercicio(data: {
  numero: number;
  inicio: Date;
  fin: Date;
}) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  const ejercicio = await prisma.ejercicio.create({
    data: {
      numero: data.numero,
      inicio: data.inicio,
      fin: data.fin,
      empresaId: parseInt(empresaId),
      cerrado: false,
    },
  });

  await auditCreate("Ejercicio", ejercicio.id, ejercicio, session?.user?.email, parseInt(empresaId));

  revalidatePath("/ejercicios");
  return ejercicio;
}

export async function updateEjercicio(
  id: number,
  data: {
    numero: number;
    inicio: Date;
    fin: Date;
    cerrado: boolean;
  }
) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  // Validar que el ejercicio pertenece a la empresa activa de la sesión
  const ejercicioExistente = await prisma.ejercicio.findFirst({
    where: { id, empresaId: parseInt(empresaId) },
  });

  if (!ejercicioExistente) {
    throw new Error("No se puede modificar este ejercicio. No pertenece a la empresa activa.");
  }

  const ejercicio = await prisma.ejercicio.update({
    where: { id },
    data,
  });

  await auditUpdate("Ejercicio", id, ejercicioExistente, ejercicio, session?.user?.email, parseInt(empresaId));

  revalidatePath("/ejercicios");
  return ejercicio;
}

export async function deleteEjercicio(id: number) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  // Validar que el ejercicio pertenece a la empresa activa de la sesión
  const ejercicioExistente = await prisma.ejercicio.findFirst({
    where: { id, empresaId: parseInt(empresaId) },
  });

  if (!ejercicioExistente) {
    throw new Error("No se puede eliminar este ejercicio. No pertenece a la empresa activa.");
  }

  const asientoCount = await prisma.asiento.count({
    where: { ejercicioId: id },
  });

  if (asientoCount > 0) {
    throw new Error("No se puede eliminar un ejercicio que ya tiene asientos contables registrados.");
  }

  await auditDelete("Ejercicio", id, ejercicioExistente, session?.user?.email, parseInt(empresaId));

  await prisma.ejercicio.delete({
    where: { id },
  });
  revalidatePath("/ejercicios");
}

export async function toggleCerrarEjercicio(id: number, cerrado: boolean) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  // Validar que el ejercicio pertenece a la empresa activa de la sesión
  const ejercicioExistente = await prisma.ejercicio.findFirst({
    where: { id, empresaId: parseInt(empresaId) },
  });

  if (!ejercicioExistente) {
    throw new Error("No se puede modificar este ejercicio. No pertenece a la empresa activa.");
  }

  const ejercicio = await prisma.ejercicio.update({
    where: { id },
    data: { cerrado },
  });

  await auditUpdate("Ejercicio", id, ejercicioExistente, ejercicio, session?.user?.email, parseInt(empresaId));

  revalidatePath("/ejercicios");
}

export async function migrateAsientosLegacy(ejercicioId: number, anio: number) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const userEmail = session?.user?.email;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  // 1. Verificar si existen cuentas para este ejercicio
  const cuentaCount = await prisma.cuenta.count({
    where: { ejercicioId }
  });

  if (cuentaCount === 0) {
    throw new Error("No hay cuentas registradas en este ejercicio. Debe importar el plan de cuentas antes de migrar los asientos.");
  }

  // 2. Obtener la moneda de la empresa
  const empresa = await prisma.empresa.findUnique({
    where: { id: parseInt(empresaId) },
    select: { monedaId: true }
  });

  if (!empresa) throw new Error("Empresa no encontrada.");

  try {
    return await prisma.$transaction(async (tx) => {
      // 3. Obtener encabezados de la base vieja (incluyendo campos de anulación)
      const encabezados: any[] = await tx.$queryRawUnsafe(`
        SELECT AsientoID, AsientoNro, FechaAsiento, LeyendaGral, EsContraAsiento, AsientoOriginalNro
        FROM [ContableFundacion].[dbo].[AsientoEncabezado]
        WHERE Ejercicio = ${anio}
      `);

      if (encabezados.length === 0) {
        return { success: false, message: `No se encontraron asientos para el ejercicio ${anio} en la base de datos legacy.` };
      }

      // 3b. Obtener TODOS los detalles del ejercicio de una vez para evitar N+1
      const todosLosDetalles: any[] = await tx.$queryRawUnsafe(`
        SELECT AsientoID, CodigoLargo, LineaLeyenda, CuentaColumna, LineaImporte
        FROM [ContableFundacion].[dbo].[AsientoDetalle]
        WHERE Ejercicio = ${anio}
      `);

      // Agrupar detalles por AsientoID en memoria
      const detallesMap: Record<number, any[]> = todosLosDetalles.reduce((acc, d) => {
        if (!acc[d.AsientoID]) acc[d.AsientoID] = [];
        acc[d.AsientoID].push(d);
        return acc;
      }, {});

      // 3c. Pre-cargar cuentas del ejercicio actual para evitar consultas repetitivas
      const cuentasActuales = await tx.cuenta.findMany({
        where: { ejercicioId }
      });
      const cuentasMap = new Map(cuentasActuales.map(c => [c.codigo, c.id]));

      let migradosCount = 0;

      for (const ae of encabezados) {
        // Verificar si ya existe
        const existing = await tx.asiento.findFirst({
          where: { 
            numero: ae.AsientoNro,
            ejercicioId: ejercicioId
          }
        });

        if (existing) continue;

        // 4. Obtener detalles desde el mapa en memoria
        const detalles = detallesMap[ae.AsientoID] || [];

        // 5. Mapear renglones utilizando el mapa de cuentas pre-cargado
        const renglonesData = [];
        for (const ad of detalles) {
          const codigoLimpio = String(ad.CodigoLargo || "").replace(/\./g, '');
          if (!codigoLimpio) continue;

          const cuentaId = cuentasMap.get(codigoLimpio);

          if (!cuentaId) {
            throw new Error(`Cuenta ${ad.CodigoLargo} (limpia: ${codigoLimpio}) no encontrada en el sistema actual para el ejercicio ${anio}.`);
          }

          // Determinar columna (D = Debe, H/C = Haber)
          const esDebe = String(ad.CuentaColumna).trim().toUpperCase() === 'D' || String(ad.CuentaColumna).trim() === '1';
          
          renglonesData.push({
            debe: esDebe ? ad.LineaImporte : 0,
            haber: !esDebe ? ad.LineaImporte : 0,
            leyenda: ad.LineaLeyenda,
            cuentaId: cuentaId,
            monedaId: empresa.monedaId,
            cotizacion: 1.0,
            createdBy: userEmail
          });
        }

        // 6. Crear Asiento
        if (renglonesData.length > 0) {
          await tx.asiento.create({
            data: {
              numero: ae.AsientoNro,
              fecha: new Date(ae.FechaAsiento),
              descripcion: ae.LeyendaGral || 'Migración Legacy',
              ejercicioId: ejercicioId,
              createdBy: userEmail,
              renglones: {
                create: renglonesData
              }
            }
          });
          migradosCount++;
        }
      }

      // 7. Segunda pasada para vincular anulaciones (Contra Asientos)
      const contraAsientos = encabezados.filter(h => String(h.EsContraAsiento).trim().toUpperCase() === 'S');
      for (const ca of contraAsientos) {
        if (!ca.AsientoOriginalNro) continue;

        // Buscar el ID del asiento original en la nueva base
        const original = await tx.asiento.findFirst({
          where: {
            numero: ca.AsientoOriginalNro,
            ejercicioId: ejercicioId
          }
        });

        if (original) {
          // Actualizar el contra asiento con el vínculo
          await tx.asiento.updateMany({
            where: {
              numero: ca.AsientoNro,
              ejercicioId: ejercicioId,
              anulaAId: null // Solo si no está vinculado
            },
            data: {
              anulaAId: original.id
            }
          });
        }
      }

      revalidatePath("/asientos");
      return { success: true, count: migradosCount };
    }, {
      timeout: 300000 // 5 minutos para migraciones grandes
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    throw new Error(error.message || "Error durante la migración.");
  }
}
