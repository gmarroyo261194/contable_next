"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Rows,
  Layers,
  Filter
} from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getCursos, upsertCurso, deleteCurso } from '@/lib/actions/curso-actions';
import { getRubros } from '@/lib/actions/rubro-actions';
import { getServicios } from '@/lib/actions/servicio-actions';
import { toast } from 'sonner';
import { Dialog } from '@/components/Dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '@/components/Pagination';

type SortOrder = 'asc' | 'desc';

export default function CursosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL State
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as SortOrder) || 'desc';
  const searchTerm = searchParams.get('search') || '';
  const groupByRubro = searchParams.get('groupByRubro') === 'true';

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [cursos, setCursos] = useState<any[]>([]);
  const [rubros, setRubros] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<any>(null);
  const [cursoToDelete, setCursoToDelete] = useState<any>(null);
  const [formRubroId, setFormRubroId] = useState<number | null>(null);

  const updateFilters = useCallback((newParams: Record<string, string | number | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCursos({ 
        page, 
        pageSize: groupByRubro ? 'all' : pageSize, 
        search: searchTerm,
        sortBy,
        sortOrder
      });
      setCursos(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error("Error al cargar cursos.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, sortBy, sortOrder, groupByRubro]);

  useEffect(() => {
    fetchCursos();
    getRubros().then(setRubros);
  }, [fetchCursos]);

  useEffect(() => {
    if (formRubroId) {
      getServicios(undefined, formRubroId).then(setServicios);
    } else if (selectedCurso?.rubroId) {
      getServicios(undefined, selectedCurso.rubroId).then(setServicios);
    } else {
      setServicios([]);
    }
  }, [formRubroId, selectedCurso?.rubroId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        updateFilters({ search: localSearch, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, updateFilters]);

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    updateFilters({ sortBy: field, sortOrder: newOrder, page: 1 });
  };

  const groupedCursos = useMemo(() => {
    if (!groupByRubro) return null;
    const groups: Record<string, any[]> = {};
    cursos.forEach(curso => {
      const rubroName = curso.rubro?.nombre || 'Sin Rubro';
      if (!groups[rubroName]) groups[rubroName] = [];
      groups[rubroName].push(curso);
    });
    return groups;
  }, [cursos, groupByRubro]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: selectedCurso?.id,
      nombre: formData.get('nombre') as string,
      anioAcademico: Number(formData.get('anioAcademico')),
      fechaInicio: formData.get('fechaInicio') as string,
      fechaFin: formData.get('fechaFin') as string,
      rubroId: Number(formData.get('rubroId')),
      servicioId: Number(formData.get('servicioId')),
      costo: Number(formData.get('costo')),
      cantidadCuotas: Number(formData.get('cantidadCuotas')),
      estado: formData.get('estado') as string,
    };

    try {
      await upsertCurso(data);
      toast.success(selectedCurso ? "Curso actualizado" : "Curso creado");
      setIsDialogOpen(false);
      fetchCursos();
    } catch (error) {
      toast.error("Error al guardar curso.");
    }
  };

  const handleDelete = async () => {
    if (!cursoToDelete) return;
    try {
      const result = await deleteCurso(cursoToDelete.id);
      if (result.success) {
        toast.success("Curso eliminado");
        fetchCursos();
      } else {
        toast.error(result.error || "No se pudo eliminar");
      }
    } catch (error) {
      toast.error("Error al eliminar.");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Cursos</h2>
          <p className="text-slate-500 font-medium italic">Administración académica y financiera</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => updateFilters({ groupByRubro: !groupByRubro, page: 1 })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
              groupByRubro 
                ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {groupByRubro ? <Rows className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            {groupByRubro ? 'Vista Plana' : 'Agrupar por Rubro'}
          </button>
          <button
            onClick={() => { setSelectedCurso(null); setIsDialogOpen(true); }}
            className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Curso
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por curso, rubro o servicio..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total: <span className="text-slate-900">{total}</span> cursos
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('nombre')}>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nombre <SortIcon field="nombre" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('rubro')}>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Rubro <SortIcon field="rubro" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('servicio')}>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Servicio <SortIcon field="servicio" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Periodo
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors text-right" onClick={() => handleSort('costo')}>
                  <div className="flex items-center justify-end text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Costo <SortIcon field="costo" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /></td></tr>
              ) : cursos.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center font-bold text-slate-400 uppercase text-xs tracking-widest">No se encontraron registros</td></tr>
              ) : groupByRubro ? (
                Object.entries(groupedCursos!).map(([rubroName, items]) => (
                  <React.Fragment key={rubroName}>
                    <tr className="bg-slate-100/30">
                      <td colSpan={6} className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{rubroName}</span>
                          <span className="text-[10px] font-bold text-slate-400">({items.length} cursos)</span>
                        </div>
                      </td>
                    </tr>
                    {items.map(curso => <CursoRow key={curso.id} curso={curso} onEdit={setSelectedCurso} onOpenDialog={setIsDialogOpen} onDelete={setCursoToDelete} onOpenConfirm={setIsConfirmOpen} />)}
                  </React.Fragment>
                ))
              ) : (
                cursos.map(curso => <CursoRow key={curso.id} curso={curso} onEdit={setSelectedCurso} onOpenDialog={setIsDialogOpen} onDelete={setCursoToDelete} onOpenConfirm={setIsConfirmOpen} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!groupByRubro && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <Pagination 
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={(p) => updateFilters({ page: p })}
              onPageSizeChange={(size) => updateFilters({ pageSize: size, page: 1 })}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={selectedCurso ? "Editar Curso" : "Nuevo Curso"} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase">Nombre del Curso</label>
              <input name="nombre" defaultValue={selectedCurso?.nombre} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Año Académico</label>
              <input type="number" name="anioAcademico" defaultValue={selectedCurso?.anioAcademico || 2026} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Costo ($)</label>
              <input type="number" step="0.01" name="costo" defaultValue={Number(selectedCurso?.costo || 0)} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Rubro</label>
              <select 
                name="rubroId" 
                defaultValue={selectedCurso?.rubroId} 
                onChange={(e) => setFormRubroId(Number(e.target.value))}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none appearance-none cursor-pointer"
              >
                <option value="">Seleccione un rubro</option>
                {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Servicio</label>
              <select name="servicioId" defaultValue={selectedCurso?.servicioId} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none appearance-none cursor-pointer">
                <option value="">Seleccione un servicio</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Cantidad de Cuotas</label>
              <input type="number" name="cantidadCuotas" defaultValue={selectedCurso?.cantidadCuotas || 1} min={1} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Fecha Inicio</label>
              <input type="date" name="fechaInicio" defaultValue={selectedCurso?.fechaInicio ? new Date(selectedCurso.fechaInicio).toISOString().split('T')[0] : ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Fecha Fin</label>
              <input type="date" name="fechaFin" defaultValue={selectedCurso?.fechaFin ? new Date(selectedCurso.fechaFin).toISOString().split('T')[0] : ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={() => setIsDialogOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Guardar Cambios</button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Confirmar Eliminación" description="¿Estás seguro de que deseas eliminar este curso? Esta acción es irreversible." variant="danger" />
    </div>
  );
}

function CursoRow({ curso, onEdit, onOpenDialog, onDelete, onOpenConfirm }: any) {
  return (
    <tr className="group hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{curso.nombre}</div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          ID Legacy: {curso.legacyId || 'N/A'} • {curso.anioAcademico} • {curso.cantidadCuotas} Cuotas
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{curso.rubro?.nombre}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-medium text-slate-500">{curso.servicio?.nombre}</span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center gap-0.5">
          <Calendar className="w-3 h-3 text-slate-300" />
          <span className="text-[10px] font-black text-slate-600 uppercase">
            {curso.fechaInicio ? new Date(curso.fechaInicio).toLocaleDateString() : '-'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="font-black text-slate-900 tracking-tight">$ {Number(curso.costo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => { onEdit(curso); onOpenDialog(true); }}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { onDelete(curso); onOpenConfirm(true); }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
