"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// --- Users ---
export async function getUsers() {
  return await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: true
        }
      },
      empresas: {
        include: {
          empresa: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createUser(data: any) {
  const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
  
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      roles: {
        create: data.roleIds?.map((id: string) => ({
          roleId: id
        }))
      },
      empresas: data.empresaIds ? {
        create: data.empresaIds.map((empId: number) => ({
          empresaId: empId,
          role: "ADMIN"
        }))
      } : undefined
    }
  });
  revalidatePath("/settings/security");
  return user;
}

export async function updateUser(id: string, data: any) {
  const updateData: any = {
    name: data.name,
    email: data.email,
  };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  // Handle roles update (simple clear and recreate for speed)
  await prisma.userRole.deleteMany({ where: { userId: id } });

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      roles: {
        create: data.roleIds?.map((roleId: string) => ({
          roleId
        }))
      },
      empresas: data.empresaIds ? {
        deleteMany: {},
        create: data.empresaIds.map((empId: number) => ({
          empresaId: empId,
          role: "ADMIN" // Default role for now
        }))
      } : undefined
    }
  });
  revalidatePath("/settings/security");
  return user;
}

// --- Empresas & Assignments ---
export async function getEmpresas() {
  return await prisma.empresa.findMany({
    include: {
      usuarios: {
        include: {
          user: true
        }
      }
    },
    orderBy: { nombre: 'asc' }
  });
}

export async function assignUserToEmpresa(userId: string, empresaId: number, role: string = "USER") {
  const assignment = await prisma.empresaUsuario.upsert({
    where: {
      empresaId_userId: {
        empresaId,
        userId
      }
    },
    update: { role },
    create: {
      empresaId,
      userId,
      role
    }
  });
  revalidatePath("/settings/security");
  return assignment;
}

export async function unassignUserFromEmpresa(userId: string, empresaId: number) {
  await prisma.empresaUsuario.delete({
    where: {
      empresaId_userId: {
        empresaId,
        userId
      }
    }
  });
  revalidatePath("/settings/security");
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings/security");
}

// --- Roles ---
export async function getRoles() {
  return await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

export async function createRole(data: any) {
  const role = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      permissions: {
        create: data.permissionIds?.map((id: string) => ({
          permissionId: id
        }))
      }
    }
  });
  revalidatePath("/settings/security");
  return role;
}

export async function updateRole(id: string, data: any) {
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });
  
  const role = await prisma.role.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      permissions: {
        create: data.permissionIds?.map((id: string) => ({
          permissionId: id
        }))
      }
    }
  });
  revalidatePath("/settings/security");
  return role;
}

export async function deleteRole(id: string) {
  await prisma.role.delete({ where: { id } });
  revalidatePath("/settings/security");
}

// --- Permissions ---
export async function getPermissions() {
  return await prisma.permission.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createPermission(data: any) {
  const permission = await prisma.permission.create({
    data: {
      name: data.name,
      description: data.description,
    }
  });
  revalidatePath("/settings/security");
  return permission;
}

export async function updatePermission(id: string, data: any) {
  const permission = await prisma.permission.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
    }
  });
  revalidatePath("/settings/security");
  return permission;
}

export async function deletePermission(id: string) {
  await prisma.permission.delete({ where: { id } });
  revalidatePath("/settings/security");
}
