import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.documentoClientes.findMany({
    include: { entidad: true }
  });
  console.log('Documentos Clientes en DB:', docs.length);
  if (docs.length > 0) {
    console.log('Último documento:', {
      id: docs[0].id,
      numero: docs[0].numero,
      ejercicioId: docs[0].ejercicioId,
      empresaId: docs[0].empresaId
    });
  }
  
  const ejercicios = await prisma.ejercicio.findMany();
  console.log('Ejercicios en DB:', ejercicios.map(e => ({ id: e.id, numero: e.numero })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
