// src/app/api/facturas/[id]/route.ts
// GET /api/facturas/:id

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/facturas/facturaService';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const facturaId = parseInt(id);

  if (isNaN(facturaId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      items: true,
      logs:  { orderBy: { fecha: 'desc' }, take: 10 },
    },
  });

  if (!factura) {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  }

  return NextResponse.json(factura);
}
