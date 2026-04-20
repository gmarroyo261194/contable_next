import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tipos = ["CLIENTE", "PROVEEDOR", "DOCENTE"];
  for (const nombre of tipos) {
    const existe = await prisma.tipoEntidad.findUnique({ where: { nombre } });
    if (!existe) {
      const created = await prisma.tipoEntidad.create({ data: { nombre } });
      console.log(`Creado TipoEntidad: ${nombre} (ID: ${created.id})`);
    } else {
      console.log(`TipoEntidad ya existe: ${nombre} (ID: ${existe.id})`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
