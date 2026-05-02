"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Rows,
  Layers
} from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getCursos, upsertCurso, deleteCurso } from '@/lib/actions/curso-actions';
import { getRubros } from '@/lib/actions/rubro-actions';
import { getServicios } from '@/lib/actions/servicio-actions';
import { toast } from 'sonner';
import { Dialog } from '@/components/Dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataGrid } from '@/components/ui/DataGrid';
import { cursoGridConfig } from '@/lib/configs/cursos.config';

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
      
      // Añadimos rubroNombre para el agrupamiento interno de DataGrid
      const mappedData = result.data.map((c: any) => ({
        ...c,
        rubroNombre: c.rubro?.nombre || 'Sin Rubro'
      }));

      setCursos(mappedData);
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

  const config = cursoGridConfig(
    (c) => { setSelectedCurso(c); setIsDialogOpen(true); },
    (c) => { setCursoToDelete(c); setIsConfirmOpen(true); },
    groupByRubro
  );

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

      <DataGrid 
        config={config}
        data={cursos}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => updateFilters({ page: p })}
        onPageSizeChange={(s) => updateFilters({ pageSize: s, page: 1 })}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(val) => updateFilters({ search: val, page: 1 })}
        searchPlaceholder="Buscar por curso, rubro o servicio..."
        sortBy={sortBy as any}
        sortOrder={sortOrder}
        onSortChange={(key, dir) => updateFilters({ sortBy: key as string, sortOrder: dir, page: 1 })}
      />

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
