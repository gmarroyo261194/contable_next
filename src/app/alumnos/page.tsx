"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { getAlumnos, upsertAlumno, deleteAlumno } from '@/lib/actions/alumno-actions';
import { toast } from 'sonner';
import { Dialog } from '@/components/Dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataGrid } from '@/components/ui/DataGrid';
import { alumnoGridConfig } from '@/lib/configs/alumnos.config';

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<any>('apellido');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<any>(null);
  const [alumnoToDelete, setAlumnoToDelete] = useState<any>(null);

  const fetchAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAlumnos({ page, pageSize, search, sortBy, sortOrder });
      setAlumnos(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error("Error al cargar alumnos.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchAlumnos();
  }, [fetchAlumnos]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: selectedAlumno?.id,
      documento: formData.get('documento') as string,
      apellido: formData.get('apellido') as string,
      nombre: formData.get('nombre') as string,
      email: formData.get('email') as string,
      telefono: formData.get('telefono') as string,
      celular: formData.get('celular') as string,
      fechaNacimiento: formData.get('fechaNacimiento') as string,
      sexo: formData.get('sexo') as string,
    };

    try {
      await upsertAlumno(data);
      toast.success(selectedAlumno ? "Alumno actualizado" : "Alumno registrado");
      setIsDialogOpen(false);
      fetchAlumnos();
    } catch (error) {
      toast.error("Error al guardar alumno.");
    }
  };

  const handleDelete = async () => {
    if (!alumnoToDelete) return;
    try {
      const result = await deleteAlumno(alumnoToDelete.id);
      if (result.success) {
        toast.success("Alumno eliminado");
        fetchAlumnos();
      } else {
        toast.error(result.error || "No se pudo eliminar");
      }
    } catch (error) {
      toast.error("Error al eliminar.");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const config = alumnoGridConfig(
    (a) => { setSelectedAlumno(a); setIsDialogOpen(true); },
    (a) => { setAlumnoToDelete(a); setIsConfirmOpen(true); }
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Alumnos</h2>
          <p className="text-slate-500 font-medium italic">Base de datos de clientes académicos</p>
        </div>
        <button
          onClick={() => { setSelectedAlumno(null); setIsDialogOpen(true); }}
          className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Alumno
        </button>
      </div>

      <DataGrid 
        config={config}
        data={alumnos}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, apellido, DNI o email..."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(key, dir) => {
          setSortBy(key);
          setSortOrder(dir);
        }}
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedAlumno ? "Editar Alumno" : "Registrar Alumno"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Documento (DNI)</label>
              <input name="documento" defaultValue={selectedAlumno?.documento} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Apellido</label>
              <input name="apellido" defaultValue={selectedAlumno?.apellido} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Nombre</label>
              <input name="nombre" defaultValue={selectedAlumno?.nombre} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase">Email</label>
              <input type="email" name="email" defaultValue={selectedAlumno?.email} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Celular</label>
              <input name="celular" defaultValue={selectedAlumno?.celular} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Teléfono Fijo</label>
              <input name="telefono" defaultValue={selectedAlumno?.telefono} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsDialogOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Guardar Alumno</button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Registro"
        description="¿Estás seguro de eliminar este alumno de la base de datos? Se conservará su historial de inscripciones si existen (bloqueando la eliminación)."
        variant="danger"
      />
    </div>
  );
}
