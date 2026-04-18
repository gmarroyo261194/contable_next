const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const dbFact = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_FACTURACION_URL } } });
const dbLocal = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function main() {
  try {
    console.log("=== External Estates ===");
    const states = await dbFact.$queryRawUnsafe('SELECT * FROM EstadosComprobantes');
    console.log(JSON.stringify(states, null, 2));

    console.log("\n=== Local TipoEntidad ===");
    const tipos = await dbLocal.$queryRawUnsafe('SELECT * FROM TipoEntidad');
    console.log(JSON.stringify(tipos, null, 2));

    console.log("\n=== External Clientes Sample ===");
    const clis = await dbFact.$queryRawUnsafe('SELECT TOP 1 * FROM Clientes');
    console.log(JSON.stringify(clis, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await dbFact.$disconnect();
    await dbLocal.$disconnect();
  }
}

main();
