"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";
import { queryLegacy } from "@/lib/legacy-db";

export async function getEjercicios() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) return [];

  return await prisma.ejercicio.findMany({
    where: {
      empresaId: parseInt(empresaId),
    },
    include: {
      _count: {
        select: { asientos: true }
      }
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

/**
 * Cierra o reabre un ejercicio contable.
 *
 * Al CERRAR: transfiere automáticamente todos los documentos de proveedores
 * y facturas de docentes impagas como "exigibles" al próximo ejercicio.
 * Requiere que el próximo ejercicio (numero + 1) ya exista.
 *
 * Al REABRIR: solo marca el ejercicio como abierto. NO revierte los exigibles
 * ya transferidos (operación de solo avance).
 *
 * @param id ID del ejercicio a modificar
 * @param cerrado true = cerrar, false = reabrir
 * @returns Conteo de documentos transferidos como exigibles (al cerrar)
 */
export async function toggleCerrarEjercicio(id: number, cerrado: boolean) {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;
  const userEmail = session?.user?.email;

  if (!empresaId) throw new Error("No hay una empresa activa seleccionada.");

  // Validar que el ejercicio pertenece a la empresa activa de la sesión
  const ejercicioExistente = await prisma.ejercicio.findFirst({
    where: { id, empresaId: parseInt(empresaId) },
  });

  if (!ejercicioExistente) {
    throw new Error("No se puede modificar este ejercicio. No pertenece a la empresa activa.");
  }

  // ----- REAPERTURA (solo-avance, no revierte exigibles) -----
  if (!cerrado) {
    const ejercicio = await prisma.ejercicio.update({
      where: { id },
      data: { cerrado: false, updatedBy: userEmail },
    });
    await auditUpdate("Ejercicio", id, ejercicioExistente, ejercicio, userEmail, parseInt(empresaId));
    revalidatePath("/ejercicios");
    return { docProvTransferidos: 0, facturasTransferidas: 0 };
  }

  // ----- CIERRE: pasaje de exigibles -----

  // 1. Verificar que existe el próximo ejercicio
  const proximoEjercicio = await prisma.ejercicio.findFirst({
    where: {
      empresaId: parseInt(empresaId),
      numero: ejercicioExistente.numero + 1,
    },
  });

  if (!proximoEjercicio) {
    throw new Error(
      `No se puede cerrar el ejercicio ${ejercicioExistente.numero}. ` +
      `Debe crear primero el ejercicio ${ejercicioExistente.numero + 1} antes de cerrar este.`
    );
  }

  return await prisma.$transaction(async (tx) => {
    // 2. Transferir DocumentoProveedores impagas como exigibles al próximo ejercicio.
    //    Incluye: docs normales impagas de este ejercicio + docs que ya eran exigibles
    //    de un ejercicio anterior y siguen sin pagar en este.
    const docProvImpagas = await tx.documentoProveedores.findMany({
      where: {
        empresaId: parseInt(empresaId),
        pagado: false,
        anulado: false,
        OR: [
          // Docs normales de este ejercicio, nunca transferidos
          { ejercicioId: id, ejercicioExigibleId: null },
          // Docs ya exigibles que llegaron a este ejercicio y siguen impagas
          { ejercicioExigibleId: id },
        ],
      },
      select: { id: true, ejercicioOrigenId: true, ejercicioId: true },
    });

    if (docProvImpagas.length > 0) {
      for (const doc of docProvImpagas) {
        await tx.documentoProveedores.update({
          where: { id: doc.id },
          data: {
            ejercicioExigibleId: proximoEjercicio.id,
            // Si aun no tiene origen registrado, lo seteamos ahora
            ejercicioOrigenId: doc.ejercicioOrigenId ?? doc.ejercicioId,
            updatedBy: userEmail,
          },
        });
      }
    }

    // 3. Transferir FacturasDocente impagas como exigibles al próximo ejercicio.
    const facturasImpagas = await tx.facturaDocente.findMany({
      where: {
        empresaId: parseInt(empresaId),
        asientoPagoId: null,
        gestionPagoId: null,
        OR: [
          // Facturas normales de este ejercicio, nunca transferidas
          { ejercicioId: id, ejercicioExigibleId: null },
          // Facturas ya exigibles que llegaron a este ejercicio y siguen impagas
          { ejercicioExigibleId: id },
        ],
      },
      select: { id: true },
    });

    if (facturasImpagas.length > 0) {
      await tx.facturaDocente.updateMany({
        where: { id: { in: facturasImpagas.map((f) => f.id) } },
        data: {
          ejercicioExigibleId: proximoEjercicio.id,
          updatedBy: userEmail,
        },
      });
    }

    // 4. Cerrar el ejercicio
    const ejercicioCerrado = await tx.ejercicio.update({
      where: { id },
      data: { cerrado: true, updatedBy: userEmail },
    });

    await auditUpdate(
      "Ejercicio",
      id,
      ejercicioExistente,
      ejercicioCerrado,
      userEmail,
      parseInt(empresaId)
    );

    revalidatePath("/ejercicios");
    revalidatePath("/docprov");
    revalidatePath("/facturas-docentes");

    return {
      docProvTransferidos: docProvImpagas.length,
      facturasTransferidas: facturasImpagas.length,
    };
  });
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
      const encabezados = await queryLegacy(`
        SELECT AsientoID, AsientoNro, FechaAsiento, LeyendaGral, EsContraAsiento, AsientoOriginalNro
        FROM [ContableFundacion].[dbo].[AsientoEncabezado]
        WHERE Ejercicio = ${anio}
      `);

      if (encabezados.length === 0) {
        return { success: false, message: `No se encontraron asientos para el ejercicio ${anio} en la base de datos legacy.` };
      }

      // 3b. Obtener TODOS los detalles del ejercicio de una vez para evitar N+1
      const todosLosDetalles = await queryLegacy(`
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
