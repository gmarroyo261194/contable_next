"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getModulos() {
  try {
    return await prisma.modulo.findMany({
      orderBy: { nombre: "asc" }
    });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return [];
  }
}

export async function isModuleEnabled(codigo: string) {
  try {
    const modulo = await prisma.modulo.findUnique({
      where: { codigo }
    });
    return modulo?.activo ?? true; // Default to true if not found for safety, or false depending on policy
  } catch (error) {
    console.error(`Error checking module ${codigo}:`, error);
    return true; 
  }
}

export async function toggleModulo(id: string, activo: boolean) {
  try {
    const updated = await prisma.modulo.update({
      where: { id },
      data: { activo }
    });
    revalidatePath("/");
    revalidatePath("/settings");
    return { success: true, modulo: updated };
  } catch (error) {
    console.error("Error toggling module:", error);
    return { error: "No se pudo actualizar el estado del módulo." };
  }
}
