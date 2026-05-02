"use client";

import React from "react";
import { Plus, Pencil, Trash2, Tag, ArrowLeft } from "lucide-react";
import { DataGrid, GridConfig } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { TipoEntidadForm } from "@/components/settings/tipos-entidad/TipoEntidadForm";
import { deleteTipoEntidad } from "@/app/settings/tipos-entidad/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function TipoEntidadClient({ initialTipos }: { initialTipos: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTipo, setEditingTipo] = React.useState<any>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingTipo(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (tipo: any) => {
    setEditingTipo(tipo);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar este tipo de entidad?")) {
      try {
        await deleteTipoEntidad(id);
        router.refresh();
      } catch (error: any) {
        alert(error.message || "Error al eliminar el tipo de entidad.");
      }
    }
  };

  const config: GridConfig<any> = {
    columns: [
      { 
        key: "nombre",
        header: "Nombre del Tipo", 
        render: (t: any) => (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Tag className="size-4" />
            </div>
            <span className="font-bold text-slate-800">{t.nombre}</span>
          </div>
        )
      },
      { key: "id", header: "ID", className: "text-slate-400 font-mono text-xs" },
      { key: "actions", header: "Acciones", className: "text-right" }
    ],
    actions: [
      {
        label: "Editar",
        icon: Pencil,
        onClick: handleEdit,
        variant: "info"
      },
      {
        label: "Eliminar",
        icon: Trash2,
        onClick: (t) => handleDelete(t.id),
        variant: "danger"
      }
    ]
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/settings"
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
          >
            <ArrowLeft className="size-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-display">Tipos de Entidades</h2>
            <p className="text-slate-500 text-sm">Gestiona las categorías de tus clientes y proveedores</p>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
        >
          <Plus className="w-4 h-4" />
          Nuevo Tipo
        </button>
      </header>

      <DataGrid
        data={initialTipos}
        config={config}
      />

      <Dialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        title={editingTipo ? "Editar Tipo de Entidad" : "Nuevo Tipo de Entidad"}
      >
        <TipoEntidadForm 
          initialData={editingTipo} 
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>
    </div>
  );
}
