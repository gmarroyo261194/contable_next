"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

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

export async function authorizeFacturaDocente(id: number, fechaHabilitacionPago: string) {
  const session = await auth();
  const userIdentity = session?.user?.email || session?.user?.name || "Usuario Desconocido";

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
  try {
    const factura = await db.facturaDocente.findUnique({
      where: { id },
      select: { asientoPagoId: true }
    });

    if (factura?.asientoPagoId) {
      return { error: "No se puede eliminar una factura que ya ha sido pagada." };
    }

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
