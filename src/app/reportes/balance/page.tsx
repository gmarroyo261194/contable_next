"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getBalanceSumasSaldos, BalanceSumaSaldo, getEjercicioParaReporte } from '@/lib/actions/reportes-actions';
import { exportToExcel } from '@/lib/excel';
import { FileSpreadsheet, Loader2, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BalanceSumasSaldosPage() {
  const { data: session } = useSession();
  const ejercicioId = (session?.user as any)?.ejercicioId;

  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [incluirCuentasSinMovimiento, setIncluirCuentasSinMovimiento] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<BalanceSumaSaldo[]>([]);

  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  useEffect(() => {
    if (ejercicioId) {
      getEjercicioParaReporte(ejercicioId).then(data => {
        if (data) {
          const dInicio = new Date(data.inicio);
          const inicio = new Date(dInicio.getTime() - dInicio.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          
          const dFin = new Date(data.fin);
          const fin = new Date(dFin.getTime() - dFin.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          
          setMinDate(inicio);
          setMaxDate(fin);
          setFechaDesde(inicio);
          setFechaHasta(fin);
        }
      });
    }
  }, [ejercicioId]);

  const handleConsultar = async () => {
    if (!ejercicioId) {
      toast.error("No hay un ejercicio activo.");
      return;
    }
    if (!fechaDesde || !fechaHasta) {
      toast.error("Debe especificar el rango de fechas.");
      return;
    }
    setLoading(true);
    try {
      const data = await getBalanceSumasSaldos(ejercicioId, fechaDesde, fechaHasta, incluirCuentasSinMovimiento);
      setResultados(data);
      if (data.length === 0) {
         toast.info("No hay datos para los criterios seleccionados.");
      }
    } catch (e: any) {
      toast.error("Error al generar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (resultados.length === 0) return;
    
    const dataAExportar = resultados.map(r => {
      const totalDebe = r.saldoInicialDebe + r.debe;
      const totalHaber = r.saldoInicialHaber + r.haber;
      const saldo = totalDebe - totalHaber;
      
      return {
        'Cod Cuenta': r.codigo,
        'Nombre Cuenta': r.nombre,
        'Tipo': r.imputable ? 'Imputable' : 'Agrupadora',
        'Debe': totalDebe,
        'Haber': totalHaber,
        'Saldo': saldo
      };
    });

    exportToExcel(dataAExportar, `Balance_Sumas_Saldos_${fechaDesde}_al_${fechaHasta}`);
  };

  // Calcular totales para la última fila
  const totales = resultados.reduce((acc, curr) => {
    if (curr.imputable) {
      acc.debe += curr.saldoInicialDebe + curr.debe;
      acc.haber += curr.saldoInicialHaber + curr.haber;
      acc.saldo += (curr.saldoInicialDebe + curr.debe) - (curr.saldoInicialHaber + curr.haber);
    }
    return acc;
  }, {
    debe: 0, haber: 0, saldo: 0
  });

  return (
    <div className="p-8 max-w-screen-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reportes" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Balance de Sumas y Saldos</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">Resumen de cuenta jerárquico</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Desde</label>
            <input 
              type="date" 
              value={fechaDesde}
              min={minDate}
              max={maxDate}
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Hasta</label>
            <input 
              type="date" 
              value={fechaHasta}
              min={minDate}
              max={maxDate}
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
            />
          </div>
          <div className="md:col-span-2 flex items-center h-full xl:pl-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary accent-primary" 
                  checked={incluirCuentasSinMovimiento}
                  onChange={(e) => setIncluirCuentasSinMovimiento(e.target.checked)}
                />
              </div>
              <span className="text-sm font-bold text-slate-700">Incluir cuentas sin saldo ni movimiento</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleExportExcel}
            disabled={resultados.length === 0 || loading}
            className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
             <FileSpreadsheet className="w-4 h-4 text-green-600" />
             Excel
          </button>
          <button
            onClick={handleConsultar}
            disabled={loading}
            className="flex items-center gap-2 bg-primary px-8 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
             Consultar
          </button>
        </div>
      </div>

      {/* Resultados */}
      { resultados.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th colSpan={2} className="px-6 py-3 border-b border-r border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Referencia de Cuenta</th>
                  <th colSpan={3} className="px-6 py-3 border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Sumas y Saldos ({fechaDesde} a {fechaHasta})</th>
                </tr>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-2 text-[10px] border-r border-slate-100 font-black uppercase tracking-widest text-slate-400">Código</th>
                  <th className="px-6 py-2 text-[10px] border-r border-slate-100 font-black uppercase tracking-widest text-slate-400">Nombre</th>
                  
                  <th className="px-6 py-2 text-[10px] border-r border-slate-100 font-black uppercase tracking-widest text-slate-400 text-right w-36">Debe</th>
                  <th className="px-6 py-2 text-[10px] border-r border-slate-100 font-black uppercase tracking-widest text-slate-400 text-right w-36">Haber</th>
                  
                  <th className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-36">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                 {resultados.map((r) => {
                   const totalDebe = r.saldoInicialDebe + r.debe;
                   const totalHaber = r.saldoInicialHaber + r.haber;
                   const saldo = totalDebe - totalHaber;

                   return (
                   <tr key={r.cuentaId} className={`hover:bg-slate-50/50 transition-colors ${!r.imputable ? 'bg-slate-50/80 font-bold' : ''}`}>
                     <td className="px-6 py-2 border-r border-slate-50 whitespace-nowrap">
                       <span className={`${!r.imputable ? 'text-slate-800' : 'text-slate-500'}`} style={{ paddingLeft: `${(r.nivel - 1) * 8}px` }}>
                         {r.codigo}
                       </span>
                     </td>
                     <td className={`px-6 py-2 border-r border-slate-50 ${!r.imputable ? 'text-slate-800' : 'text-slate-600'}`}>
                         <span style={{ paddingLeft: `${(r.nivel - 1) * 8}px` }}>{r.nombre}</span>
                     </td>
                     
                     {/* Suma Debe */}
                     <td className={`px-6 py-2 border-r border-slate-50 text-right ${totalDebe > 0 ? 'text-slate-900 font-medium' : 'text-slate-300'}`}>
                       {totalDebe !== 0 ? totalDebe.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                     </td>
                     {/* Suma Haber */}
                     <td className={`px-6 py-2 border-r border-slate-50 text-right ${totalHaber > 0 ? 'text-slate-900 font-medium' : 'text-slate-300'}`}>
                       {totalHaber !== 0 ? totalHaber.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                     </td>

                     {/* Saldo Único */}
                     <td className={`px-6 py-2 text-right ${saldo > 0 ? 'text-primary font-bold' : saldo < 0 ? 'text-red-500 font-bold' : 'text-slate-300'}`}>
                       {saldo !== 0 ? (saldo > 0 ? '' : '- ') + '$ ' + Math.abs(saldo).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                     </td>
                   </tr>
                 );
                 })}
              </tbody>
              <tfoot className="bg-slate-100/50 border-t-2 border-slate-200 text-sm">
                <tr>
                   <td colSpan={2} className="px-6 py-3 font-black text-slate-800 text-right border-r border-slate-200">
                     TOTAL GENERAL (Cuentas Imputables):
                   </td>
                   
                   <td className="px-6 py-3 font-black text-slate-900 text-right border-r border-slate-200">{totales.debe.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                   <td className="px-6 py-3 font-black text-slate-900 text-right border-r border-slate-200">{totales.haber.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                   
                   <td className={`px-6 py-3 font-black text-right ${totales.saldo > 0 ? 'text-primary' : totales.saldo < 0 ? 'text-red-500' : 'text-slate-900'}`}>{totales.saldo !== 0 ? (totales.saldo < 0 ? '- ' : '') + '$ ' + Math.abs(totales.saldo).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
