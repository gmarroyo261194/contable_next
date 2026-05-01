"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number | string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

/**
 * Componente de paginación unificado.
 * @param {PaginationProps} props
 */
export const Pagination = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50]
}: PaginationProps) => {
  const isAll = pageSize === 'all';
  const pageSizeNum = isAll ? total : Number(pageSize);
  const totalPages = isAll ? 1 : Math.ceil(total / pageSizeNum) || 1;

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
      <div className="flex items-center gap-4">
        <select 
          value={pageSize}
          onChange={(e) => {
            const val = e.target.value;
            onPageSizeChange(val === 'all' ? 'all' : Number(val) as any);
          }}
          className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>Mostrar {size}</option>
          ))}
          {/* Opcional: Soporte para 'all' si se desea habilitar globalmente */}
          {pageSize === 'all' && <option value="all">Mostrar Todos</option>}
        </select>
        <span className="text-xs font-medium text-slate-400">
          Mostrando {isAll ? 1 : ((page - 1) * pageSizeNum) + 1} - {Math.min(page * pageSizeNum, total)} de {total}
        </span>
      </div>

      {!isAll && totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i-1] !== p - 1 && <span className="text-slate-300 mx-1">...</span>}
                  <button
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === p 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all"
            title="Siguiente"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
};
