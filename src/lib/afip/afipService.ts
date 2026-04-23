/**
 * AFIP SDK — TypeScript implementation
 * 
 * Implementa la comunicación con:
 * - WSAA: Autenticación y autorización via certificado X.509 + PKCS7
 * - WSFEv1: Facturación Electrónica (Facturas, NC, ND, FCE, Exportación)
 * 
 * Basado en el SDK PHP: https://github.com/afipsdk/afip.php
 */

import * as fs from 'fs';
import * as path from 'path';
import * as forge from 'node-forge';
import * as soap from 'soap';
import {
  AfipVoucherData,
  AfipVoucherResult,
  AfipLastVoucherResult,
} from './voucherTypes';

// ─────────────────────────── Config ───────────────────────────────────────

interface AfipConfig {
  CUIT: number;
  production: boolean;
  certPath: string;
  keyPath: string;
  passphrase?: string;
  taFolder?: string;
  wsdlFolder?: string;
}

const SERVICE_URLS = {
  wsaa: {
    testing: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    production: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
  },
  wsfe: {
    testing: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL',
    production: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL',
  },
  wsfex: {
    testing: 'https://wswhomo.afip.gov.ar/wsfexv1/service.asmx?WSDL',
    production: 'https://servicios1.afip.gov.ar/wsfexv1/service.asmx?WSDL',
  }
};

function getConfig(): AfipConfig {
  const production = process.env.AFIP_PRODUCTION === 'true';
  const baseDir = path.join(process.cwd(), 'src', 'lib', 'afip');

  return {
    CUIT: Number(process.env.AFIP_CUIT),
    production,
    certPath: path.join(baseDir, 'certs', 'cert.pem'),
    keyPath: path.join(baseDir, 'certs', 'key.pem'),
    passphrase: '',
    taFolder: path.join(baseDir, 'ta'),
    wsdlFolder: path.join(baseDir, 'wsdl'),
  };
}

// ─────────────────────────── WSAA ─────────────────────────────────────────

interface TokenAuth {
  token: string;
  sign: string;
}

/**
 * Obtiene el Token de Autorización (TA) para un servicio AFIP.
 * Si existe un TA vigente en disco, lo reutiliza; de lo contrario genera uno nuevo.
 */
export async function getServiceTA(service: string): Promise<TokenAuth> {
  const cfg = getConfig();
  const taFile = path.join(
    cfg.taFolder!,
    `TA-${cfg.CUIT}-${service}${cfg.production ? '-production' : ''}.xml`
  );

  // Verificar si hay un TA vigente
  if (fs.existsSync(taFile)) {
    const content = fs.readFileSync(taFile, 'utf-8');
    const tokenMatch = content.match(/<token>([\s\S]*?)<\/token>/);
    const signMatch = content.match(/<sign>([\s\S]*?)<\/sign>/);
    const expMatch = content.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/);

    if (tokenMatch && signMatch && expMatch) {
      const expiration = new Date(expMatch[1].trim());
      const nowPlus10Min = new Date(Date.now() + 10 * 60 * 1000);
      if (nowPlus10Min < expiration) {
        console.log(`[AFIP] Reutilizando TA vigente para ${service}. Expira: ${expiration.toISOString()}`);
        return {
          token: tokenMatch[1].trim(),
          sign: signMatch[1].trim(),
        };
      }
    }
  }

  console.log(`[AFIP] El TA para ${service} no existe o expiró. Solicitando uno nuevo...`);

  // Crear nuevo TA
  return createServiceTA(service, cfg, taFile);
}

