"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Edit2, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Building, 
  Trash2,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast 
} from 'lucide-react';
import { Departamento } from '@prisma/client';
import { toggleDepartamento } from '@/lib/actions/departamento-actions';
import { toast } from 'sonner';

interface DeptoTableProps {
  departamentos: Departamento[];
  onEdit: (depto: Departamento) => void;
  onAdd: () => void;
  onDelete: (depto: Departamento) => void;
}

export function DeptoTable({ departamentos, onEdit, onAdd, onDelete }: DeptoTableProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'nombre', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Filtering and Sorting Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...departamentos];

    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(d => d.nombre.toLowerCase().includes(lowSearch));
    }

    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key as keyof Departamento] || '';
        const valB = b[sortConfig.key as keyof Departamento] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [departamentos, searchTerm, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSorted.length / pageSize);
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setLoading(id);
    try {
      await toggleDepartamento(id, !currentStatus);
      toast.success(`Departamento ${!currentStatus ? 'activado' : 'inhabilitado'} correctamente`);
    } catch (error) {
      toast.error("Error al cambiar el estado del departamento");
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-slate-800 text-sm">Listado de Departamentos</h3>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="size-3.5" />
            Nuevo Departamento
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar departamento por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
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
                  Nombre
                  <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'nombre' ? 'text-primary' : 'text-slate-300'}`} />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => requestSort('activo')}
              >
                <div className="flex items-center gap-2">
                  Estado
                  <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'activo' ? 'text-primary' : 'text-slate-300'}`} />
                </div>
              </th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.length > 0 ? (
              paginatedData.map((depto) => (
                <tr key={depto.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">{depto.nombre}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
                      depto.activo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {depto.activo ? 'Activo' : 'Inhabilitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(depto)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(depto.id, depto.activo)}
                        disabled={loading === depto.id}
                        className={`p-1.5 transition-all rounded-lg ${
                          depto.activo ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'
                        }`}
                        title={depto.activo ? 'Inhabilitar' : 'Activar'}
                      >
                        {depto.activo ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5" />}
                      </button>
                      <button
                        onClick={() => onDelete(depto)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                  No hay departamentos definidos.
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
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
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
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
