import sql from "mssql";

/**
 * Parsea la variable de entorno LEGACY_CONTABLE_DB.
 * 
 * Soporta dos formatos:
 * 1. Solo nombre de base de datos: "ContableFundacion"
 *    → Reutiliza el servidor de DATABASE_URL inyectando el nombre de la base.
 * 2. URL completa de conexión: "sqlserver://host;database=X;user=u;password=p;..."
 *    → Parsea los parámetros y crea una conexión directa con mssql.
 * 
 * @returns Configuración de conexión para mssql.
 */
function parseLegacyConfig(): sql.config {
  const legacyConfig = process.env.LEGACY_CONTABLE_DB || "ContableFundacion";

  if (legacyConfig.startsWith("sqlserver://")) {
    // Parsear la URL estilo Prisma: sqlserver://host;param=value;...
    const withoutProtocol = legacyConfig.replace("sqlserver://", "");
    const parts = withoutProtocol.split(";").filter(Boolean);

    const params: Record<string, string> = {};
    let server = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes("=")) {
        const [key, ...rest] = part.split("=");
        params[key.toLowerCase()] = rest.join("=");
      } else if (i === 0) {
        // El primer segmento sin '=' es el host[:puerto]
        server = part;
      }
    }

    const [host, portStr] = server.split(",");
    const port = portStr ? parseInt(portStr) : 1433;

    return {
      server: host,
      port,
      database: params["database"],
      user: params["user"],
      password: params["password"],
      options: {
        trustServerCertificate: params["trustservercertificate"] === "true",
        encrypt: false,
        connectTimeout: 30000,
        requestTimeout: 60000,
      },
    };
  }

  // Caso: Solo nombre de base de datos (mismo servidor que DATABASE_URL)
  const mainUrl = process.env.DATABASE_URL || "";
  const withoutProtocol = mainUrl.replace("sqlserver://", "");
  const parts = withoutProtocol.split(";").filter(Boolean);

  const params: Record<string, string> = {};
  let server = "";
  let port = 1433;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes("=")) {
      const [key, ...rest] = part.split("=");
      params[key.toLowerCase()] = rest.join("=");
    } else if (i === 0) {
      const [host, portStr] = part.split(",");
      server = host;
      if (portStr) port = parseInt(portStr);
    }
  }

  return {
    server: server || "localhost",
    port,
    database: legacyConfig, // El nombre de la base legacy
    user: params["user"],
    password: params["password"],
    options: {
      trustServerCertificate: params["trustservercertificate"] === "true",
      encrypt: false,
      connectTimeout: 30000,
      requestTimeout: 60000,
    },
  };
}

/**
 * Ejecuta una consulta SQL raw en la base de datos legacy.
 * Crea una conexión directa con mssql y la cierra al finalizar.
 * 
 * @param query - La consulta SQL a ejecutar.
 * @returns Lista de registros del resultado.
 */
export async function queryLegacy(query: string): Promise<any[]> {
  const config = parseLegacyConfig();

  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);

    // Limpiar prefijos de base de datos tipo [ContableFundacion].[dbo].[Tabla]
    // ya que la conexión ya apunta directamente a esa base.
    const cleanedQuery = query.replace(/\[?ContableFundacion\]?\.\[?dbo\]?\./gi, "dbo.");

    const result = await pool.request().query(cleanedQuery);
    return result.recordset;
  } finally {
    if (pool) await pool.close();
  }
}