async function createServiceTA(service: string, cfg: AfipConfig, taFile: string): Promise<TokenAuth> {
  // 1. Crear TRA (Ticket de Requerimiento de Acceso)
  const uniqueId = Math.floor(Date.now() / 1000);
  const generationTime = new Date(Date.now() - 60 * 1000).toISOString();
  const expirationTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

  const traXml = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${generationTime}</generationTime>
    <expirationTime>${expirationTime}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;

  // 2. Firmar TRA con PKCS7 usando node-forge
  const certPem = fs.readFileSync(cfg.certPath, 'utf-8');
  const keyPem = fs.readFileSync(cfg.keyPath, 'utf-8');

  const cert = forge.pki.certificateFromPem(certPem);
  const privateKey = forge.pki.privateKeyFromPem(keyPem);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(traXml, 'utf8');
  p7.addCertificate(cert);
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [],
  });
  p7.sign({ detached: false });

  const der = forge.asn1.toDer(p7.toAsn1());
  const cms = forge.util.encode64(der.getBytes(), 64);

  // 3. Llamar a WSAA
  const wsdlFile = path.join(cfg.wsdlFolder!, 'wsaa.wsdl');
  const wsaaUrl = cfg.production
    ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
    : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';

  const client = await soap.createClientAsync(wsdlFile, {
    endpoint: wsaaUrl,
  });

  const result = await new Promise<string>((resolve, reject) => {
    client.loginCms({ in0: cms }, (err: Error | null, res: { loginCmsReturn: string }) => {
      if (err) return reject(err);
      resolve(res.loginCmsReturn);
    });
  });

  // 4. Persistir TA
  fs.mkdirSync(path.dirname(taFile), { recursive: true });
  fs.writeFileSync(taFile, result, 'utf-8');

  // 5. Parsear y retornar
  const tokenMatch = result.match(/<token>([\s\S]*?)<\/token>/);
  const signMatch = result.match(/<sign>([\s\S]*?)<\/sign>/);

  if (!tokenMatch || !signMatch) {
    throw new Error('Error al parsear el Token de Autorización de AFIP');
  }

  return {
    token: tokenMatch[1].trim(),
    sign: signMatch[1].trim(),
  };
}

// ─────────────────────────── WSFEv1 ───────────────────────────────────────

async function getWsfeClient() {
  const cfg = getConfig();
  const wsdlFile = path.join(
    cfg.wsdlFolder!,
    cfg.production ? 'wsfe-production.wsdl' : 'wsfe.wsdl'
  );
  const url = cfg.production
    ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
    : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';

  const client = await soap.createClientAsync(wsdlFile, { endpoint: url });
  return client;
}

async function buildAuthHeader(): Promise<object> {
  const cfg = getConfig();
  const ta = await getServiceTA('wsfe');
  return {
    Auth: {
      Token: ta.token,
      Sign: ta.sign,
      Cuit: cfg.CUIT,
    },
  };
}

function executeWsfe<T>(client: soap.Client, operation: string, params: object): Promise<T> {
  return new Promise((resolve, reject) => {
    (client as unknown as Record<string, Function>)[operation](
      params,
      (err: Error | null, result: Record<string, T>) => {
        if (err) return reject(err);
        const res = result[`${operation}Result`] as any;

        // DEBUG: Mostramos la respuesta exacta de AFIP
        console.log(`------------------ AFIP RESPONSE (${operation}) ------------------`);
        console.log(JSON.stringify(res, null, 2));
        console.log("--------------------------------------------------");

        // Si AFIP devuelve errores a nivel global (estructura central)
        if (res && res.Errors) {
          const errData = res.Errors;
          const errors = Array.isArray(errData.Err) ? errData.Err : [errData.Err];
          const msg = errors.map((e: any) => `(${e.Code}) ${e.Msg}`).join(' | ');
          return reject(new Error(`Error Global AFIP: ${msg}`));
        }

        resolve(res);
      }
    );
  });
}

/**
 * Obtiene el número del último comprobante autorizado para un punto de venta y tipo.
 */
export async function getLastVoucher(ptoVta: number, tipo: number): Promise<AfipLastVoucherResult> {
  const client = await getWsfeClient();
  const auth = await buildAuthHeader();

  const res = await executeWsfe<{ CbteNro: number; PtoVta: number; CbteTipo: number }>(
    client,
    'FECompUltimoAutorizado',
    { ...auth, PtoVta: ptoVta, CbteTipo: tipo }
  );

  return {
    numeroComprobante: res.CbteNro,
    tipoComprobante: res.CbteTipo,
    ptoVenta: res.PtoVta,
  };
}

/**
 * Crea el próximo comprobante (obtiene automáticamente el siguiente número).
 */
