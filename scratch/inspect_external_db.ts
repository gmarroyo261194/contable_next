import dbFacturacion from './src/lib/dbFacturacion';

async function main() {
  try {
    console.log("=== Tables ===");
    const tables = await dbFacturacion.$queryRaw<any[]>`SELECT name FROM sys.tables ORDER BY name`;
    console.log(tables.map(t => t.name).join(", "));

    // Si encontramos tablas probables, las inspeccionamos
    const probableTables = ['Comprobantes', 'Facturas', 'Clientes', 'Pagos', 'Ventas'];
    for (const table of probableTables) {
      if (tables.some(t => t.name.toLowerCase() === table.toLowerCase())) {
        console.log(`\n=== Columns of ${table} ===`);
        const columns = await dbFacturacion.$queryRawUnsafe<any[]>(
          `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`
        );
        console.log(columns.map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE})`).join(", "));
        
        // Ver una muestra de datos (activos o recientes si es posible)
        console.log(`\n=== Sample Top 3 of ${table} ===`);
        const sample = await dbFacturacion.$queryRawUnsafe<any[]>(`SELECT TOP 3 * FROM ${table}`);
        console.log(JSON.stringify(sample, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
      }
    }
  } catch (error) {
    console.error("Error query:", error);
  } finally {
    await dbFacturacion.$disconnect();
  }
}

main();
