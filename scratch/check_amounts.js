const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const dbFact = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_FACTURACION_URL } } });

async function main() {
  try {
    console.log("=== ItemsComprobantes Columns ===");
    const cols = await dbFact.$queryRawUnsafe("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ItemsComprobantes'");
    console.log(JSON.stringify(cols, null, 2));

    console.log("\n=== ItemsComprobantes Sample ===");
    const sample = await dbFact.$queryRawUnsafe("SELECT TOP 2 * FROM ItemsComprobantes");
    console.log(JSON.stringify(sample, null, 2));
    
    console.log("\n=== Check if Comprobantes has amounts hidden ===");
    const compCols = await dbFact.$queryRawUnsafe("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Comprobantes'");
    console.log(compCols.map(c => c.COLUMN_NAME).join(", "));

  } catch (error) {
    console.error(error);
  } finally {
    await dbFact.$disconnect();
  }
}
main();
