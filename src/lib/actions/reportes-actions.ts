"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface MayorRenglon {
  id: string | number;
  fecha: Date;
  nroAsiento: string | number;
  descripcion: string;
  debe: number;
  haber: number;
  saldo: number;
  esTransporte?: boolean;
}

export interface MayorResult {
  cuentaId: number;
  codigo: string;
  nombre: string;
  renglones: MayorRenglon[];
}

export async function getCuentasParaReporte(ejercicioId: number) {
  return await prisma.cuenta.findMany({
    where: { ejercicioId },
    orderBy: { codigo: 'asc' },
    select: { id: true, codigo: true, nombre: true, imputable: true }
  });
}

export async function getEjercicioParaReporte(ejercicioId: number) {
  return await prisma.ejercicio.findUnique({
    where: { id: ejercicioId },
    select: { inicio: true, fin: true, numero: true }
  });
}

export async function getLibroMayor(
  ejercicioId: number,
  cuentaIds: number[],
  fechaDesdeStr: string,
  fechaHastaStr: string
): Promise<MayorResult[]> {
  const fechaDesde = new Date(fechaDesdeStr);
  const fechaHasta = new Date(fechaHastaStr);
  fechaHasta.setHours(23, 59, 59, 999);

  const resultados: MayorResult[] = [];

  const cuentas = await prisma.cuenta.findMany({
    where: {
      id: { in: cuentaIds },
      ejercicioId: ejercicioId,
    },
  });

  for (const cuenta of cuentas) {
    // 1. Obtener saldo inicial (Arrastre / Transporte)
    const saldoInicialRs = await prisma.renglonAsiento.aggregate({
      _sum: {
        debe: true,
        haber: true,
      },
      where: {
        cuentaId: cuenta.id,
        asiento: {
          ejercicioId: ejercicioId,
          fecha: {
            lt: fechaDesde,
          },
        },
      },
    });

    const sumDebeInicial = Number(saldoInicialRs._sum.debe || 0);
    const sumHaberInicial = Number(saldoInicialRs._sum.haber || 0);
    let saldoAcumulado = sumDebeInicial - sumHaberInicial;

    const renglonesUI: MayorRenglon[] = [];

    // Agregar el renglón de Transporte si corresponde o si siempre se quiere mostrar
    renglonesUI.push({
      id: `transporte-${cuenta.id}`,
      fecha: fechaDesde,
      nroAsiento: "-",
      descripcion: "Transporte (Saldo Inicial)",
      debe: sumDebeInicial > sumHaberInicial ? saldoAcumulado : 0,
      haber: sumHaberInicial > sumDebeInicial ? Math.abs(saldoAcumulado) : 0,
      saldo: saldoAcumulado,
      esTransporte: true,
    });

    // 2. Obtener movimientos del período
    const movimientos = await prisma.renglonAsiento.findMany({
      where: {
        cuentaId: cuenta.id,
        asiento: {
          ejercicioId: ejercicioId,
          fecha: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
        },
      },
      include: {
        asiento: true,
      },
      orderBy: [
        { asiento: { fecha: "asc" } },
        { asiento: { numero: "asc" } },
        { id: "asc" },
      ],
    });

    // 3. Calcular saldos acumulados
    for (const mov of movimientos) {
      const debe = Number(mov.debe);
      const haber = Number(mov.haber);
      saldoAcumulado = saldoAcumulado + debe - haber;

      renglonesUI.push({
        id: mov.id,
        fecha: mov.asiento.fecha,
        nroAsiento: mov.asiento.numero,
        descripcion: mov.leyenda || mov.asiento.descripcion,
        debe: debe,
        haber: haber,
        saldo: saldoAcumulado,
        esTransporte: false,
      });
    }

    resultados.push({
      cuentaId: cuenta.id,
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      renglones: renglonesUI,
    });
  }

  return resultados;
}

export interface BalanceSumaSaldo {
  cuentaId: number;
  codigo: string;
  nombre: string;
  padreId: number | null;
  imputable: boolean;
  saldoInicialDebe: number;
  saldoInicialHaber: number;
  debe: number;
  haber: number;
  saldoFinalDebe: number;
  saldoFinalHaber: number;
  nivel: number;
}

