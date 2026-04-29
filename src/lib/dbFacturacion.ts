import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma secundario apuntando a la base de datos PagosFundacion.
 * Se utiliza exclusivamente en modo LECTURA para sincronización de Rubros y Servicios.
 * Las queries se ejecutan con $queryRaw para evitar conflictos de schema.
 */
const globalForFacturacion = global as unknown as { 
  prismaFact: PrismaClient;
  prismaLegacyFact: PrismaClient;
};

export const dbFacturacion = globalForFacturacion.prismaFact || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_FACTURACION_URL
    }
  }
});

export const dbLegacyFacturacion = globalForFacturacion.prismaLegacyFact || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_LEGACY_FACTURACION_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForFacturacion.prismaFact = dbFacturacion;
  globalForFacturacion.prismaLegacyFact = dbLegacyFacturacion;
}

export default dbFacturacion;
