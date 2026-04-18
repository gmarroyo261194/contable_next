const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const dbFacturacion = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_FACTURACION_URL
    }
  }
});

async function main() {
  try {
    console.log("=== Listado de Tablas ===");
    const tables = await dbFacturacion.$queryRawUnsafe('SELECT name FROM sys.tables ORDER BY name');
    console.log(tables.map(t => t.name).join(", "));

    // Tablas clave para facturación
    const targetTables = ['Comprobantes', 'Clientes', 'Rubros', 'Servicios', 'Pagos'];
    
    for (const tableName of targetTables) {
      const exists = tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
      if (exists) {
        const realName = exists.name;
        console.log(`\n=== Columnas de ${realName} ===`);
        const columns = await dbFacturacion.$queryRawUnsafe(
          `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${realName}'`
        );
        console.log(columns.map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE})`).join(", "));

        console.log(`\n=== Muestra de ${realName} (Top 2) ===`);
        const sample = await dbFacturacion.$queryRawUnsafe(`SELECT TOP 2 * FROM ${realName}`);
        console.log(JSON.stringify(sample, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
      }
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await dbFacturacion.$disconnect();
  }
}

main();