export async function getBalanceSumasSaldos(
  ejercicioId: number,
  fechaDesdeStr: string,
  fechaHastaStr: string,
  incluirCuentasSinMovimiento: boolean = false
): Promise<BalanceSumaSaldo[]> {
  const fechaDesde = new Date(fechaDesdeStr);
  const fechaHasta = new Date(fechaHastaStr);
  fechaHasta.setHours(23, 59, 59, 999);

  // 1. Traer todas las cuentas del ejercicio
  const todasLasCuentas = await prisma.cuenta.findMany({
    where: { ejercicioId },
    orderBy: { codigo: "asc" }, // El código determina naturalmente la jerarquía
  });

  const cuentasMap = new Map<number, BalanceSumaSaldo>();
  
  // Precargar el mapa
  for (const c of todasLasCuentas) {
    cuentasMap.set(c.id, {
      cuentaId: c.id,
      codigo: c.codigo,
      nombre: c.nombre,
      padreId: c.padreId,
      imputable: c.imputable,
      saldoInicialDebe: 0,
      saldoInicialHaber: 0,
      debe: 0,
      haber: 0,
      saldoFinalDebe: 0,
      saldoFinalHaber: 0,
      nivel: c.codigo.split('.').length // Asumiendo formato 1.1.1, si no, se puede calcular recursivo
    });
  }

  // Si no usan puntos, recalculamos niveles
  cuentasMap.forEach(v => {
    let level = 0;
    let curr = v;
    while (curr.padreId) {
       level++;
       curr = cuentasMap.get(curr.padreId)!;
       if (!curr) break;
    }
    v.nivel = level;
  });

  // 2. Fetch Saldo Inicial (Movimientos < fechaDesde)
  const sumaIniciales = await prisma.renglonAsiento.groupBy({
    by: ["cuentaId"],
    _sum: { debe: true, haber: true },
    where: {
      asiento: {
        ejercicioId: ejercicioId,
        fecha: { lt: fechaDesde },
      },
    },
  });

  for (const s of sumaIniciales) {
    const obj = cuentasMap.get(s.cuentaId);
    if (obj) {
      const stDebe = Number(s._sum.debe || 0);
      const stHaber = Number(s._sum.haber || 0);
      if (stDebe > stHaber) {
        obj.saldoInicialDebe = stDebe - stHaber;
      } else {
        obj.saldoInicialHaber = stHaber - stDebe;
      }
    }
  }

  // 3. Fetch Movimientos del periodo
  const sumaPeriodo = await prisma.renglonAsiento.groupBy({
    by: ["cuentaId"],
    _sum: { debe: true, haber: true },
    where: {
      asiento: {
        ejercicioId: ejercicioId,
        fecha: { gte: fechaDesde, lte: fechaHasta },
      },
    },
  });

  for (const s of sumaPeriodo) {
    const obj = cuentasMap.get(s.cuentaId);
    if (obj) {
      obj.debe = Number(s._sum.debe || 0);
      obj.haber = Number(s._sum.haber || 0);
    }
  }

  // 4. Enrollar montos hacia las cuentas Padre (Tree Reduce in memory, approach de Performance)
  // Revertimos para ir de hojas hacia la raíz asumiendo el orden del código
  const reverseCuentas = Array.from(cuentasMap.values()).sort((a, b) => b.nivel - a.nivel || b.codigo.localeCompare(a.codigo));

  for (const c of reverseCuentas) {
    if (c.padreId) {
      const padre = cuentasMap.get(c.padreId);
      if (padre) {
        padre.saldoInicialDebe += c.saldoInicialDebe;
        padre.saldoInicialHaber += c.saldoInicialHaber;
        padre.debe += c.debe;
        padre.haber += c.haber;
      }
    }
  }

  // 5. Calcular saldos finales y filtrar cuentas vacías si es necesario
  const result: BalanceSumaSaldo[] = [];

  const mapEstructurado = Array.from(cuentasMap.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));

  for (const c of mapEstructurado) {
    // Calculo saldo final general
    const netInicial = c.saldoInicialDebe - c.saldoInicialHaber;
    const netMov = c.debe - c.haber;
    const finalAcum = netInicial + netMov;

    if (finalAcum > 0) {
      c.saldoFinalDebe = finalAcum;
      c.saldoFinalHaber = 0;
    } else if (finalAcum < 0) {
      c.saldoFinalHaber = Math.abs(finalAcum);
      c.saldoFinalDebe = 0;
    } else {
      c.saldoFinalDebe = 0;
      c.saldoFinalHaber = 0;
    }

    const hasMov = c.saldoInicialDebe !== 0 || c.saldoInicialHaber !== 0 || c.debe !== 0 || c.haber !== 0;

    if (incluirCuentasSinMovimiento || hasMov) {
      result.push(c);
    }
  }

  return result;
}