export async function createNextVoucher(data: Omit<AfipVoucherData, 'CbteDesde' | 'CbteHasta' | 'CantReg'>): Promise<AfipVoucherResult> {
  const last = await getLastVoucher(data.PtoVta, data.CbteTipo);
  const nextNum = last.numeroComprobante + 1;

  const fullData: AfipVoucherData = {
    ...data,
    CantReg: 1,
    CbteDesde: nextNum,
    CbteHasta: nextNum,
  };

  const res = await createVoucher(fullData);
  return { ...res, voucher_number: nextNum };
}

/**
 * Crea un comprobante en AFIP y retorna el CAE asignado.
 */
export async function createVoucher(data: AfipVoucherData): Promise<AfipVoucherResult> {
  const client = await getWsfeClient();
  const auth = await buildAuthHeader();

  const detReq: Record<string, unknown> = {
    Concepto: data.Concepto,
    DocTipo: data.DocTipo,
    DocNro: data.DocNro,
    CondicionIVAReceptorId: data.CondicionIVAReceptorId,
    CbteDesde: data.CbteDesde,
    CbteHasta: data.CbteHasta,
    CbteFch: data.CbteFch,
    ImpTotal: data.ImpTotal,
    ImpTotConc: data.ImpTotConc,
    ImpNeto: data.ImpNeto,
    ImpOpEx: data.ImpOpEx,
    ImpIVA: data.ImpIVA,
    ImpTrib: data.ImpTrib,
    MonId: data.MonId,
    MonCotiz: data.MonCotiz,
  };

  if (data.DstCmp !== undefined) detReq.DstCmp = data.DstCmp;

  if (data.FchServDesde !== undefined) detReq.FchServDesde = data.FchServDesde;
  if (data.FchServHasta !== undefined) detReq.FchServHasta = data.FchServHasta;
  if (data.FchVtoPago !== undefined) detReq.FchVtoPago = data.FchVtoPago;
  if (data.Iva?.length) detReq.Iva = { AlicIva: data.Iva };
  if (data.Tributos?.length) detReq.Tributos = { Tributo: data.Tributos };
  if (data.CbtesAsoc?.length) detReq.CbtesAsoc = { CbteAsoc: data.CbtesAsoc };
  if (data.Opcionales?.length) detReq.Opcionales = { Opcional: data.Opcionales };

  const req = {
    ...auth,
    FeCAEReq: {
      FeCabReq: {
        CantReg: data.CantReg,
        PtoVta: data.PtoVta,
        CbteTipo: data.CbteTipo,
      },
      FeDetReq: {
        FECAEDetRequest: detReq,
      },
    },
  };

  // DEBUG: Mostramos el objeto exacto enviado a AFIP para diagnóstico
  console.log("------------------ AFIP REQUEST ------------------");
  console.log(JSON.stringify(req, null, 2));
  console.log("--------------------------------------------------");

  const res = await executeWsfe<{
    FeDetResp: {
      FECAEDetResponse: any;
    };
  }>(client, 'FECAESolicitar', req);

  const detResp = res.FeDetResp.FECAEDetResponse;
  const det = Array.isArray(detResp) ? detResp[0] : detResp;

  if (det.Resultado !== 'A') {
    const obs = det.Observaciones?.Obs;
    const itemsObs = obs ? (Array.isArray(obs) ? obs : [obs]) : [];

    // También pueden venir Eventos en la respuesta principal o en el detalle
    const events = (res as any).Events?.Evt;
    const itemsEvt = events ? (Array.isArray(events) ? events : [events]) : [];

    let msg = itemsObs.map((o) => `[Observación] (${o.Code}) ${o.Msg}`).join(' | ');
    if (itemsEvt.length) {
      const evtMsg = itemsEvt.map((e) => `[Evento] (${e.Code}) ${e.Msg}`).join(' | ');
      msg = msg ? `${msg} || ${evtMsg}` : evtMsg;
    }

    if (!msg) msg = 'Comprobante rechazado por AFIP (sin detalle de observación)';
    throw new Error(msg);
  }

  return {
    CAE: det.CAE,
    CAEFchVto: formatAfipDate(det.CAEFchVto),
    voucher_number: det.CbteDesde,
  };
}

