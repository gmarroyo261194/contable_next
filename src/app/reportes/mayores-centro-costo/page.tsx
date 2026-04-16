"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getReporteMayorCentroCosto, getCentrosCosto, ReporteCentroCostoResult } from '@/lib/actions/centro-costo-actions';
import { getEjercicioParaReporte } from '@/lib/actions/reportes-actions';
import { exportToExcel } from '@/lib/excel';
import { FileSpreadsheet, Loader2, ArrowLeft, Search, Tags } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ReporteCentroCostoPage() {
  const { data: session } = useSession();
  const empresaId = (session?.user as any)?.empresaId;
  const ejercicioId = (session?.user as any)?.ejercicioId;

  const [centros, setCentros] = useState<any[]>([]);
  const [selectedCentroId, setSelectedCentroId] = useState<number | ''>('');
  
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [reporte, setReporte] = useState<ReporteCentroCostoResult | null>(null);

  useEffect(() => {
    if (empresaId && ejercicioId) {
      getCentrosCosto(empresaId).then(setCentros);
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
  }, [empresaId, ejercicioId]);

  const handleConsultar = async () => {
    if (!selectedCentroId) return toast.error("Debe seleccionar un centro de costo.");
    if (!fechaDesde || !fechaHasta) return toast.error("Rango de fechas requerido.");

    setLoading(true);
    try {
      const data = await getReporteMayorCentroCosto(Number(selectedCentroId), ejercicioId, fechaDesde, fechaHasta);
      setReporte(data);
    } catch (e: any) {
      toast.error(e.message || "Error al generar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!reporte) return;
    
    const dataAExportar: any[] = [];
    
    // Desglose
    reporte.desglose.forEach(res => {
      res.renglones.forEach(r => {
        dataAExportar.push({
          'Tipo': 'DESGLOSE',
          'Cuenta': `${res.codigo} - ${res.nombre}`,
          'Fecha': r.esTransporte ? 'Transporte' : new Date(r.fecha).toLocaleDateString(),
          'Asiento': r.nroAsiento,
          'Descripción': r.descripcion,
          'Debe': r.debe,
          'Haber': r.haber,
          'Saldo': r.saldo
        });
      });
    });

    // Separador
    dataAExportar.push({});

    // Consolidado
    reporte.consolidado.renglones.forEach(r => {
      dataAExportar.push({
        'Tipo': 'CONSOLIDADO',
        'Cuenta': 'CENTRO DE COSTO COMPLETADO',
        'Fecha': r.esTransporte ? 'Transporte' : new Date(r.fecha).toLocaleDateString(),
        'Asiento': r.nroAsiento,
        'Descripción': r.descripcion,
        'Debe': r.debe,
        'Haber': r.haber,
        'Saldo': r.saldo
      });
    });

    exportToExcel(dataAExportar, `Reporte_Centro_${reporte.centroNombre}_${fechaDesde}_al_${fechaHasta}`);
  };

  return (
    <div className="p-8 max-w-screen-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/reportes" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Mayores por Centro de Costo</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">Desglose y consolidado de movimientos para un centro específico</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Centro de Costo *</label>
            <select
              value={selectedCentroId}
              onChange={e => setSelectedCentroId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-hidden font-bold text-slate-700 h-[46px]"
            >
              <option value="">Seleccione un centro...</option>
              {centros.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
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
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleExportExcel}
            disabled={!reporte || loading}
            className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
             <FileSpreadsheet className="w-4 h-4 text-green-600" />
             Exportar Excel
          </button>
          <button
            onClick={handleConsultar}
            disabled={loading}
            className="flex items-center gap-2 bg-primary px-8 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
             Generar Reporte
          </button>
        </div>
      </div>

      {reporte && (
        <div className="space-y-12">
          {/* Desglose */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 border-l-4 border-primary pl-4 tracking-tight">Desglose por Cuenta</h3>
            <div className="grid grid-cols-1 gap-6">
              {reporte.desglose.map((res) => (
                <div key={res.cuentaId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="font-black text-slate-800 text-sm">{res.codigo} - {res.nombre}</h4>
                    <span className="text-[10px] font-black bg-white px-2 py-1 rounded-md border border-slate-100 text-slate-400 uppercase tracking-widest">Cuenta Individual</span>
                  </div>
                  <ReportTable renglones={res.renglones} />
                </div>
              ))}
            </div>
          </div>

          {/* Consolidado */}
          <div className="space-y-6 pb-12">
            <h3 className="text-xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4 tracking-tight">Consolidado del Centro: {reporte.centroNombre}</h3>
            <div className="bg-white rounded-2xl border-2 border-indigo-100 overflow-hidden shadow-xl shadow-indigo-100/20">
              <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
                <h4 className="font-black text-indigo-900 text-sm uppercase tracking-wider">RESUMEN CONSOLIDADO FINAL</h4>
                <Tags className="size-5 text-indigo-400" />
              </div>
              <ReportTable renglones={reporte.consolidado.renglones} isConsolidated />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportTable({ renglones, isConsolidated = false }: { renglones: any[], isConsolidated?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <th className="px-6 py-3 w-28">Fecha</th>
            <th className="px-6 py-3 text-center w-24">Asiento</th>
            <th className="px-6 py-3">Descripción</th>
            <th className="px-6 py-3 text-right w-40">Debe</th>
            <th className="px-6 py-3 text-right w-40">Haber</th>
            <th className="px-6 py-3 text-right w-44">Saldo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {renglones.map((r, index) => (
            <tr key={index} className={`hover:bg-slate-50/50 transition-colors ${r.esTransporte ? 'bg-slate-100/50 font-bold italic' : ''}`}>
              <td className="px-6 py-2.5 text-sm text-slate-600">
                {r.esTransporte ? '-' : new Date(r.fecha).toLocaleDateString()}
              </td>
              <td className="px-6 py-2.5 text-center text-sm">
                {r.esTransporte ? '-' : <span className="text-[11px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">#{String(r.nroAsiento).padStart(5, '0')}</span>}
              </td>
              <td className="px-6 py-2.5 text-sm text-slate-800 font-medium">{r.descripcion}</td>
              <td className={`px-6 py-2.5 text-sm text-right font-black whitespace-nowrap ${r.debe > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
                {r.debe > 0 ? `$ ${r.debe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
              </td>
              <td className={`px-6 py-2.5 text-sm text-right font-black whitespace-nowrap ${r.haber > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
                {r.haber > 0 ? `$ ${r.haber.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
              </td>
              <td className={`px-6 py-2.5 text-sm text-right font-black whitespace-nowrap ${isConsolidated ? (r.saldo < 0 ? 'text-red-500' : 'text-indigo-600') : (r.saldo < 0 ? 'text-red-500' : 'text-primary')}`}>
                $ {r.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
          {renglones.length === 0 && (
            <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-slate-400 italic">No se encontraron movimientos para este criterio.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
