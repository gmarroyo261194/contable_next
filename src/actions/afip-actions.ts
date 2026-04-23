'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNextVoucher, toAfipDate, getLastVoucher, getCotizacion, createNextFEXVoucher, getFEXLastVoucher } from '@/lib/afip/afipService';
import { TIPO_DOC, CONCEPTO, TipoComprobante, TIPO_COMPROBANTE, Concepto, TipoDoc, CONDICION_IVA, CondicionIva } from '@/lib/afip/voucherTypes';

export interface EmitirComprobanteInput {
  empresaId: number;
  ejercicioId: number;
  entidadId: number;
  ptoVenta: number;
  cbteTipo: number;   // 11, 12, 13, etc.
  concepto: number;   // 1, 2, 3
  items: {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }[];
  fechaServicioDesde?: Date;
  fechaServicioHasta?: Date;
  fechaVtoPago?: Date;
  rubroId?: number;
  servicioId?: number;
  comprobanteAsociado?: {
    tipo: number;
    ptoVta: number;
    nro: number;
  };
  monedaId?: string;
  monedaCotiz?: number;
}

/**
 * Emite un comprobante electrónico en AFIP y lo registra en la base de datos.
 * @param input Datos del comprobante a emitir.
 */
export async function emitirComprobanteAFIP(input: EmitirComprobanteInput) {
  try {
    // 1. Obtener datos del cliente
    const cliente = await prisma.entidad.findUnique({ 
      where: { id: input.entidadId },
      include: { tipo: true }
    });
    
    if (!cliente) throw new Error("Cliente no encontrado");

    // 2. Determinar TipoDoc, NroDoc y CondicionIva
    let docTipo: TipoDoc = TIPO_DOC.CUIT;
    // Limpiar CUIT/DNI de caracteres no numéricos
    let nroDocStr = (cliente.cuit || cliente.nroDoc || "").replace(/\D/g, '');
    let nroDoc = Number(nroDocStr);
    
    let condicionIva: CondicionIva = (cliente.condicionIva as CondicionIva) || CONDICION_IVA.RESPONSABLE_MONOTRIBUTO;

    if (!nroDoc) {
      docTipo = TIPO_DOC.CONSUMIDOR_FINAL;
      nroDoc = 0;
      condicionIva = CONDICION_IVA.CONSUMIDOR_FINAL;
    } else if (nroDocStr.length <= 8) {
      docTipo = TIPO_DOC.DNI;
      // Si no tiene condicion IVA seteada y es DNI, asumimos Consumidor Final
      if (!cliente.condicionIva) condicionIva = CONDICION_IVA.CONSUMIDOR_FINAL;
    }

    const impTotal = input.items.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);

    // 3. Armar petición a AFIP
    const afipReq: any = {
      PtoVta: input.ptoVenta,
      CbteTipo: input.cbteTipo as TipoComprobante,
      Concepto: input.concepto as Concepto,
      DocTipo: docTipo,
      DocNro: nroDoc,
      CondicionIVAReceptorId: condicionIva,
      CbteFch: toAfipDate(new Date()),
      ImpTotal: impTotal,
      ImpTotConc: 0,
      ImpNeto: impTotal, 
      ImpOpEx: 0,
      ImpIVA: 0,
      ImpTrib: 0,
      MonId: input.monedaId || 'PES',
      MonCotiz: input.monedaCotiz || 1,
    };

    // Fechas de servicio si corresponde
    if (input.concepto === CONCEPTO.SERVICIOS || input.concepto === CONCEPTO.PRODUCTOS_Y_SERVICIOS) {
      if (!input.fechaServicioDesde || !input.fechaServicioHasta || !input.fechaVtoPago) {
        throw new Error("Las fechas de servicio y vencimiento son requeridas para Concepto Servicios.");
      }
      afipReq.FchServDesde = toAfipDate(input.fechaServicioDesde);
      afipReq.FchServHasta = toAfipDate(input.fechaServicioHasta);
      afipReq.FchVtoPago = toAfipDate(input.fechaVtoPago);
    }

    // Comprobantes asociados (NC/ND)
    if (input.comprobanteAsociado) {
      afipReq.CbtesAsoc = [{
        Tipo: input.comprobanteAsociado.tipo,
        PtoVta: input.comprobanteAsociado.ptoVta,
        Nro: input.comprobanteAsociado.nro
      }];
    }

    // 4. Llamar a AFIP
    const exportTypes = [19, 20, 21];
    const authVoucher = exportTypes.includes(input.cbteTipo) 
      ? await createNextFEXVoucher(afipReq)
      : await createNextVoucher(afipReq);

    // 5. Registrar en DocumentoClientes
    const nuevoDocumento = await prisma.documentoClientes.create({
      data: {
        empresaId: input.empresaId,
        ejercicioId: input.ejercicioId,
        entidadId: input.entidadId,
        tipo: String(input.cbteTipo),
        numero: `${String(input.ptoVenta).padStart(5, '0')}-${String(authVoucher.voucher_number).padStart(8, '0')}`,
        fecha: new Date(),
        montoTotal: impTotal,
        iva: 0, // Ajustar si se maneja discriminación de IVA
        rubroId: input.rubroId,
        servicioId: input.servicioId,
        cae: authVoucher.CAE,
        caeVto: new Date(authVoucher.CAEFchVto),
        afipEstado: 'Autorizado',
        items: {
          create: input.items.map(item => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            importeTotal: item.cantidad * item.precioUnitario
          }))
        }
      }
    });

    revalidatePath('/facturas');
    return { 
      success: true, 
      documento: JSON.parse(JSON.stringify(nuevoDocumento)) 
    };

  } catch (error: any) {
    console.error("Error al emitir comprobante AFIP:", error);
    return { success: false, error: error.message || "Error al generar comprobante desde AFIP" };
  }
}

/**
 * Consulta el último número de comprobante autorizado en AFIP.
 */
export async function getUltimoNroAFIP(ptoVenta: number, tipo: number) {
  try {
    const exportTypes = [19, 20, 21];
    const last = exportTypes.includes(tipo)
      ? await getFEXLastVoucher(ptoVenta, tipo)
      : await getLastVoucher(ptoVenta, tipo);
    return { success: true, data: last };
  } catch (error: any) {
    console.error("Error al consultar ultimo comprobante AFIP:", error);
    return { success: false, error: error.message || "Error al conectar con AFIP" };
  }
}

/**
 * Obtiene la cotización oficial de AFIP para una moneda.
 */
export async function getCotizacionOficialAFIP(moneda: string) {
  try {
    const cotiz = await getCotizacion(moneda);
    return { success: true, data: cotiz };
  } catch (error: any) {
    console.error("Error consultando cotizacion AFIP:", error);
    return { success: false, error: error.message || "Error al consultar cotización" };
  }
}
