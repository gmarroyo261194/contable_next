"use client";

import React from "react";
import { Search, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface Column<T> {
  header: string;
  accessor: string | ((item: T) => React.ReactNode);
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
  createLabel = "Nuevo"
}: DataGridProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {(title || onCreate) && (
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
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            {onCreate && (
              <button
                onClick={onCreate}
                className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
              >
                {createLabel}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {columns.map((col, i) => (
                <th key={i} className={`px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest ${col.className}`}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                {columns.map((col, i) => (
                  <td key={i} className={`px-6 py-4 text-sm text-slate-600 ${col.className}`}>
                    {typeof col.accessor === "function" 
                      ? col.accessor(item) 
                      : ((item as any)[col.accessor] as React.ReactNode)}
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
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                  No se encontraron resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