/**
 * Consulta la información completa de un comprobante en AFIP.
 */
export async function getVoucherInfo(nro: number, ptoVta: number, tipo: number): Promise<unknown | null> {
  const client = await getWsfeClient();
  const auth = await buildAuthHeader();

  try {
    const res = await executeWsfe<{ ResultGet: unknown }>(
      client,
      'FECompConsultar',
      {
        ...auth,
        FeCompConsReq: { CbteNro: nro, PtoVta: ptoVta, CbteTipo: tipo },
      }
    );
    return res.ResultGet;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('602')) return null;
    throw e;
  }
}

/**
 * Consulta el estado de los servidores AFIP.
 */
export async function getServerStatus(): Promise<{ AppServer: string; DbServer: string; AuthServer: string }> {
  const client = await getWsfeClient();
  const res = await executeWsfe<{ AppServer: string; DbServer: string; AuthServer: string }>(
    client,
    'FEDummy',
    {}
  );
  return res;
}

/**
 * Consulta la cotización oficial de una moneda en AFIP.
 */
export async function getCotizacion(monId: string): Promise<number> {
  const client = await getWsfeClient();
  const auth = await buildAuthHeader();

  const res = await executeWsfe<{ ResultGet: { MonCotiz: number } }>(
    client,
    'FEParamGetCotizacion',
    { ...auth, MonId: monId }
  );

  return res.ResultGet.MonCotiz;
}

// ─────────────────────────── WSFEX Methods ─────────────────────────────────

/**
 * Obtiene el último comprobante autorizado para Exportación (WSFEX).
 */
export async function getFEXLastVoucher(ptoVenta: number, tipoCbte: number): Promise<AfipLastVoucherResult> {
  const ta = await getServiceTA('wsfex');
  const cfg = getConfig();
  const wsdl = cfg.production ? SERVICE_URLS.wsfex.production : SERVICE_URLS.wsfex.testing;

  const client = await soap.createClientAsync(wsdl);
  const params = {
    Auth: {
      Token: ta.token,
      Sign: ta.sign,
      Cuit: cfg.CUIT,
    },
    Auth_tipo: {
      Pto_vta: ptoVenta,
      Cbte_Tipo: tipoCbte,
    }
  };

  const [result] = await client.FEXGetLast_CMPAsync(params);

  if (result.FEXGetLast_CMPResult.FEXErr && result.FEXGetLast_CMPResult.FEXErr.ErrCode !== 0) {
    throw new Error(`AFIP Error: (${result.FEXGetLast_CMPResult.FEXErr.ErrCode}) ${result.FEXGetLast_CMPResult.FEXErr.ErrMsg}`);
  }

  return {
    numeroComprobante: result.FEXGetLast_CMPResult.FEXResult_LastCMP.Cbte_nro,
    tipoComprobante: tipoCbte,
    ptoVenta: ptoVenta,
  };
}

/**
 * Consulta los puntos de venta habilitados para Exportación (WSFEX).
 */
export async function getFEXPuntosVenta(): Promise<number[]> {
  const ta = await getServiceTA('wsfex');
  const cfg = getConfig();
  const wsdl = cfg.production ? SERVICE_URLS.wsfex.production : SERVICE_URLS.wsfex.testing;

  const client = await soap.createClientAsync(wsdl);
  const params = {
    Auth: {
      Token: ta.token,
      Sign: ta.sign,
      Cuit: cfg.CUIT,
    }
  };

  const [result] = await client.FEXGetPARAM_PtoVentaAsync(params);
  const data = result.FEXGetPARAM_PtoVentaResult;

  if (data.FEXErr && data.FEXErr.ErrCode !== 0) {
    throw new Error(`AFIP Error: (${data.FEXErr.ErrCode}) ${data.FEXErr.ErrMsg}`);
  }

  if (!data.FEXResultGet) {
    console.warn("[AFIP] No se encontraron resultados en FEXGetPARAM_PtoVenta.");
    return [];
  }

  const list = data.FEXResultGet.PtoVenta;
  const items = Array.isArray(list) ? list : (list ? [list] : []);

  return items.map((p: any) => p.Pto_vta);
}

