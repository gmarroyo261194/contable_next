import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tipos = await prisma.tipoEntidad.findMany();
  console.log('Tipos de Entidad:', tipos);
  
  const empresas = await prisma.empresa.findMany();
  console.log('Empresas:', empresas.map(e => ({ id: e.id, nombre: e.nombre })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
