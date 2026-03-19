import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding security models...');

  // 1. Create Permissions
  const permissions = [
    { name: 'asientos:view', description: 'Ver asientos contables' },
    { name: 'asientos:create', description: 'Crear nuevos asientos' },
    { name: 'config:edit', description: 'Editar configuración de empresa' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }

  // 2. Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrador con acceso total',
    },
  });

  // 3. Link All Permissions to Admin Role
  const allPermissions = await prisma.permission.findMany();
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: p.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: p.id,
      },
    });
  }

  // 4. Create Default Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@contablenext.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@contablenext.com',
      name: 'Admin ContableNext',
      password: hashedPassword,
    },
  });

  // 5. Assign Admin Role to User
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // 6. Create Default Currency and Company (Requested: Login must have a company)
  let moneda = await prisma.moneda.findUnique({ where: { codigo: 'ARS' } });
  if (!moneda) {
    moneda = await prisma.moneda.create({
      data: {
        codigo: 'ARS',
        nombre: 'Pesos Argentinos',
        simbolo: '$',
      },
    });
  }

  const defaultEmpresa = await prisma.empresa.upsert({
    where: { cuit: '00-00000000-0' },
    update: {},
    create: {
      nombre: 'Empresa Demo',
      cuit: '00-00000000-0',
      monedaId: moneda.id,
    },
  });

  // 7. Associate Admin with the Default Company
  await prisma.empresaUsuario.upsert({
    where: {
      empresaId_userId: {
        empresaId: defaultEmpresa.id,
        userId: adminUser.id,
      },
    },
    update: { role: 'ADMIN' },
    create: {
      empresaId: defaultEmpresa.id,
      userId: adminUser.id,
      role: 'ADMIN',
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Initial User: admin@contablenext.com / admin123');
  console.log('Initial Empresa: Empresa Demo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
