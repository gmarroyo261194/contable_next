"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getCuentasParaReporte, getLibroMayor, MayorResult, getEjercicioParaReporte } from '@/lib/actions/reportes-actions';
import { exportToExcel } from '@/lib/excel';
import { FileSpreadsheet, Loader2, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { AccountSearchDialog } from '@/components/AccountSearchDialog';

export default function LibroMayorPage() {
  const { data: session } = useSession();
  const ejercicioId = (session?.user as any)?.ejercicioId;

  const [cuentas, setCuentas] = useState<any[]>([]);
  const [selectedCuenta, setSelectedCuenta] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Dates defaulting to current month for a quick start
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<MayorResult[]>([]);

  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  useEffect(() => {
    if (ejercicioId) {
      getCuentasParaReporte(ejercicioId).then(data => {
        // Filtrar solo cuentas imputables ya que los Mayores no admiten cuentas agrupadoras
        setCuentas(data.filter((c: any) => c.imputable));
      });
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
      // Bind F7 to open search
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F7') {
          e.preventDefault();
          setIsSearching(true);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
  
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [ejercicioId]);

  const handleConsultar = async () => {
    if (!ejercicioId) {
      toast.error("No hay un ejercicio activo.");
      return;
    }
    if (!selectedCuenta) {
      toast.error("Debe seleccionar una cuenta.");
      return;
    }
    if (!fechaDesde || !fechaHasta) {
      toast.error("Debe especificar el rango de fechas.");
      return;
    }
    setLoading(true);
    try {
      const data = await getLibroMayor(ejercicioId, [selectedCuenta.id], fechaDesde, fechaHasta);
      setResultados(data);
      if (data.length === 0 || data.every(r => r.renglones.length === 0)) {
         toast.info("No hay movimientos para los criterios seleccionados.");
      }
    } catch (e: any) {
      toast.error("Error al generar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (resultados.length === 0) return;
    
    // Flatten data for Excel
    const dataAExportar: any[] = [];
    resultados.forEach(res => {
      res.renglones.forEach(r => {
        dataAExportar.push({
          'Cod Cuenta': res.codigo,
          'Nombre Cuenta': res.nombre,
          'Fecha': r.esTransporte ? 'Apertura' : new Date(r.fecha).toLocaleDateString(),
          'Asiento N°': r.nroAsiento,
          'Descripción': r.descripcion,
          'Debe': r.debe,
          'Haber': r.haber,
          'Saldo': r.saldo
        });
      });
    });

    exportToExcel(dataAExportar, `Libro_Mayor_${fechaDesde}_al_${fechaHasta}`);
  };

  return (
    <div className="p-8 max-w-screen-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reportes" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Libro Mayor</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">Visualización detallada de movimientos por cuenta</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Cuenta *</label>
            <button 
              onClick={() => setIsSearching(true)}
              className="w-full text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 hover:bg-slate-100 transition-all font-bold text-slate-700 h-[46px]"
            >
              {selectedCuenta ? `${selectedCuenta.codigo} - ${selectedCuenta.nombre} ${!selectedCuenta.imputable ? '(Agrupadora)' : ''}` : 'Buscar cuenta...'}
            </button>
            <p className="text-[10px] text-slate-400 mt-1">Haga clic o presione F7 para buscar.</p>
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
      {resultados.map((resultado) => (
        <div key={resultado.cuentaId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-black text-slate-800 text-lg">{resultado.codigo} - {resultado.nombre}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">Fecha</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-24">Asiento</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-32">Debe</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-32">Haber</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-32">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {resultado.renglones.map((r, index) => (
                   <tr key={r.id + '-' + index} className={`hover:bg-slate-50/50 transition-colors ${r.esTransporte ? 'bg-slate-50/80 font-medium' : ''}`}>
                     <td className="px-6 py-2 text-sm text-slate-600">
                       {r.esTransporte ? '-' : new Date(r.fecha).toLocaleDateString()}
                     </td>
                     <td className="px-6 py-2 text-center text-sm">
                       {r.esTransporte ? '-' : <span className="text-xs font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">#{String(r.nroAsiento).padStart(5, '0')}</span>}
                     </td>
                     <td className="px-6 py-2 text-sm text-slate-800 font-medium">{r.descripcion}</td>
                     <td className={`px-6 py-2 text-sm text-right font-black ${r.debe > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                       {r.debe > 0 ? `$ ${r.debe.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                     </td>
                     <td className={`px-6 py-2 text-sm text-right font-black ${r.haber > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                       {r.haber > 0 ? `$ ${r.haber.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                     </td>
                     <td className={`px-6 py-2 text-sm text-right font-black ${r.saldo < 0 ? 'text-red-600' : 'text-primary'}`}>
                       $ {r.saldo.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                     </td>
                   </tr>
                 ))}
                 {resultado.renglones.length === 0 && (
                   <tr><td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-slate-400">No hay movimientos</td></tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Modal buscador de cuentas */}
      <AccountSearchDialog
        isOpen={isSearching}
        onClose={() => setIsSearching(false)}
        onSelect={(cuenta) => setSelectedCuenta(cuenta)}
        cuentas={cuentas}
      />
    </div>
  );
}
