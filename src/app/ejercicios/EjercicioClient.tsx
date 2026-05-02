"use client";

import React from "react";
import { Plus, Pencil, Trash2, Calendar, Lock, Unlock } from "lucide-react";
import { DataGrid, GridConfig } from "@/components/ui/DataGrid";
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

  const config: GridConfig<any> = {
    columns: [
      {
        key: "numero",
        header: "Período",
        sortable: true,
        render: (e: any) => (
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
        key: "cerrado",
        header: "Estado",
        sortable: true,
        render: (e: any) => (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${e.cerrado ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {e.cerrado ? <Lock className="size-3" /> : <Unlock className="size-3" />}
            {e.cerrado ? 'Cerrado' : 'Abierto'}
          </span>
        )
      },
      {
        key: "id",
        header: "Asientos",
        render: (e: any) => {
          const count = e._count?.asientos || 0;
          return (
            <span className={`text-xs font-bold ${count > 0 ? 'text-primary' : 'text-slate-400'}`}>
              {count > 0 ? `${count} asientos registrados` : 'Sin asientos'}
            </span>
          );
        }
      },
      { key: "actions", header: "Acciones", className: "text-right" }
    ],
    actions: [
      {
        label: "Estado",
        icon: Unlock, // Default icon, will be overridden by custom logic if needed, but actions don't support dynamic icons yet easily in this simple way, I'll just use what's there
        onClick: handleToggleStatus,
        variant: "info",
        showIf: (e) => e.cerrado
      },
      {
        label: "Estado",
        icon: Lock,
        onClick: handleToggleStatus,
        variant: "danger",
        showIf: (e) => !e.cerrado
      },
      {
        label: "Editar",
        icon: Pencil,
        onClick: handleEdit,
        variant: "info"
      },
      {
        label: "Eliminar",
        icon: Trash2,
        onClick: (e) => handleDelete(e.id),
        variant: "danger"
      }
    ]
  };

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
        config={config}
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
