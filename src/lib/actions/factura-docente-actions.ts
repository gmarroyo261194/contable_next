"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit/auditLogger";
import { parseFacturaPDF } from "@/lib/facturas/facturaParser";

export async function getFacturasDocentes() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) return [];

  const facturas = await db.facturaDocente.findMany({
    where: {
      empresaId: parseInt(empresaId),
    },
    include: {
      entidad: true,
      cuentaGastos: true,
      asientoPago: true,
      gestionPago: {
        include: {
          medioPago: {
            include: {
              cuenta: true
            }
          }
        }
      }
    },
    orderBy: {
      fecha: "desc",
    },
  });

  return JSON.parse(JSON.stringify(facturas));
}

export async function getDocentes() {
  const session = await auth();
  const empresaId = (session?.user as any)?.empresaId;

  if (!empresaId) return [];

  return await db.entidad.findMany({
    where: {
      empresaId: parseInt(empresaId),
      tipo: {
        nombre: 'DOCENTE'
      }
    },
    orderBy: {
      nombre: "asc",
    },
  });
}

export async function createFacturaDocente(data: {
  entidadId: number;
  puntoVenta: string;
  numero: string;
  fecha: string;
  importe: number;
  anioHonorarios: number;
  mesHonorarios: number;
  cuentaGastosId: number;
  observaciones?: string;
}) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const userEmail = session?.user?.email;

  if (!empresaId) {
    return { error: "No hay una empresa activa seleccionada." };
  }

  if (data.importe <= 0) {
    return { error: "El importe debe ser mayor a cero." };
  }

  // Padding
  const pvPadding = data.puntoVenta.padStart(5, '0');
  const numPadding = data.numero.padStart(8, '0');

  try {
    // Check uniqueness manually before creation for user-friendly error
    const existing = await db.facturaDocente.findFirst({
      where: {
        entidadId: data.entidadId,
        puntoVenta: pvPadding,
        numero: numPadding,
      }
    });

    if (existing) {
      return { error: `La factura ${pvPadding}-${numPadding} ya existe para este docente.` };
    }

    const factura = await db.facturaDocente.create({
      data: {
        entidadId: data.entidadId,
        puntoVenta: pvPadding,
        numero: numPadding,
        fecha: new Date(data.fecha),
        importe: data.importe,
        anioHonorarios: data.anioHonorarios,
        mesHonorarios: data.mesHonorarios,
        cuentaGastosId: data.cuentaGastosId,
        observaciones: data.observaciones,
        empresaId: empresaId,
        createdBy: userEmail,
      },
    });

    await auditCreate("FacturaDocente", factura.id, factura, userEmail, empresaId);

    revalidatePath("/facturas-docentes");
    return { success: true, data: JSON.parse(JSON.stringify(factura)) };
  } catch (error: any) {
    console.error("Error al crear factura de docente:", error);
    if (error.code === 'P2002') {
      return { error: "Ya existe una factura con este número para el docente seleccionado." };
    }
    return { error: "Hubo un error al guardar la factura." };
  }
}

export async function updateFacturaDocente(id: number, data: {
  entidadId: number;
  puntoVenta: string;
  numero: string;
  fecha: string;
  importe: number;
  anioHonorarios: number;
  mesHonorarios: number;
  cuentaGastosId: number;
  observaciones?: string;
}) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const userEmail = session?.user?.email;

  if (!empresaId) return { error: "No hay una empresa activa seleccionada." };

  // Validar que la factura pertenece a la empresa activa de la sesión
  const facturaExistente = await db.facturaDocente.findFirst({
    where: { id, empresaId },
  });

  if (!facturaExistente) return { error: "No se puede modificar esta factura. No pertenece a la empresa activa." };

  try {
    const original = await db.facturaDocente.findUnique({
      where: { id },
      include: { asientoPago: true }
    });

    if (!original) return { error: "Factura no encontrada." };

    // Check if paid and trying to change amount
    if (original.asientoPagoId && original.importe.toNumber() !== data.importe) {
      return { error: "No se puede modificar el importe de una factura que ya ha sido pagada." };
    }

    // Update the invoice
    const updated = await db.facturaDocente.update({
      where: { id },
      data: {
        entidadId: data.entidadId,
        puntoVenta: data.puntoVenta.padStart(5, '0'),
        numero: data.numero.padStart(8, '0'),
        fecha: new Date(data.fecha),
        importe: data.importe,
        anioHonorarios: data.anioHonorarios,
        mesHonorarios: data.mesHonorarios,
        cuentaGastosId: data.cuentaGastosId,
        observaciones: data.observaciones,
        updatedBy: userEmail,
      },
    });

    // logic: If paid and account changed, update Asiento Renglones
    if (original.asientoPagoId && original.cuentaGastosId !== data.cuentaGastosId) {
      await db.renglonAsiento.updateMany({
        where: {
          asientoId: original.asientoPagoId,
          cuentaId: original.cuentaGastosId
        },
        data: {
          cuentaId: data.cuentaGastosId
        }
      });
    }

    revalidatePath("/facturas-docentes");
    const updatedResult = JSON.parse(JSON.stringify(updated));

    await auditUpdate("FacturaDocente", id, original, updatedResult, userEmail, empresaId);

    return { success: true, data: updatedResult };
  } catch (error: any) {
    console.error("Error al actualizar factura de docente:", error);
    return { error: "Hubo un error al actualizar la factura." };
  }
}

