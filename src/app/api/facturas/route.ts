// src/app/api/facturas/route.ts
// GET /api/facturas?page=1&pageSize=20&search=...&desde=...&hasta=...

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/facturas/facturaService';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20'));
  const search   = searchParams.get('search') ?? '';
  const desde    = searchParams.get('desde');
  const hasta    = searchParams.get('hasta');

  const where: Prisma.FacturaWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { razonSocialEmisor:   { contains: search } },
              { cuitEmisor:          { contains: search } },
              { numeroComprobante:   { contains: search } },
              { razonSocialReceptor: { contains: search } },
              { caeNumero:           { contains: search } },
            ],
          }
        : {},
      desde ? { fechaEmision: { gte: new Date(desde) } } : {},
      hasta ? { fechaEmision: { lte: new Date(hasta) } } : {},
    ],
  };

  const [facturas, total] = await Promise.all([
    prisma.factura.findMany({
      where,
      orderBy: { procesadoEn: 'desc' },
      skip:  (page - 1) * pageSize,
      take:  pageSize,
      select: {
        id:                  true,
        tipoComprobante:     true,
        puntoVenta:          true,
        numeroComprobante:   true,
        fechaEmision:        true,
        razonSocialEmisor:   true,
        cuitEmisor:          true,
        razonSocialReceptor: true,
        importeTotal:        true,
        caeNumero:           true,
        estado:              true,
        procesadoEn:         true,
        archivoOrigen:       true,
      },
    }),
    prisma.factura.count({ where }),
  ]);

  return NextResponse.json({
    data: facturas,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