/**
 * Crea el próximo comprobante de exportación (obtiene automáticamente el siguiente número).
 */
export async function createNextFEXVoucher(data: Omit<AfipVoucherData, 'CbteDesde' | 'CbteHasta' | 'CantReg'>): Promise<AfipVoucherResult> {
  const last = await getFEXLastVoucher(data.PtoVta, data.CbteTipo);
  const nextNum = last.numeroComprobante + 1;

  console.log(`[WSFEX] Solicitando PRÓXIMO comprobante tipo ${data.CbteTipo} para PV ${data.PtoVta}. Siguiente nro: ${nextNum}`);

  const fullData: AfipVoucherData = {
    ...data,
    CantReg: 1,
    CbteDesde: nextNum,
    CbteHasta: nextNum,
  };

  const res = await createFEXVoucher(fullData);
  return { ...res, voucher_number: nextNum };
}

/**
 * Crea un comprobante de exportación (Factura E, etc) en WSFEXv1.
 */
export async function createFEXVoucher(data: AfipVoucherData): Promise<AfipVoucherResult> {
  const ta = await getServiceTA('wsfex');
  const cfg = getConfig();
  const wsdl = cfg.production ? SERVICE_URLS.wsfex.production : SERVICE_URLS.wsfex.testing;

  const client = await soap.createClientAsync(wsdl);

  // Mapeo detallado para WSFEX
  const params = {
    Auth: {
      Token: ta.token,
      Sign: ta.sign,
      Cuit: cfg.CUIT,
    },
    Cmp: {
      Id: Math.floor(Date.now() / 1000), // ID de solicitud
      Fecha_cbte: String(data.CbteFch),
      Tipo_cbte: data.CbteTipo,
      Punto_vta: data.PtoVta,
      Cbte_nro: data.CbteDesde,
      Tipo_expo: 2, // 2 = Exportación de Servicios
      Permiso_existente: 'N',
      Dst_cmp: data.DstCmp || 200,
      Cliente: data.Nombre || 'Consumidor Final',
      Cuit_pais_cliente: data.DocNro.toString().length > 8 ? data.DocNro : 0,
      Domicilio_cliente: data.Domicilio || 'Domicilio Extranjero',
      Id_moneda: data.MonId || 'PES',
      Cotizacion: data.MonCotiz || 1,
      Items: {
        Item: (data.Items || []).map(it => ({
          Pro_ds: it.Desc,
          Pro_qty: it.Cant,
          Pro_um: 0,
          Pro_precio_uni: it.PrecioUnit,
          Pro_bonificacion: 0,
          Pro_total_item: it.ImporteTotal,
        }))
      },
      Imp_total: data.ImpTotal,
      Obs: 'Emisión remota desde sistema de gestión.'
    }
  };

  console.log("------------------ AFIP WSFEX REQUEST ------------------");
  console.log(JSON.stringify(params, null, 2));
  console.log("--------------------------------------------------------");

  const [result] = await client.FEXAuthorizeAsync(params);
  const authRes = result.FEXAuthorizeResult;

  if (authRes.FEXErr && authRes.FEXErr.ErrCode !== 0) {
    throw new Error(`AFIP Error Global: (${authRes.FEXErr.ErrCode}) ${authRes.FEXErr.ErrMsg}`);
  }

  if (authRes.FEXResultAuth.Resultado === 'R') {
    throw new Error(`AFIP Rechazado: ${authRes.FEXErr?.ErrMsg || 'Motivo no especificado'}`);
  }

  return {
    CAE: authRes.FEXResultAuth.Cae,
    CAEFchVto: formatAfipDate(authRes.FEXResultAuth.Fch_vto),
    voucher_number: data.CbteDesde,
  };
}

// ─────────────────────────── Helpers ──────────────────────────────────────

/** Convierte fecha AFIP yyyymmdd a yyyy-mm-dd */
function formatAfipDate(date: string | number): string {
  const s = String(date);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** Convierte Date a entero yyyymmdd para AFIP */
export function toAfipDate(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return parseInt(`${y}${m}${d}`);
}