export async function authorizeFacturaDocente(id: number, fechaHabilitacionPago: string) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);
  const userIdentity = session?.user?.email || session?.user?.name || "Usuario Desconocido";

  if (!empresaId) return { error: "No hay una empresa activa seleccionada." };

  // Validar que la factura pertenece a la empresa activa de la sesión
  const facturaExistente = await db.facturaDocente.findFirst({
    where: { id, empresaId },
  });

  if (!facturaExistente) return { error: "No se puede autorizar esta factura. No pertenece a la empresa activa." };

  try {
    const factura = await db.facturaDocente.update({
      where: { id },
      data: {
        estado: "Autorizado",
        fechaAutorizado: new Date(),
        usuarioAutorizado: userIdentity,
        fechaHabilitacionPago: new Date(fechaHabilitacionPago),
      },
    });

    revalidatePath("/facturas-docentes");
    return { success: true, data: JSON.parse(JSON.stringify(factura)) };
  } catch (error) {
    console.error("Error al autorizar factura de docente:", error);
    return { error: "Error al autorizar la factura." };
  }
}

export async function unauthorizeFacturaDocente(id: number) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);

  if (!empresaId) return { error: "No hay una empresa activa seleccionada." };

  // Validar que la factura pertenece a la empresa activa de la sesión
  const facturaExistente = await db.facturaDocente.findFirst({
    where: { id, empresaId },
  });

  if (!facturaExistente) return { error: "No se puede modificar esta factura. No pertenece a la empresa activa." };

  try {
    await db.facturaDocente.update({
      where: { id },
      data: {
        estado: "Autorizacion Pendiente",
        fechaAutorizado: null,
        usuarioAutorizado: null,
        fechaHabilitacionPago: null,
      },
    });

    revalidatePath("/facturas-docentes");
    return { success: true };
  } catch (error) {
    console.error("Error al quitar autorización:", error);
    return { error: "No se pudo quitar la autorización." };
  }
}

export async function deleteFacturaDocente(id: number) {
  const session = await auth();
  const empresaId = parseInt((session?.user as any)?.empresaId);

  if (!empresaId) return { error: "No hay una empresa activa seleccionada." };

  // Validar que la factura pertenece a la empresa activa de la sesión
  const facturaExistente = await db.facturaDocente.findFirst({
    where: { id, empresaId },
  });

  if (!facturaExistente) return { error: "No se puede eliminar esta factura. No pertenece a la empresa activa." };

  try {
    const factura = await db.facturaDocente.findUnique({
      where: { id },
      select: { asientoPagoId: true }
    });

    if (factura?.asientoPagoId) {
      return { error: "No se puede eliminar una factura que ya ha sido pagada." };
    }

    await auditDelete("FacturaDocente", id, factura, session?.user?.email, empresaId);

    await db.facturaDocente.delete({
      where: { id },
    });
    revalidatePath("/facturas-docentes");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar factura de docente:", error);
    return { error: "Error al eliminar el registro." };
  }
}

export async function parseFacturaDocentePDF(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado." };

  const file = formData.get("file") as File;
  if (!file) return { error: "No se ha proporcionado ningún archivo." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedData = await parseFacturaPDF(buffer);

    // Intentar buscar al docente por CUIT
    const docente = await db.entidad.findFirst({
      where: {
        cuit: {
          contains: extractedData.cuitEmisor
        },
        tipo: { nombre: 'DOCENTE' }
      }
    });

    return {
      success: true,
      data: extractedData,
      docente: docente ? JSON.parse(JSON.stringify(docente)) : null
    };
  } catch (error: any) {
    console.error("Error al procesar PDF:", error);
    return { error: error.message || "Error al procesar el archivo PDF." };
  }
}

export async function getLastCuentaGastosForDocente(entidadId: number) {
  const session = await auth();
  if (!session) return null;

  try {
    const lastInvoice = await db.facturaDocente.findFirst({
      where: { entidadId },
      orderBy: { fecha: 'desc' },
      include: { cuentaGastos: true }
    });

    return lastInvoice?.cuentaGastos ? JSON.parse(JSON.stringify(lastInvoice.cuentaGastos)) : null;
  } catch (error) {
    console.error("Error al obtener última cuenta de gastos:", error);
    return null;
  }
}
