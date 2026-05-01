// src/app/facturas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  ArrowRight, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pagination } from '@/components/Pagination';

interface Factura {
  id:                  number;
  tipoComprobante:     string;
  puntoVenta:          string;
  numeroComprobante:   string;
  fechaEmision:        string;
  razonSocialEmisor:   string;
  cuitEmisor:          string;
  razonSocialReceptor: string | null;
  importeTotal:        string;
  caeNumero:           string | null;
  estado:              string;
  procesadoEn:         string;
  archivoOrigen:       string;
}

interface Pagination {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
}

export default function FacturasPage() {
  const [facturas, setFacturas]   = useState<Factura[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [desde, setDesde]         = useState('');
  const [hasta, setHasta]         = useState('');
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(15);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:     String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        ...(desde  && { desde  }),
        ...(hasta  && { hasta  }),
      });
      const res = await fetch(`/api/facturas?${params}`);
      const json = await res.json();
      setFacturas(json.data || []);
      setPagination(json.pagination);
    } catch (error) {
      console.error('Error fetching facturas:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, desde, hasta]);

  useEffect(() => { 
    fetchFacturas(); 
  }, [fetchFacturas]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFacturas();
  };

  const fmtImporte = (n: string) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(parseFloat(n));

  const fmtFecha = (iso: string) => {
    if (!iso) return '-';
    return format(new Date(iso), 'dd MMM yyyy', { locale: es });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              Gestión de Comprobantes
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Facturación</h1>
            <p className="text-slate-500 font-medium">
              Visualiza y gestiona todos los comprobantes procesados automáticamente.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/facturas/cargar"
              className="group flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl
                hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 font-semibold"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Importar Facturas
            </Link>
          </div>
        </div>

        {/* Stats / Overview Cards (Subtle) */}
        {pagination && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{pagination.total}</div>
                <div className="text-sm text-slate-500 font-medium">Total Procesadas</div>
              </div>
            </div>
            {/* Additional stats could go here */}
          </div>
        )}

        {/* Search & filters */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all">
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por emisor, CUIT, comprobante..."
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-slate-700 placeholder:text-slate-400
                  focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
              />
            </form>
            
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all
                ${isFilterOpen ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {(desde || hasta) && <span className="w-2 h-2 rounded-full bg-blue-500 ml-1" />}
            </button>
            <button 
              type="submit"
              onClick={handleSearch}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-slate-800 transition-all active:scale-95"
            >
              Buscar
            </button>
          </div>

          {/* Expanded Filters */}
          {isFilterOpen && (
            <div className="p-6 bg-slate-50/50 border-b border-slate-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top duration-300">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Desde
                </label>
                <input 
                  type="date" 
                  value={desde} 
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-600 font-medium" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Hasta
                </label>
                <input 
                  type="date" 
                  value={hasta} 
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-600 font-medium" 
                />
              </div>
              <div className="flex items-end pb-0.5">
                <button
                  onClick={() => { setSearch(''); setDesde(''); setHasta(''); setPage(1); }}
                  className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors py-2"
                >
                  Restablecer filtros
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-500 font-bold animate-pulse">Cargando facturas...</p>
              </div>
            ) : facturas.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center max-w-sm mx-auto space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No hay resultados</h3>
                <p className="text-slate-500 font-medium">
                  No se encontraron facturas con los criterios seleccionados. Prueba con otros términos.
                </p>
                <button
                   onClick={() => { setSearch(''); setDesde(''); setHasta(''); }}
                   className="text-blue-600 font-bold hover:underline"
                >
                  Ver todas las facturas
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Comp.</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha Emisión</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Emisor / CUIT</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Importe Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {facturas.map((f) => (
                    <tr key={f.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs
                            ${f.tipoComprobante.includes('A') ? 'bg-blue-50 text-blue-600' : 
                              f.tipoComprobante.includes('B') ? 'bg-purple-50 text-purple-600' : 
                              'bg-indigo-50 text-indigo-600'}`}
                          >
                            {f.tipoComprobante.split(' ')[1] || 'C'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{f.puntoVenta}-{f.numeroComprobante}</div>
                            <div className="text-xs text-slate-400 font-medium">{f.tipoComprobante}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-slate-700 font-semibold">{fmtFecha(f.fechaEmision)}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-[240px] truncate font-bold text-slate-800">{f.razonSocialEmisor}</div>
                        <div className="text-xs text-slate-500 font-mono tracking-tight">{f.cuitEmisor}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-lg font-extrabold text-slate-900 tracking-tight">
                          {fmtImporte(f.importeTotal)}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <StatusBadge estado={f.estado} />
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/facturas/${f.id}`}
                            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-sm transition-all"
                            title="Ver detalles"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 bg-slate-50/30 border-t border-slate-50">
            <Pagination 
              total={pagination?.total || 0}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size as number);
                setPage(1);
              }}
              pageSizeOptions={[5, 10, 15, 20, 50]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ estado }: { estado: string }) {
  const config: Record<string, { icon: any, label: string, color: string }> = {
    ok:        { icon: CheckCircle2, label: 'Procesada', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    error:     { icon: AlertCircle,  label: 'Error',     color: 'bg-rose-50 text-rose-600 border-rose-100' },
    duplicado: { icon: Clock,        label: 'Duplicada',  color: 'bg-amber-50 text-amber-600 border-amber-100' },
  };
  
  const current = config[estado] || { icon: AlertCircle, label: estado, color: 'bg-slate-50 text-slate-500 border-slate-100' };
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${current.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {current.label}
    </span>
  );
}
