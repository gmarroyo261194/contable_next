"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      empresaId: formData.get("empresaId") as string,
      ejercicioId: formData.get("ejercicioId") as string,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Credenciales inválidas." };
        default:
          return { error: "Algo salió mal." };
      }
    }
    throw error;
  }
}

export async function register(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const companyName = formData.get("company") as string;
  const cuit = formData.get("cuit") as string;

  if (!name || !email || !password || !companyName || !cuit) {
    return { error: "Todos los campos son obligatorios." };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingUser = await (db as any).user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "El correo electrónico ya está registrado." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Get or create ARS currency
    let moneda = await db.moneda.findUnique({ where: { codigo: "ARS" } });
    if (!moneda) {
      moneda = await db.moneda.create({
        data: {
          codigo: "ARS",
          nombre: "Pesos Argentinos",
          simbolo: "$",
        }
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.$transaction(async (tx: any) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // 2. Create Empresa
      const empresa = await tx.empresa.create({
        data: {
          nombre: companyName,
          cuit: cuit,
          monedaId: moneda.id,
        },
      });

      // 3. Link User to Empresa
      await tx.empresaUsuario.create({
        data: {
          userId: user.id,
          empresaId: empresa.id,
          role: "ADMIN",
        },
      });

      // 4. Assign Global Role
      const adminRole = await tx.role.findUnique({ where: { name: "Admin" } });
      if (adminRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: adminRole.id,
          },
        });
      }
    });

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    
    return { success: true };
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Registration error:", error);
    return { error: "Error al procesar el registro. CUIT duplicado o error de base de datos." };
  }
}

export async function getLoginData(email: string) {
  if (!email) return null;

  const user = await db.user.findUnique({
    where: { email },
    include: {
      empresas: {
        include: {
          empresa: {
            include: {
              ejercicios: {
                where: { cerrado: false },
                orderBy: { numero: "desc" },
              },
            },
          },
        },
      },
    },
  }) as any;

  if (!user) return null;

  return user.empresas.map((ue: any) => ({
    id: ue.empresa.id,
    nombre: ue.empresa.nombre,
    ejercicios: ue.empresa.ejercicios.map((ej: any) => ({
      id: ej.id,
      numero: ej.numero,
    })),
  }));
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
