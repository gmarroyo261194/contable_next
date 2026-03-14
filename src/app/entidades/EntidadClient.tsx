"use client";

import React from "react";
import { Plus, Pencil, Trash2, Users, UserCheck, Building2, User } from "lucide-react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { EntidadForm } from "@/components/entidades/EntidadForm";
import { deleteEntidad } from "@/app/entidades/actions";
import { useRouter } from "next/navigation";

export function EntidadClient({ initialEntidades, tipos }: { initialEntidades: any[], tipos: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEntidad, setEditingEntidad] = React.useState<any>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingEntidad(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (entidad: any) => {
    setEditingEntidad(entidad);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta entidad?")) {
      try {
        await deleteEntidad(id);
        router.refresh();
      } catch (error: any) {
        alert(error.message || "Error al eliminar la entidad.");
      }
    }
  };

  const columns = [
    {
      header: "Nombre / Razón Social",
      accessor: (e: any) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            {e.tipo?.nombre === 'CLIENTE' ? <UserCheck className="size-4" /> :
              e.tipo?.nombre === 'PROVEEDOR' ? <Building2 className="size-4" /> :
                <User className="size-4" />}
          </div>
          <span className="font-bold text-slate-800">{e.nombre}</span>
        </div>
      )
    },
    { header: "CUIT / CUIL", accessor: "cuit", className: "font-mono text-xs" },
    {
      header: "Tipo",
      accessor: (e: any) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${e.tipo?.nombre === 'CLIENTE' ? 'bg-blue-50 text-blue-600' :
          e.tipo?.nombre === 'PROVEEDOR' ? 'bg-orange-50 text-orange-600' :
            'bg-purple-50 text-purple-600'
          }`}>
          {e.tipo?.nombre || 'S/D'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Clientes y Proveedores</h2>
          {/* <p className="text-slate-500 text-sm">Gestiona tus clientes y proveedores</p> */}
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </header>

      <DataGrid
        data={initialEntidades}
        columns={columns}
        actions={(item) => (
          <>
            <button
              onClick={() => handleEdit(item)}
              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
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
        title={editingEntidad ? "Editar Entidad" : "Nueva Entidad"}
      >
        <EntidadForm
          initialData={editingEntidad}
          tipos={tipos}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>
    </div>
  );
}
