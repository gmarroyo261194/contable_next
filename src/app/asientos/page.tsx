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
  SquaresExclude,
  Search
} from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Dialog } from '@/components/Dialog';
import { AsientoForm } from '@/components/AsientoForm';
import { getAsientos, anularAsiento, getAsientoById } from '@/lib/actions/asiento-actions';
import { anularPago } from '@/lib/actions/pago-actions';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getModulos } from '@/lib/actions/module-actions';

type SortOrder = 'asc' | 'desc';

export default function AsientosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [asientos, setAsientos] = useState<any[]>([]);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getModulos().then(mods => setActiveModules(mods.filter(m => m.activo).map(m => m.codigo)));
  }, []);

  const isContabilidadEnabled = activeModules.length === 0 || activeModules.includes("CONTABILIDAD");

  // Read from URL Search Params
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = searchParams.get('pageSize') === 'all' ? 'all' : Number(searchParams.get('pageSize')) || 10;
  const sortBy = searchParams.get('sortBy') || 'numero';
  const sortOrder = (searchParams.get('sortOrder') as SortOrder) || 'desc';
  const searchTerm = searchParams.get('search') || '';

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [selectedAsiento, setSelectedAsiento] = useState<any>(null);

  // Confirm Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [asientoToAnular, setAsientoToAnular] = useState<any>(null);

  const updateFilters = useCallback((newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const fetchAsientos = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAsientos({
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: searchTerm
      });
      setAsientos(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error("Error al cargar los asientos.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    fetchAsientos();
  }, [fetchAsientos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        updateFilters({ search: localSearch, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, updateFilters]);

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

  const handleAnular = async () => {
    if (!asientoToAnular) return;
    
    const payment = asientoToAnular.pagosGestion?.[0];
    const isPayment = !!payment;
    
    try {
      const result = isPayment 
        ? await anularPago(payment.id)
        : await anularAsiento(asientoToAnular.id);

      if ('success' in result && result.success) {
        toast.success(isPayment 
          ? "Pago y asiento anulados correctamente. Las facturas han vuelto al estado Autorizado." 
          : "Asiento anulado correctamente. Se ha generado un contra-asiento."
        );
        fetchAsientos();
      } else {
        toast.error((result as any).error || "Error al anular");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado al anular.");
    } finally {
      setIsConfirmOpen(false);
      setAsientoToAnular(null);
    }
  };

  const openAnularDialog = (asiento: any) => {
    setAsientoToAnular(asiento);
    setIsConfirmOpen(true);
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    updateFilters({ 
      sortBy: column, 
      sortOrder: newOrder, 
      page: 1 
    });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  const totalPages = pageSize === 'all' ? 1 : Math.ceil(total / (pageSize as number));

  if (activeModules.length > 0 && !isContabilidadEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 mb-8 shadow-inner border border-amber-100">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Módulo Contable Desactivado</h1>
        <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
          El acceso al Libro Diario y la gestión de asientos ha sido restringido por la administración desde la configuración de módulos.
        </p>
        <div className="flex gap-4 mt-10">
          <button 
            onClick={() => router.push('/settings/modulos')}
            className="bg-white border border-slate-200 text-slate-700 px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            IR A MÓDULOS
          </button>
          <button 
            onClick={() => router.push('/')}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            VOLVER AL INICIO
          </button>
        </div>
      </div>
    );
  }

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
              updateFilters({ pageSize: val, page: 1 });
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value="all">Todos</option>
          </select>
        </div>
        <div className="flex items-center gap-4 flex-1 max-w-md ml-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por descripción, leyenda, número, importe o fecha (DD/MM/YYYY)..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
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
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Empresa / Ejercicio
                </th>
                <th
                  onClick={() => handleSort('descripcion')}
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center">Concepto / Descripción <SortIcon column="descripcion" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Importe</th>
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
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter truncate max-w-[150px]">
                          {asiento.ejercicio?.empresa?.nombreFantasia || asiento.ejercicio?.empresa?.razonSocial}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Ejercicio {asiento.ejercicio?.numero} ({asiento.ejercicio?.nombre})
                        </span>
                      </div>
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
                    </td>
                    <td className="px-6 py-1 text-sm text-right font-black text-slate-900">
                      $ {totalDebe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-1">
                      <div className="flex items-center justify-center gap-1 opacity-100">
                        {!isAnulacion ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAnularDialog(asiento);
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
                onClick={() => updateFilters({ page: page - 1 })}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-30 transition-all font-bold text-slate-600 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => updateFilters({ page: page + 1 })}
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
          }}
        />
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleAnular}
        title={asientoToAnular?.pagosGestion?.[0] ? "Anular Pago y Asiento" : "Anular Asiento"}
        description={asientoToAnular?.pagosGestion?.[0] 
          ? "Este asiento está asociado al pago de facturas docentes. Al anularlo, el pago se cancelará y las facturas volverán al estado 'Autorizado'. ¿Desea proceder?"
          : "¿Está seguro que desea anular este asiento? Se generará un contra-asiento compensatorio."
        }
        confirmText="Confirmar Anulación"
        variant="danger"
      />
    </div>
  );
}

