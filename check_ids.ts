
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const empresaId = 2;
  const ejercicioId = 4;

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  const ejercicio = await prisma.ejercicio.findUnique({ where: { id: ejercicioId } });

  console.log('--- DIAGNOSTICO ---');
  console.log('Empresa (ID: 2):', empresa ? 'EXISTE - ' + empresa.nombre : 'NO EXISTE');
  console.log('Ejercicio (ID: 4):', ejercicio ? 'EXISTE - Numero: ' + ejercicio.numero : 'NO EXISTE');
  
  if (ejercicio) {
    console.log('Ejercicio.empresaId:', ejercicio.empresaId);
    console.log('¿Coincide empresaId?', ejercicio.empresaId === empresaId ? 'SI' : 'NO');
  }

  const allEmpresas = await prisma.empresa.findMany();
  console.log('Todas las empresas:', allEmpresas.map(e => ({ id: e.id, nombre: e.nombre })));

  const allEjercicios = await prisma.ejercicio.findMany();
  console.log('Todos los ejercicios:', allEjercicios.map(ej => ({ id: ej.id, numero: ej.numero, empresaId: ej.empresaId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
