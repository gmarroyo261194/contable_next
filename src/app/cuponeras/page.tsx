'use client';

import React, { useState, useEffect } from 'react';
import { 
  getCuponerasByCurso, 
  CuponeraLegacy 
} from '@/lib/actions/cuponeras-actions';
import { getCursos } from '@/lib/actions/curso-actions';
import { getAlumnoById, upsertAlumno } from '@/lib/actions/alumno-actions';
import { 
  BookOpen, 
  AlertCircle 
} from "lucide-react";
import { DataGrid } from '@/components/ui/DataGrid';
import { Dialog } from '@/components/Dialog';
import { toast } from 'sonner';
import { cuponeraGridConfig } from '@/lib/configs/cuponeras.config';

interface AlumnoLocal {
  id: number;
  documento: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  celular?: string;
  fechaNacimiento?: string;
  sexo?: string;
}

interface FlattenedCuota extends CuotaLegacy {
  id: number;
  id_personaf: number;
  nombre: string;
  apellido: string;
  nombre_persona: string;
  numfactura: number;
  id_factura: number;
  alumno_local?: AlumnoLocal;
  nrodoc: string;
}

interface Curso {
  id: number;
  nombre: string;
  anioAcademico: number;
  legacyId: number | null;
}

/**
 * Página de visualización de Cuponeras Legacy.
 * Permite filtrar por curso y ver el detalle de pagos y cuotas.
 */
export default function CuponerasPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [cuponeras, setCuponeras] = useState<CuponeraLegacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAlumnoDialogOpen, setIsAlumnoDialogOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<AlumnoLocal | null>(null);
  const [savingAlumno, setSavingAlumno] = useState(false);

  useEffect(() => {
    async function loadCursos() {
      try {
        const response = await getCursos({ pageSize: 'all' });
        // Solo cursos que tienen legacyId para poder consultar la base legacy
        setCursos(response.data.filter(c => c.legacyId !== null));
      } catch {
        console.error("Error al cargar cursos");
      }
    }
    loadCursos();
  }, []);

  const handleCursoChange = async (id: string) => {
    setSelectedCurso(id);
    setLoading(true);
    setError(null);
    try {
      const curso = cursos.find(c => c.id.toString() === id);
      if (curso && curso.legacyId) {
        const data = await getCuponerasByCurso(curso.legacyId);
        setCuponeras(data);
      }
    } catch {
      setError("No se pudieron cargar las cuponeras del curso seleccionado.");
      setCuponeras([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowDoubleClick = async (item: FlattenedCuota) => {
    setLoading(true);
    try {
      let alumnoToEdit: AlumnoLocal;

      if (item.alumno_local) {
        // Ya existe localmente, obtener datos completos
        alumnoToEdit = await getAlumnoById(item.alumno_local.id);
      } else {
        // No existe localmente, importarlo desde legacy con el mismo ID de origen
        toast.info(`Importando alumno ${item.nombre_persona} al sistema local...`);
        const newAlumno = await upsertAlumno({
          id: item.id_personaf, // Forzar ID de origen
          documento: item.nrodoc,
          nombre: item.nombre,
          apellido: item.apellido,
        });
        alumnoToEdit = newAlumno;
        toast.success("Alumno importado correctamente.");
        
        // Refrescar cuponeras para actualizar el estado del vínculo en la grilla
        const curso = cursos.find(c => c.id.toString() === selectedCurso);
        if (curso && curso.legacyId) {
          const data = await getCuponerasByCurso(curso.legacyId);
          setCuponeras(data);
        }
      }

      setSelectedAlumno(alumnoToEdit);
      setIsAlumnoDialogOpen(true);
    } catch (error) {
      console.error("Error en importación/carga:", error);
      toast.error("Error al procesar el registro del alumno.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlumno = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingAlumno(true);
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
      toast.success("Alumno actualizado correctamente.");
      setIsAlumnoDialogOpen(false);
      // Opcional: refrescar datos si el nombre cambió
      handleCursoChange(selectedCurso);
    } catch {
      toast.error("Error al guardar los cambios del alumno.");
    } finally {
      setSavingAlumno(false);
    }
  };

  const flattenedData = React.useMemo(() => {
    return cuponeras.flatMap(cup => 
      cup.cuotas.map(cuota => ({
        ...cuota,
        id: cuota.id_cuotas, 
        id_personaf: cup.id_personaf,
        nombre: cup.nombre,
        apellido: cup.apellido,
        nombre_persona: cup.nombre_persona,
        nrodoc: cup.nrodoc,
        numfactura: cup.numfactura,
        id_factura: cup.id_factura,
        alumno_local: cup.alumno 
      }))
    );
  }, [cuponeras]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Cuponeras de Cursos</h2>
        <p className="text-slate-500 font-medium italic">Consulta de estados de pago en sistema legacy</p>
      </header>

      <div className="card bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Seleccionar Curso</span>
          </div>
          
          <select 
            onChange={(e) => handleCursoChange(e.target.value)} 
            value={selectedCurso}
            className="w-full md:w-[400px] p-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
          >
            <option value="">Seleccione un curso...</option>
            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id.toString()}>
                {curso.nombre} ({curso.anioAcademico})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <h4 className="text-red-800 dark:text-red-400 font-bold text-sm">Error</h4>
            <p className="text-red-700 dark:text-red-500 text-sm">{error}</p>
          </div>
        </div>
      )}

      {selectedCurso && (
        <DataGrid 
          config={cuponeraGridConfig}
          data={flattenedData}
          loading={loading}
          searchPlaceholder="Buscar por alumno o factura..."
          title="Listado de Cuotas"
          description="Desglose detallado de vencimientos y pagos legacy"
          onRowDoubleClick={handleRowDoubleClick}
        />
      )}

      {/* Modal de Alumno */}
      <Dialog
        isOpen={isAlumnoDialogOpen}
        onClose={() => setIsAlumnoDialogOpen(false)}
        title="Detalles del Alumno"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveAlumno} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Documento (DNI)</label>
              <input 
                name="documento" 
                defaultValue={selectedAlumno?.documento} 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Apellido</label>
              <input 
                name="apellido" 
                defaultValue={selectedAlumno?.apellido} 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Nombre</label>
              <input 
                name="nombre" 
                defaultValue={selectedAlumno?.nombre} 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase">Email</label>
              <input 
                type="email" 
                name="email" 
                defaultValue={selectedAlumno?.email} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" 
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Celular</label>
              <input 
                name="celular" 
                defaultValue={selectedAlumno?.celular} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" 
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase">Teléfono Fijo</label>
              <input 
                name="telefono" 
                defaultValue={selectedAlumno?.telefono} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => setIsAlumnoDialogOpen(false)} 
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cerrar
            </button>
            <button 
              type="submit" 
              disabled={savingAlumno}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {savingAlumno ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
