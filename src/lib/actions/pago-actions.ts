"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getMediosPago() {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);

  if (!empresaId) return [];

  // Seed default if not exists
  const count = await db.medioPago.count({ where: { empresaId } });
  if (count === 0) {
    await db.medioPago.create({
      data: {
        nombre: "Transferencia",
        empresaId,
      }
    });
  }

  return await db.medioPago.findMany({
    where: { empresaId },
    include: { cuenta: true },
    orderBy: { nombre: "asc" }
  });
}

export async function updateMedioPagoAccount(id: number, cuentaId: number | null) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    await db.medioPago.update({
      where: { id },
      data: {
        cuentaId,
        updatedBy: userEmail
      }
    });

    revalidatePath("/facturas-docentes");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar medio de pago:", error);
    return { error: "No se pudo actualizar la cuenta del medio de pago." };
  }
}

export async function processPaymentDocente(ids: number[], data: {
  fecha: string;
  medioPagoId: number;
  observaciones?: string;
}) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const ejercicioId = parseInt((session?.user as any)?.ejercicioId);
  const userEmail = session?.user?.email;

  if (!empresaId || !ejercicioId) {
    return { error: "Faltan datos de sesión (empresa o ejercicio)." };
  }

  try {
    return await db.$transaction(async (tx) => {
      // 1. Validar facturas
      const facturas = await tx.facturaDocente.findMany({
        where: { id: { in: ids } },
        include: { entidad: true }
      });

      if (facturas.length === 0) throw new Error("No se encontraron parcelas para pagar.");

      // Validar misma entidad
      const entidadId = facturas[0].entidadId;
      if (facturas.some(f => f.entidadId !== entidadId)) {
        throw new Error("Todas las facturas deben pertenecer al mismo docente.");
      }

      // Validar estado y fecha de habilitación
      const paymentDate = new Date(data.fecha);
      for (const f of facturas) {
        if (f.estado !== "Autorizado") {
          throw new Error(`La factura ${f.puntoVenta}-${f.numero} no está autorizada.`);
        }
        if (f.fechaHabilitacionPago && paymentDate < f.fechaHabilitacionPago) {
          throw new Error(`La fecha de pago (${data.fecha}) es anterior a la fecha de habilitación de la factura ${f.puntoVenta}-${f.numero}.`);
        }
      }

      // 2. Obtener cuenta del medio de pago
      const medio = await tx.medioPago.findUnique({
        where: { id: data.medioPagoId },
        include: { cuenta: true }
      });

      if (!medio?.cuentaId) {
        throw new Error("El medio de pago no tiene una cuenta contable asociada.");
      }

      // 3. Crear Asiento
      const total = facturas.reduce((sum, f) => sum + Number(f.importe), 0);
      
      // Agrupar facturas por cuenta de gastos para consolidar renglones en el asiento
      const groupedByAccount = facturas.reduce((acc, f) => {
        const cuentaId = f.cuentaGastosId;
        if (!acc[cuentaId]) {
          acc[cuentaId] = {
            cuentaId,
            importe: 0,
            facturaNumeros: []
          };
        }
        acc[cuentaId].importe += Number(f.importe);
        acc[cuentaId].facturaNumeros.push(`${f.puntoVenta}-${f.numero}`);
        return acc;
      }, {} as Record<number, { cuentaId: number, importe: number, facturaNumeros: string[] }>);

      const lastAsiento = await tx.asiento.findFirst({
        where: { ejercicioId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });
      const nextNumero = (lastAsiento?.numero ?? 0) + 1;

      const asiento = await tx.asiento.create({
        data: {
          numero: nextNumero,
          fecha: paymentDate,
          descripcion: `Honorarios Docente - ${facturas[0].entidad.nombre}`,
          ejercicioId,
          createdBy: userEmail,
          renglones: {
            create: [
              // Debe: Gastos (Agrupados por cuenta)
              ...Object.values(groupedByAccount).map(group => ({
                cuentaId: group.cuentaId,
                debe: group.importe,
                haber: 0,
                leyenda: `Facturas: ${group.facturaNumeros.join(", ")}`,
                monedaId: (session?.user as any)?.monedaId || 1, 
                cotizacion: 1.0,
                createdBy: userEmail,
              })),
              // Haber: Cuenta Pagadora (total)
              {
                cuentaId: medio.cuentaId,
                debe: 0,
                haber: total,
                leyenda: `Pago ${medio.nombre}`,
                monedaId: (session?.user as any)?.monedaId || 1,
                cotizacion: 1.0,
                createdBy: userEmail,
              }
            ]
          }
        }
      });

      // 4. Crear GestionPago
      const gestionPago = await tx.gestionPago.create({
        data: {
          fecha: paymentDate,
          importeTotal: total,
          entidadId,
          asientoId: asiento.id,
          medioPagoId: data.medioPagoId,
          observaciones: data.observaciones,
          empresaId,
          ejercicioId,
          createdBy: userEmail,
        }
      });

      // 5. Actualizar Facturas
      await tx.facturaDocente.updateMany({
        where: { id: { in: ids } },
        data: {
          estado: "Pagado",
          asientoPagoId: asiento.id,
          gestionPagoId: gestionPago.id,
          updatedBy: userEmail
        }
      });

      return { success: true, pagoId: gestionPago.id };
    });
  } catch (error: any) {
    console.error("Error al procesar pago:", error);
    return { error: error.message || "Error al procesar el pago." };
  }
}

