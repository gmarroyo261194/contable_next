"use client";

import React from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";

interface Column<T> {
  header: string;
  accessor?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  title?: string;
  description?: string;
  onCreate?: () => void;
  createLabel?: string;
  pageSize?: number;
}

export function DataGrid<T extends { id: any }>({ 
  data, 
  columns, 
  actions, 
  searchPlaceholder = "Buscar...",
  onSearch,
  title,
  description,
  onCreate,
  createLabel = "Nuevo",
  pageSize = 10
}: DataGridProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = React.useState(1);

  // 1. Filtrado
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return columns.some(col => {
        if (!col.accessor) return false;
        const val = item[col.accessor];
        return String(val).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // 2. Ordenamiento
  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 3. Paginación
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    if (onSearch) onSearch(val);
  };

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {(title || onCreate || true) && (
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-800 font-display">{title}</h3>}
            {description && <p className="text-slate-500 text-xs mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64 uppercase placeholder:normal-case font-medium"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            {onCreate && (
              <button
                onClick={onCreate}
                className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center gap-2"
              >
                <Plus className="size-4" />
                {createLabel}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest ${col.sortable !== false && col.accessor ? 'cursor-pointer hover:text-primary transition-colors' : ''} ${col.className}`}
                  onClick={() => col.sortable !== false && col.accessor && handleSort(col.accessor)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable !== false && col.accessor && (
                      sortConfig.key === col.accessor ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-30" />
                      )
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                {columns.map((col, i) => (
                  <td key={i} className={`px-6 py-4 text-sm text-slate-600 ${col.className}`}>
                    {col.cell 
                      ? col.cell(item) 
                      : col.accessor ? (item[col.accessor] as React.ReactNode) : null}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {actions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-400 italic text-sm font-medium">
                  No se encontraron resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Paginación */}
      {totalPages > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
            Mostrando <span className="text-slate-800">{(currentPage - 1) * pageSize + 1}</span> a <span className="text-slate-800">{Math.min(currentPage * pageSize, sortedData.length)}</span> de <span className="text-slate-800">{sortedData.length}</span> resultados
          </p>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Mostrar solo algunas páginas si hay muchas
                if (totalPages > 7 && page > 2 && page < totalPages - 1 && Math.abs(page - currentPage) > 1) {
                  if (page === 3 || page === totalPages - 2) return <span key={page} className="px-2 text-slate-400">...</span>;
                  return null;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`size-8 rounded-lg text-xs font-black transition-all ${
                      currentPage === page 
                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                        : "hover:bg-white border border-transparent hover:border-slate-200 text-slate-500"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
