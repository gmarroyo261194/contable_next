"use client";

import React from "react";
import { Plus, Pencil, Trash2, Calendar, Lock, Unlock, CheckCircle2, AlertCircle } from "lucide-react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { EjercicioForm } from "@/components/ejercicios/EjercicioForm";
import { deleteEjercicio, toggleCerrarEjercicio } from "@/app/ejercicios/actions";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function EjercicioClient({ initialEjercicios }: { initialEjercicios: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEjercicio, setEditingEjercicio] = React.useState<any>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingEjercicio(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (ejercicio: any) => {
    setEditingEjercicio(ejercicio);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar este ejercicio?")) {
      try {
        await deleteEjercicio(id);
        router.refresh();
      } catch (error: any) {
        alert(error.message || "Error al eliminar el ejercicio.");
      }
    }
  };

  const handleToggleStatus = async (ejercicio: any) => {
    const accion = ejercicio.cerrado ? "reabrir" : "cerrar";
    if (confirm(`¿Está seguro de que desea ${accion} este ejercicio?`)) {
      try {
        await toggleCerrarEjercicio(ejercicio.id, !ejercicio.cerrado);
        router.refresh();
      } catch (error: any) {
        alert("Error al cambiar el estado del ejercicio.");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const normalized = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return format(normalized, "dd MMM yyyy", { locale: es });
  };

  const columns = [
    {
      header: "Período",
      accessor: "numero",
      cell: (e: any) => (
        <div className="flex items-center gap-3">
          <div className={`size-8 rounded-lg flex items-center justify-center ${e.cerrado ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600'}`}>
            <Calendar className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">
              Ejercicio {e.numero}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
              {formatDate(e.inicio)} - {formatDate(e.fin)}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Estado",
      accessor: "cerrado",
      cell: (e: any) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${e.cerrado ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
          {e.cerrado ? <Lock className="size-3" /> : <Unlock className="size-3" />}
          {e.cerrado ? 'Cerrado' : 'Abierto'}
        </span>
      )
    },
    {
      header: "Asientos",
      cell: (e: any) => (
        <span className="text-xs font-semibold text-slate-500">
          Sin asientos registrados
        </span>
      )
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Ejercicios Contables</h2>
          <p className="text-slate-500 text-sm">Gestiona los períodos fiscales de tu empresa</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
        >
          <Plus className="w-4 h-4" />
          Abrir Nuevo Ejercicio
        </button>
      </header>

      <DataGrid
        data={initialEjercicios}
        columns={columns}
        actions={(item) => (
          <>
            <button
              onClick={() => handleToggleStatus(item)}
              title={item.cerrado ? "Reabrir ejercicio" : "Cerrar ejercicio"}
              className={`p-2 rounded-lg transition-colors ${item.cerrado
                ? 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                }`}
            >
              {item.cerrado ? <Unlock className="size-4" /> : <Lock className="size-4" />}
            </button>
            <button
              onClick={() => handleEdit(item)}
              className="p-2 text-primary rounded-lg"
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingEjercicio ? "Editar Ejercicio" : "Crear Nuevo Ejercicio"}
      >
        <EjercicioForm
          initialData={editingEjercicio}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>
    </div>
  );
}
