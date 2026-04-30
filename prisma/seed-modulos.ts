import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const modulos = [
    {
      nombre: "Contabilidad",
      codigo: "CONTABILIDAD",
      activo: true,
      descripcion: "Gestión de asientos contables, plan de cuentas y reportes financieros."
    },
    {
      nombre: "Honorarios Docentes",
      codigo: "HONORARIOS",
      activo: true,
      descripcion: "Gestión de honorarios y facturación de docentes."
    },
    {
      nombre: "Clientes y Proveedores",
      codigo: "ENTIDADES",
      activo: true,
      descripcion: "Gestión de entidades, documentos de proveedores y facturación a clientes."
    },
    {
      nombre: "Cursos y Cuponeras",
      codigo: "CURSOS",
      activo: true,
      descripcion: "Administración de alumnos, cursos y seguimiento de cuponeras."
    }
  ]

  console.log('Iniciando semilla de módulos...')

  for (const m of modulos) {
    await prisma.modulo.upsert({
      where: { codigo: m.codigo },
      update: {},
      create: m,
    })
    console.log(`Módulo ${m.nombre} creado/actualizado.`)
  }

  console.log('Semilla completada.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
