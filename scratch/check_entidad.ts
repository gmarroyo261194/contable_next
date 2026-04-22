import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const entidades = await prisma.entidad.findMany({
    where: {
      cuit: {
        in: ['30707848851', '30640431373', '30714047740']
      }
    }
  });
  console.log("Entidades encontradas:", entidades);
}

main().catch(console.error).finally(() => prisma.$disconnect());