export async function getPagosHistory() {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);

  if (!empresaId) return [];

  const pagos = await db.gestionPago.findMany({
    where: { empresaId },
    include: {
      entidad: true,
      medioPago: true,
      asiento: true,
      facturasDocentes: true
    },
    orderBy: { fecha: "desc" }
  });

  return JSON.parse(JSON.stringify(pagos));
}

export async function anularPago(pagoId: number) {
  const session = await auth();
  const ejercicioId = parseInt((session?.user as any)?.ejercicioId);
  const userEmail = session?.user?.email;

  if (!ejercicioId) return { error: "No hay sesión activa." };

  try {
    return await db.$transaction(async (tx) => {
      // 1. Obtener el pago
      const pago = await tx.gestionPago.findUnique({
        where: { id: pagoId },
        include: {
          asiento: { include: { renglones: true } },
          facturasDocentes: true
        }
      });

      if (!pago) throw new Error("Pago no encontrado.");
      if (pago.anulado) throw new Error("El pago ya está anulado.");

      // 2. Crear Contra-Asiento (con la misma fecha del original)
      const lastAsiento = await tx.asiento.findFirst({
        where: { ejercicioId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });
      const nextNumero = (lastAsiento?.numero ?? 0) + 1;

      const contraAsiento = await tx.asiento.create({
        data: {
          numero: nextNumero,
          fecha: pago.asiento.fecha, // MISMA FECHA ORIGINAL
          descripcion: `ANULACION PAGO ID ${pago.id}: ${pago.asiento.descripcion}`,
          ejercicioId,
          createdBy: userEmail,
          anulaAId: pago.asientoId,
          renglones: {
            create: pago.asiento.renglones.map(r => ({
              cuentaId: r.cuentaId,
              debe: r.haber, // INVERTIDO
              haber: r.debe, // INVERTIDO
              leyenda: `Anulación Pago ${pago.id}`,
              monedaId: r.monedaId,
              cotizacion: Number(r.cotizacion),
              createdBy: userEmail,
            }))
          }
        }
      });

      // 3. Marcar pago como anulado
      await tx.gestionPago.update({
        where: { id: pagoId },
        data: {
          anulado: true,
          fechaAnulacion: new Date(),
          asientoAnulacionId: contraAsiento.id,
          updatedBy: userEmail
        }
      });

      // 4. Revertir facturas a "Autorizado"
      await tx.facturaDocente.updateMany({
        where: { gestionPagoId: pagoId },
        data: {
          estado: "Autorizado",
          asientoPagoId: null,
          gestionPagoId: null,
          updatedBy: userEmail
        }
      });

      return { success: true };
    });
  } catch (error: any) {
    console.error("Error al anular pago:", error);
    return { error: error.message || "Error al anular el pago." };
  }
}
