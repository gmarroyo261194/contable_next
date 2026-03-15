import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.asiento.count()
  console.log(`Total asientos: ${count}`)
  const nullAnula = await prisma.asiento.findMany({
      select: { id: true, numero: true }
  })
  console.log(nullAnula)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
