"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  SquaresExclude
} from 'lucide-react';
import { Dialog } from '@/components/Dialog';
import { AsientoForm } from '@/components/AsientoForm';
import { getAsientos, anularAsiento, getAsientoById } from '@/lib/actions/asiento-actions';
import { toast } from 'sonner';

type SortOrder = 'asc' | 'desc';

export default function AsientosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [asientos, setAsientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [sortBy, setSortBy] = useState('numero');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedAsiento, setSelectedAsiento] = useState<any>(null);

  const fetchAsientos = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAsientos({
        page,
        pageSize,
        sortBy,
        sortOrder
      });
      setAsientos(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error("Error al cargar los asientos.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchAsientos();
  }, [fetchAsientos]);

  const handleEdit = (asiento: any) => {
    setSelectedAsiento(asiento);
    setIsDialogOpen(true);
  };

  const handleJump = async (id: number) => {
    setLoading(true);
    try {
      const fullAsiento = await getAsientoById(id);
      if (fullAsiento) {
        setSelectedAsiento(fullAsiento);
        setIsDialogOpen(true);
      } else {
        toast.error("No se pudo encontrar el asiento relacionado.");
      }
    } catch (err) {
      toast.error("Error al cargar el asiento.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async (asientoId: number) => {
    if (window.confirm("¿Está seguro que desea anular este asiento? Se generará un contra-asiento.")) {
      const result = await anularAsiento(asientoId);
      if ('success' in result && result.success) {
        toast.success("Asiento anulado correctamente. Se ha generado un contra-asiento.");
        fetchAsientos();
      } else {
        toast.error((result as any).error || "Error al anular");
      }
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page on sort
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  const totalPages = pageSize === 'all' ? 1 : Math.ceil(total / (pageSize as number));

  return (
    <div className="p-8 space-y-6">
      {/* Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Asientos Contables</h2>
          {/* <p className="text-slate-500 mt-1 font-medium italic">Libro Diario General</p> */}
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Excel
          </button>
          <button
            onClick={() => {
              setSelectedAsiento(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Asiento
          </button>
        </div>
      </div>

      {/* <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 font-medium leading-relaxed">
          <strong>Política de Anulación:</strong> Los asientos no pueden ser eliminados. Use la opción "Anular" para generar un contra-asiento compensatorio. <strong>Tip:</strong> Doble clic en una fila para editar.
        </div>
      </div> */}

      {/* Grid Header / Filters */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Mostrar</span>
          <select
            className="bg-white border border-slate-200 rounded-lg text-xs font-bold p-1 focus:ring-primary focus:border-primary outline-hidden"
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value;
              setPageSize(val === 'all' ? 'all' : Number(val));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value="all">Todos</option>
          </select>
        </div>
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Total: <span className="text-slate-900">{total}</span> asientos
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th
                  onClick={() => handleSort('fecha')}
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center">Fecha <SortIcon column="fecha" /></div>
                </th>
                <th
                  onClick={() => handleSort('numero')}
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors group text-center"
                >
                  <div className="flex items-center justify-center">Asiento # <SortIcon column="numero" /></div>
                </th>
                <th
                  onClick={() => handleSort('descripcion')}
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center">Concepto / Descripción <SortIcon column="descripcion" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Débito</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Crédito</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : asientos.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center font-bold text-slate-400">No hay asientos registrados.</td></tr>
              ) : asientos.map((asiento) => {
                const totalDebe = asiento.renglones.reduce((sum: number, r: any) => sum + r.debe, 0);
                const totalHaber = asiento.renglones.reduce((sum: number, r: any) => sum + r.haber, 0);
                const isAnulacion = !!asiento.anulaA;

                return (
                  <tr
                    key={asiento.id}
                    onDoubleClick={() => handleEdit(asiento)}
                    className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${isAnulacion ? 'opacity-60 italic' : ''}`}
                  >
                    <td className="px-6 py-1 text-sm font-bold text-slate-600">
                      {(() => {
                        const d = new Date(asiento.fecha);
                        const normalized = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                        return normalized.toLocaleDateString();
                      })()}
                    </td>
                    <td className="px-6 py-1 text-center">
                      <span className="text-xs font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                        #{asiento.numero.toString().padStart(5, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-black text-slate-800">{asiento.descripcion}</div>
                        {asiento.anulaA && (
                          <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">Anula #{asiento.anulaA.numero}</span>
                        )}
                        {asiento.anulaciones?.length > 0 && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">Anulado</span>
                        )}
                      </div>
                      {/* <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{asiento.renglones.length} líneas</div> */}
                    </td>
                    <td className="px-6 py-1 text-sm text-right font-black text-slate-900">$ {totalDebe.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-1 text-sm text-right font-black text-slate-900">$ {totalHaber.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-1">
                      <div className="flex items-center justify-center gap-1 opacity-100">
                        {!isAnulacion ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnular(asiento.id);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Anular"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-2 text-slate-300 cursor-not-allowed"
                            title="Ya anulado"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // handleImprimir(asiento.id);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // handleImprimir(asiento.id);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                          title="Exportar"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pageSize !== 'all' && totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Página <span className="text-primary">{page}</span> de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-30 transition-all font-bold text-slate-600 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-30 transition-all font-bold text-slate-600 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedAsiento(null);
          fetchAsientos();
        }}
        hideHeader
        noPadding
        maxWidth="max-w-screen-2xl"
        preventCloseOnOutsideClick
        preventCloseOnEscape
      >
        <AsientoForm
          asientoToEdit={selectedAsiento}
          onJump={handleJump}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedAsiento(null);
            fetchAsientos();
          }}
        />
      </Dialog>
    </div>
  );
}

