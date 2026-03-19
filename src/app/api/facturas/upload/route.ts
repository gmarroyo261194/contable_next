// src/app/api/facturas/upload/route.ts
// POST /api/facturas/upload
// Recibe un FormData con un campo "file" (PDF), lo procesa y guarda en DB

import { NextRequest, NextResponse } from 'next/server';
import { procesarFacturaPDF } from '@/lib/facturas/facturaService';

// Desactivar el body parser de Next.js para manejar FormData manualmente
export const runtime = 'nodejs'; // pdf-parse requiere Node.js runtime

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { ok: false, error: 'No se recibió ningún archivo.' },
        { status: 400 }
      );
    }

    // Validar tipo MIME
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { ok: false, error: 'El archivo debe ser un PDF.' },
        { status: 400 }
      );
    }

    // Validar tamaño (máx 10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: 'El archivo supera el tamaño máximo de 10 MB.' },
        { status: 400 }
      );
    }

    // Convertir a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Procesar
    const result = await procesarFacturaPDF(buffer, file.name);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      facturaId: result.facturaId,
      duplicado: result.duplicado,
      resumen: {
        emisor:       result.data.razonSocialEmisor,
        cuit:         result.data.cuitEmisor,
        tipo:         result.data.tipoComprobante,
        numero:       `${result.data.puntoVenta}-${result.data.numeroComprobante}`,
        fecha:        result.data.fechaEmision,
        importe:      result.data.importeTotal,
        cae:          result.data.caeNumero,
      },
    });
  } catch (err: unknown) {
    console.error('[/api/facturas/upload] Error:', err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
