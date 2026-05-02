"use client";

import React from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";

export type ColumnConfig<T> = {
  key: keyof T | "actions";
  header: string;
  type?: "text" | "number" | "date" | "boolean" | "custom" | "currency";
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

export type GridFeatures = {
  pagination?: boolean;
  sorting?: boolean;
  filtering?: boolean;
  selection?: boolean;
};

export type GridAction<T> = {
  label: string;
  icon?: React.ElementType;
  onClick: (row: T) => void;
  variant?: "primary" | "danger" | "warning" | "info";
  showIf?: (row: T) => boolean;
};

export interface GridConfig<T> {
  columns: ColumnConfig<T>[];
  features?: GridFeatures;
  actions?: GridAction<T>[];
  groupBy?: keyof T;
  tree?: {
    enabled: boolean;
    parentField: keyof T;
    hasChildrenField: keyof T;
    levelField?: keyof T;
  };
}

export interface DataGridProps<T> {
  config: GridConfig<T>;
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  loading?: boolean;
  searchPlaceholder?: string;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  title?: string;
  description?: string;
  onCreate?: () => void;
  createLabel?: string;
  extraActions?: React.ReactNode;
  onRowClick?: (item: T) => void;
  onRowDoubleClick?: (item: T) => void;
  selectedIds?: any[];
  onSelectionChange?: (ids: any[]) => void;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (key: keyof T, direction: 'asc' | 'desc') => void;
  onLoadChildren?: (parentId: any) => Promise<T[]>;
}

export function DataGrid<T extends { id: any }>({ 
  config,
  data, 
  total,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  loading = false,
  searchPlaceholder = "Buscar...",
  searchTerm = "",
  onSearchChange,
  title,
  description,
  onCreate,
  createLabel = "Nuevo",
  extraActions,
  onRowClick,
  onRowDoubleClick,
  selectedIds = [],
  onSelectionChange,
  sortBy,
  sortOrder,
  onSortChange,
  onLoadChildren
}: DataGridProps<T>) {
  const [localSearch, setLocalSearch] = React.useState(searchTerm);
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({ 
    key: (sortBy as keyof T) || null, 
    direction: sortOrder || 'asc' 
  });
  const [localPage, setLocalPage] = React.useState(1);
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});
  const [childData, setChildData] = React.useState<Record<string, T[]>>({});
  const [loadingChildren, setLoadingChildren] = React.useState<Record<string, boolean>>({});

  // Determinar si es paginación de servidor o local
  const isServerSide = total !== undefined;
  
  // 1. Filtrado Local (si no es server side)
  const filteredData = React.useMemo(() => {
    if (isServerSide || !localSearch) return data;
    
    return data.filter(item => {
      return config.columns.some(col => {
        if (col.key === "actions") return false;
        const val = item[col.key as keyof T];
        return String(val).toLowerCase().includes(localSearch.toLowerCase());
      });
    });
  }, [data, localSearch, config.columns, isServerSide]);

  // 2. Ordenamiento Local (si no es server side)
  const sortedData = React.useMemo(() => {
    if (isServerSide) return filteredData;

    let sortableItems = [...filteredData];
    
    if (config.groupBy) {
      sortableItems.sort((a, b) => {
        const aVal = String(a[config.groupBy!] || '');
        const bVal = String(b[config.groupBy!] || '');
        const groupComp = aVal.localeCompare(bVal);
        
        if (groupComp !== 0) return groupComp;
        
        if (sortConfig.key !== null && sortConfig.key !== "actions") {
          let aSub = a[sortConfig.key!];
          let bSub = b[sortConfig.key!];

          if (typeof aSub === 'object' && aSub !== null) aSub = (aSub as any).nombre || (aSub as any).descripcion || String(aSub);
          if (typeof bSub === 'object' && bSub !== null) bSub = (bSub as any).nombre || (bSub as any).descripcion || String(bSub);

          if (aSub < bSub) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aSub > bSub) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else if (sortConfig.key !== null && sortConfig.key !== "actions") {
      sortableItems.sort((a, b) => {
        let aVal: any = a[sortConfig.key!];
        let bVal: any = b[sortConfig.key!];

        if (typeof aVal === 'object' && aVal !== null) aVal = (aVal as any).nombre || (aVal as any).descripcion || String(aVal);
        if (typeof bVal === 'object' && bVal !== null) bVal = (bVal as any).nombre || (bVal as any).descripcion || String(bVal);
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig, config.groupBy, isServerSide]);

  // 3. Paginación Local vs Servidor
  const finalTotal = isServerSide ? total : sortedData.length;
  const finalPage = isServerSide ? page : localPage;
  const totalPages = Math.ceil(finalTotal / pageSize);
  
  const displayData = React.useMemo(() => {
    if (isServerSide) return sortedData;
    return sortedData.slice((localPage - 1) * pageSize, localPage * pageSize);
  }, [sortedData, localPage, pageSize, isServerSide]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (onSearchChange) onSearchChange(val);
    if (!isServerSide) setLocalPage(1);
  };

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    if (onSortChange) onSortChange(key, direction);
  };

  const toggleExpand = async (item: T) => {
    const isExpanded = expandedRows[item.id];
    if (!isExpanded && !childData[item.id] && onLoadChildren) {
      setLoadingChildren(prev => ({ ...prev, [item.id]: true }));
      try {
        const children = await onLoadChildren(item.id);
        setChildData(prev => ({ ...prev, [item.id]: children }));
      } catch (error) {
        console.error("Error loading children:", error);
      } finally {
        setLoadingChildren(prev => ({ ...prev, [item.id]: false }));
      }
    }
    setExpandedRows(prev => ({ ...prev, [item.id]: !isExpanded }));
  };

  const changePage = (p: number) => {
    if (isServerSide && onPageChange) {
      onPageChange(p);
    } else {
      setLocalPage(p);
    }
  };

  let lastGroup: any = null;

  const renderCell = (item: T, col: ColumnConfig<T>) => {
    if (col.render) return col.render(item);
    
    const value = col.key !== "actions" ? item[col.key as keyof T] : null;

    switch (col.type) {
      case "currency":
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value || 0));
      case "date":
        return value ? new Date(value as any).toLocaleDateString() : '-';
      case "boolean":
        return value ? 'Sí' : 'No';
      case "number":
        return String(value);
      default:
        return String(value ?? '');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {(title || onCreate || onSearchChange || extraActions) && (
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>}
            {description && <p className="text-slate-500 text-xs mt-1 font-medium italic">{description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64 uppercase placeholder:normal-case font-medium"
                value={localSearch}
                onChange={handleSearch}
              />
            </div>
            {extraActions}
            {onCreate && (
              <button
                onClick={onCreate}
                className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center gap-2"
              >
                <Plus className="size-4" />
                {createLabel}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto flex-1 relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {config.features?.selection && (
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox"
                    className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={(e) => {
                      if (onSelectionChange) {
                        onSelectionChange(e.target.checked ? data.map(i => i.id) : []);
                      }
                    }}
                  />
                </th>
              )}
              {config.columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-6 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest ${col.sortable !== false && col.key !== "actions" ? 'cursor-pointer hover:text-primary transition-colors' : ''} ${col.className}`}
                  onClick={() => col.sortable !== false && col.key !== "actions" && handleSort(col.key as keyof T)}
                  style={{ width: col.width }}
                >
                  <div className={`flex items-center gap-2 ${col.className?.includes('text-right') ? 'justify-end' : ''} ${col.className?.includes('text-center') ? 'justify-center' : ''}`}>
                    {col.header}
                    {col.sortable !== false && col.key !== "actions" && (
                      sortConfig.key === col.key ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-30" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayData.map((item) => {
              const showGroupHeader = config.groupBy && item[config.groupBy!] !== lastGroup;
              if (showGroupHeader) lastGroup = item[config.groupBy!];

              const renderRow = (row: T, isChild: boolean = false) => {
                const isExpanded = expandedRows[row.id];
                const isLoading = loadingChildren[row.id];
                const hasChildren = row[config.tree?.hasChildrenField as keyof T];
                const level = Number(row[config.tree?.levelField as keyof T] || 0);

                return (
                  <React.Fragment key={row.id}>
                    <tr 
                      className={`hover:bg-slate-50/30 transition-colors group ${onRowClick || onRowDoubleClick ? 'cursor-pointer' : ''} ${selectedIds.includes(row.id) ? 'bg-primary/5' : ''} ${isChild ? 'bg-slate-50/20' : ''}`}
                      onClick={() => onRowClick?.(row)}
                      onDoubleClick={() => onRowDoubleClick?.(row)}
                    >
                      {config.features?.selection && (
                        <td className="px-6 py-4 w-10">
                          <input 
                            type="checkbox"
                            className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                            checked={selectedIds.includes(row.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (onSelectionChange) {
                                const newSelection = selectedIds.includes(row.id)
                                  ? selectedIds.filter(id => id !== row.id)
                                  : [...selectedIds, row.id];
                                onSelectionChange(newSelection);
                              }
                            }}
                          />
                        </td>
                      )}
                      {config.columns.map((col, i) => (
                        <td key={i} className={`px-6 py-4 text-sm text-slate-600 ${col.className}`}>
                          <div className="flex items-center gap-2">
                            {i === 0 && config.tree?.enabled && (
                              <>
                                <div style={{ width: `${(level - 1) * 24}px` }} />
                                {hasChildren ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpand(row);
                                    }}
                                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                                  >
                                    {isLoading ? (
                                      <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      isExpanded ? <ChevronRight className="size-3 rotate-90 transition-transform" /> : <ChevronRight className="size-3 transition-transform" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="size-5" />
                                )}
                              </>
                            )}
                            {col.key === "actions" ? (
                              <div className="flex items-center justify-end gap-1 w-full">
                                {config.actions?.map((action, actionIdx) => {
                                  if (action.showIf && !action.showIf(row)) return null;
                                  const Icon = action.icon;
                                  return (
                                    <button
                                      key={actionIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick(row);
                                      }}
                                      className={`p-2 rounded-lg transition-all ${
                                        action.variant === 'danger' ? 'text-red-500 hover:bg-red-50' : 
                                        action.variant === 'warning' ? 'text-amber-500 hover:bg-amber-50' :
                                        action.variant === 'info' ? 'text-blue-500 hover:bg-blue-50' :
                                        'text-slate-400 hover:text-primary hover:bg-slate-100'
                                      }`}
                                      title={action.label}
                                    >
                                      {Icon ? <Icon className="size-4" /> : action.label}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : renderCell(row, col)}
                          </div>
                        </td>
                      ))}
                    </tr>
                    {isExpanded && childData[row.id]?.map(child => renderRow(child, true))}
                  </React.Fragment>
                );
              };

              return (
                <React.Fragment key={item.id}>
                  {showGroupHeader && (
                    <tr 
                      className="bg-slate-50/80 cursor-pointer hover:bg-slate-100/50 transition-colors"
                      onDoubleClick={() => onRowDoubleClick?.(item)}
                    >
                      <td colSpan={config.columns.length + (config.features?.selection ? 1 : 0)} className="px-6 py-2 text-[10px] font-black text-primary uppercase tracking-widest border-y border-slate-100 italic">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {String(item[config.groupBy!])}
                        </div>
                      </td>
                    </tr>
                  )}
                  {renderRow(item)}
                </React.Fragment>
              );
            })}
            {displayData.length === 0 && !loading && (
              <tr>
                <td colSpan={config.columns.length} className="px-6 py-12 text-center text-slate-400 italic text-sm font-medium">
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
            Mostrando <span className="text-slate-800">{finalTotal === 0 ? 0 : (finalPage - 1) * pageSize + 1}</span> a <span className="text-slate-800">{Math.min(finalPage * pageSize, finalTotal)}</span> de <span className="text-slate-800">{finalTotal}</span> resultados
          </p>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => changePage(finalPage - 1)}
              disabled={finalPage === 1}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (totalPages > 7 && p > 2 && p < totalPages - 1 && Math.abs(p - finalPage) > 1) {
                  if (p === 3 || p === totalPages - 2) return <span key={p} className="px-2 text-slate-400">...</span>;
                  return null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => changePage(p)}
                    className={`size-8 rounded-lg text-xs font-black transition-all ${
                      finalPage === p 
                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                        : "hover:bg-white border border-transparent hover:border-slate-200 text-slate-500"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => changePage(finalPage + 1)}
              disabled={finalPage === totalPages}
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
