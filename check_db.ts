
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const empresas = await prisma.empresa.findMany();
  console.log('Empresas:', empresas.map(e => ({ id: e.id, nombre: e.nombre })));

  const ejercicios = await prisma.ejercicio.findMany();
  console.log('Ejercicios:', ejercicios.map(e => ({ id: e.id, numero: e.numero, empresaId: e.empresaId })));

  const cuentas = await prisma.cuenta.findMany({ take: 5 });
  console.log('Cuentas (first 5):', cuentas.map(c => ({ id: c.id, codigo: c.codigo, empresaId: c.empresaId, ejercicioId: c.ejercicioId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
