"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Edit2, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Wrench, 
  Home, 
  Building, 
  Trash2, 
  ArrowUpDown,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';
import { toggleServicio } from '@/lib/actions/servicio-actions';
import { toast } from 'sonner';

interface ServicioTableProps {
  servicios: any[];
  onEdit: (servicio: any) => void;
  onAdd: () => void;
  onDelete: (servicio: any) => void;
}

export function ServicioTable({ servicios, onEdit, onAdd, onDelete }: ServicioTableProps) {
  const [loading, setLoading] = useState<number | null>(null);
  
  // States for filters, sorting and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [rubroFilter, setRubroFilter] = useState("all");
  const [deptoFilter, setDeptoFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'nombre', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Derived unique lists for filters
  const rubros = useMemo(() => {
    const unique = Array.from(new Set(servicios.map(s => s.rubro?.nombre).filter(Boolean)));
    return unique.sort();
  }, [servicios]);

  const deptos = useMemo(() => {
    const unique = Array.from(new Set(servicios.map(s => s.departamento?.nombre).filter(Boolean)));
    return unique.sort();
  }, [servicios]);

  // Filtering and Sorting Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...servicios];

    // Filter by search term
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.nombre.toLowerCase().includes(lowSearch) ||
        s.rubro?.nombre?.toLowerCase().includes(lowSearch) ||
        s.departamento?.nombre?.toLowerCase().includes(lowSearch)
      );
    }

    // Filter by Rubro
    if (rubroFilter !== "all") {
      result = result.filter(s => s.rubro?.nombre === rubroFilter);
    }

    // Filter by Depto
    if (deptoFilter !== "all") {
      result = result.filter(s => s.departamento?.nombre === deptoFilter);
    }

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof typeof a];
        let valB: any = b[sortConfig.key as keyof typeof b];

        // Handling nested paths for sorting
        if (sortConfig.key === 'rubro') {
          valA = a.rubro?.nombre || '';
          valB = b.rubro?.nombre || '';
        } else if (sortConfig.key === 'depto') {
          valA = a.departamento?.nombre || '';
          valB = b.departamento?.nombre || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [servicios, searchTerm, rubroFilter, deptoFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / pageSize);
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setLoading(id);
    try {
      await toggleServicio(id, !currentStatus);
      toast.success(`Servicio ${!currentStatus ? 'activado' : 'inhabilitado'} correctamente`);
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el estado del servicio");
    } finally {
      setLoading(null);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rubroFilter, deptoFilter]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-slate-800 text-sm">Listado de Servicios</h3>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="size-3.5" />
            Nuevo Servicio
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={rubroFilter}
              onChange={(e) => setRubroFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todos los Rubros</option>
              {rubros.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={deptoFilter}
              onChange={(e) => setDeptoFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todos los Deptos</option>
              {deptos.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 uppercase tracking-wider text-[10px] font-black text-slate-400 bg-slate-50/30">
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => requestSort('nombre')}
              >
                <div className="flex items-center gap-2">
                  Servicio
                  <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'nombre' ? 'text-primary' : 'text-slate-300'}`} />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => requestSort('rubro')}
              >
                <div className="flex items-center gap-2">
                  Rubro / Depto
                  <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'rubro' ? 'text-primary' : 'text-slate-300'}`} />
                </div>
              </th>
              <th className="px-6 py-4 text-center">Ret. Fund.</th>
              <th className="px-6 py-4 text-center">Ret. Depto.</th>
              <th className="px-6 py-4">Cuentas Configuradas</th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors text-center"
                onClick={() => requestSort('activo')}
              >
                <div className="flex items-center justify-center gap-2">
                  Estado
                  <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'activo' ? 'text-primary' : 'text-slate-300'}`} />
                </div>
              </th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.length > 0 ? (
              paginatedData.map((servicio) => {
                const config = servicio.configs?.[0];
                const hasFullConfig = config && 
                  config.cuentaFundacionImputarId && 
                  config.cuentaFundacionRetenerId && 
                  config.cuentaDeptoImputarId && 
                  config.cuentaDeptoRetenerId &&
                  config.cuentaIngresosId;

                return (
                  <tr key={servicio.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{servicio.nombre}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">#{servicio.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <Home className="w-3 h-3" /> {servicio.rubro?.nombre || 'Sin rubro'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <Building className="w-3 h-3" /> {servicio.departamento?.nombre || 'Sin depto'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {servicio.participacionFundacion ? (
                        <div className="flex flex-col items-center">
                          <span className="text-green-600 font-black text-xs">{Number(servicio.porcentajeFundacion)}%</span>
                          {config?.cuentaFundacionImputar ? (
                            <span className="text-[9px] text-slate-400 truncate max-w-[100px]" title={config.cuentaFundacionImputar.nombre}>
                              {config.cuentaFundacionImputar.codigo}
                            </span>
                          ) : (
                            <span className="text-[9px] text-red-400 font-bold uppercase">Sin Cuenta</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {servicio.participacionDepto ? (
                        <div className="flex flex-col items-center">
                          <span className="text-blue-600 font-black text-xs">{Number(servicio.porcentajeDepto)}%</span>
                          {config?.cuentaDeptoImputar ? (
                            <span className="text-[9px] text-slate-400 truncate max-w-[100px]" title={config.cuentaDeptoImputar.nombre}>
                              {config.cuentaDeptoImputar.codigo}
                            </span>
                          ) : (
                            <span className="text-[9px] text-red-400 font-bold uppercase">Sin Cuenta</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                          hasFullConfig ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {hasFullConfig ? 'OK' : 'Incompleto'}
                        </div>
                        {config?.cuentaIngresos && (
                          <span className="text-[9px] text-indigo-500 font-bold truncate max-w-[120px]" title={`Ingresos: ${config.cuentaIngresos.nombre}`}>
                            INC: {config.cuentaIngresos.codigo}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${
                        servicio.activo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {servicio.activo ? 'Activo' : 'Baja'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(servicio)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(servicio.id, servicio.activo)}
                          disabled={loading === servicio.id}
                          className={`p-1.5 transition-all rounded-lg ${
                            servicio.activo ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'
                          }`}
                          title={servicio.activo ? 'Inhabilitar' : 'Activar'}
                        >
                          {servicio.activo ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5" />}
                        </button>
                        <button
                          onClick={() => onDelete(servicio)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                  No hay servicios definidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <div className="text-xs text-slate-500 font-medium">
          Mostrando <span className="text-slate-800">{(currentPage - 1) * pageSize + 1}</span> a <span className="text-slate-800">{Math.min(currentPage * pageSize, filteredAndSorted.length)}</span> de <span className="text-slate-800">{filteredAndSorted.length}</span> resultados
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
            title="Primera página"
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center px-3 gap-1">
            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md">{currentPage}</span>
            <span className="text-xs text-slate-400 font-medium">de {totalPages || 1}</span>
          </div>

          <button
            onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
            title="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
            title="Última página"
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
