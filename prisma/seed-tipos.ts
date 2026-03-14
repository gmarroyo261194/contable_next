import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TipoEntidad...');

  const tipos = [
    { nombre: 'CLIENTE' },
    { nombre: 'PROVEEDOR' },
    { nombre: 'AMBOS' },
  ];

  for (const t of tipos) {
    await prisma.tipoEntidad.upsert({
      where: { nombre: t.nombre },
      update: {},
      create: t,
    });
  }

  console.log('TipoEntidad seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
