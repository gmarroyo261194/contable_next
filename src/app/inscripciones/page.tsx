"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  getInscripciones,
  upsertInscripcion,
  deleteInscripcion,
} from "@/lib/actions/inscripcion-actions";
import { getAlumnos } from "@/lib/actions/alumno-actions";
import { getCursos } from "@/lib/actions/curso-actions";
import { toast } from "sonner";
import { Dialog } from "@/components/Dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataGrid } from "@/components/ui/DataGrid";
import { inscripcionGridConfig } from "@/lib/configs/inscripciones.config";

type SortOrder = "asc" | "desc";

/**
 * Página de administración de inscripciones.
 * Permite CRUD de inscripciones y navegar a las cuotas de cada una.
 */
export default function InscripcionesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const sortBy = searchParams.get("sortBy") || "fechaInscripcion";
  const sortOrder = (searchParams.get("sortOrder") as SortOrder) || "desc";
  const searchTerm = searchParams.get("search") || "";

  const [data, setData] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [toDelete, setToDelete] = useState<any>(null);

  const updateFilters = useCallback(
    (newParams: Record<string, string | number | boolean | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "" || value === false) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInscripciones({
        page,
        pageSize,
        search: searchTerm,
        sortBy,
        sortOrder,
      });
      setData(result.data);
      setTotal(result.total);
    } catch {
      toast.error("Error al cargar inscripciones.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getAlumnos({ pageSize: "all", sortBy: "apellido", sortOrder: "asc" }).then(
      (r) => setAlumnos(r.data)
    );
    getCursos({ pageSize: "all" }).then((r) => setCursos(r.data));
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: selected?.id,
      cursoId: Number(fd.get("cursoId")),
      alumnoId: Number(fd.get("alumnoId")),
      fechaInscripcion: fd.get("fechaInscripcion") as string,
      estado: fd.get("estado") as string,
      observaciones: fd.get("observaciones") as string,
    };
    try {
      await upsertInscripcion(payload);
      toast.success(selected ? "Inscripción actualizada" : "Inscripción registrada");
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar.");
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const result = await deleteInscripcion(toDelete.id);
      if ("success" in result && result.success) {
        toast.success("Inscripción eliminada");
        fetchData();
      } else {
        toast.error((result as any).error || "No se pudo eliminar");
      }
    } catch {
      toast.error("Error al eliminar.");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const config = inscripcionGridConfig(
    (item) => {
      setSelected(item);
      setIsDialogOpen(true);
    },
    (item) => {
      setToDelete(item);
      setIsConfirmOpen(true);
    },
    (item) => router.push(`/inscripciones/${item.id}/cuotas`)
  );

  return (
    <div className="p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Gestión de Inscripciones
          </h2>
          <p className="text-slate-500 font-medium italic">
            Administración de alumnos inscriptos en cursos
          </p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Inscripción
        </button>
      </div>

      <DataGrid
        config={config}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => updateFilters({ page: p })}
        onPageSizeChange={(s) => updateFilters({ pageSize: s, page: 1 })}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={(val) => updateFilters({ search: val, page: 1 })}
        searchPlaceholder="Buscar por alumno, DNI o curso..."
        sortBy={sortBy as any}
        sortOrder={sortOrder}
        onSortChange={(key, dir) =>
          updateFilters({ sortBy: key as string, sortOrder: dir, page: 1 })
        }
      />

      {/* Dialog: Crear / Editar */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selected ? "Editar Inscripción" : "Nueva Inscripción"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Alumno */}
            <div className="col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase">
                Alumno
              </label>
              <select
                name="alumnoId"
                defaultValue={selected?.alumnoId}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none appearance-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                <option value="">Seleccione un alumno</option>
                {alumnos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.apellido}, {a.nombre} — DNI {a.documento}
                  </option>
                ))}
              </select>
            </div>

            {/* Curso */}
            <div className="col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase">
                Curso
              </label>
              <select
                name="cursoId"
                defaultValue={selected?.cursoId}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none appearance-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                <option value="">Seleccione un curso</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} — {c.rubro?.nombre} ({c.anioAcademico})
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha Inscripción */}
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">
                Fecha de Inscripción
              </label>
              <input
                type="date"
                name="fechaInscripcion"
                defaultValue={
                  selected?.fechaInscripcion
                    ? new Date(selected.fechaInscripcion)
                        .toISOString()
                        .split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">
                Estado
              </label>
              <select
                name="estado"
                defaultValue={selected?.estado || "Activa"}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none appearance-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                <option value="Activa">Activa</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Baja">Baja</option>
              </select>
            </div>

            {/* Observaciones */}
            <div className="col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                defaultValue={selected?.observaciones || ""}
                rows={2}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Guardar
            </button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Inscripción"
        description="¿Estás seguro? Se eliminarán también las cuotas pendientes asociadas. Las cuotas pagadas bloquearán la eliminación."
        variant="danger"
      />
    </div>
  );
}
