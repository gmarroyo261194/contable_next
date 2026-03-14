import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding currencies...');

  const monedas = [
    { codigo: 'ARS', nombre: 'Pesos Argentinos', simbolo: '$' },
    { codigo: 'USD', nombre: 'Dólares Estadounidenses', simbolo: 'u$s' },
  ];

  for (const m of monedas) {
    await prisma.moneda.upsert({
      where: { codigo: m.codigo },
      update: {},
      create: m,
    });
  }

  console.log('Currencies seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
