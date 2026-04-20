"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function completeInitialSetup(data: {
  empresa: {
    nombre: string;
    cuit: string;
  };
  ejercicio: {
    anio: number;
    inicio: Date;
    fin: Date;
  };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado. Inicie sesión nuevamente." };
  }

  const userId = session.user.id;

  try {
    return await db.$transaction(async (tx: any) => {
      // 0. Asegurar tipos de entidad básicos
      const tiposEstandar = ["CLIENTE", "PROVEEDOR", "DOCENTE"];
      for (const nombre of tiposEstandar) {
        const existe = await tx.tipoEntidad.findUnique({ where: { nombre } });
        if (!existe) {
          await tx.tipoEntidad.create({ data: { nombre } });
        }
      }

      // 1. Obtener o crear moneda ARS (por defecto para el setup)
      let moneda = await tx.moneda.findUnique({ where: { codigo: "ARS" } });
      if (!moneda) {
        moneda = await tx.moneda.create({
          data: {
            codigo: "ARS",
            nombre: "Pesos Argentinos",
            simbolo: "$",
          },
        });
      }

      // 2. Crear la Empresa
      const empresa = await tx.empresa.create({
        data: {
          nombre: data.empresa.nombre,
          cuit: data.empresa.cuit,
          monedaId: moneda.id,
        },
      });

      // 3. Vincular al usuario actual como ADMIN
      await tx.empresaUsuario.create({
        data: {
          userId: userId,
          empresaId: empresa.id,
          role: "ADMIN",
        },
      });

      // 4. Crear usuario ADMIN por defecto (si no existe)
      const adminEmail = "admin@contable.com";
      let adminUser = await tx.user.findUnique({ where: { email: adminEmail } });
      
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash("261194", 10);
        adminUser = await tx.user.create({
          data: {
            name: "Administrador Sistema",
            email: adminEmail,
            password: hashedPassword,
          },
        });

        // Asignar rol global de Admin al nuevo usuario
        const adminRole = await tx.role.findUnique({ where: { name: "Admin" } });
        if (adminRole) {
          await tx.userRole.create({
            data: {
              userId: adminUser.id,
              roleId: adminRole.id,
            },
          });
        }
      }

      // Vincular al usuario admin por defecto con la nueva empresa
      await tx.empresaUsuario.upsert({
        where: {
          userId_empresaId: {
            userId: adminUser.id,
            empresaId: empresa.id,
          },
        },
        update: { role: "ADMIN" },
        create: {
          userId: adminUser.id,
          empresaId: empresa.id,
          role: "ADMIN",
        },
      });

      // 5. Crear el primer Ejercicio
      const ejercicio = await tx.ejercicio.create({
        data: {
          numero: data.ejercicio.anio,
          inicio: data.ejercicio.inicio,
          fin: data.ejercicio.fin,
          empresaId: empresa.id,
          cerrado: false,
        },
      });

      return { 
        success: true, 
        empresaId: empresa.id, 
        ejercicioId: ejercicio.id 
      };
    });
  } catch (error: any) {
    console.error("Setup error:", error);
    return { 
      success: false, 
      error: error.message || "Error inesperado durante la configuración inicial." 
    };
  }
}
