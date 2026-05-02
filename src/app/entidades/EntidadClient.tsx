"use client";

import React from "react";
import { Plus, FileSpreadsheet } from "lucide-react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { EntidadForm } from "@/components/entidades/EntidadForm";
import { ImportDocentesModal } from "@/components/entidades/ImportDocentesModal";
import { deleteEntidad } from "@/app/entidades/actions";
import { useRouter } from "next/navigation";
import { entidadGridConfig } from "@/lib/configs/entidades.config";
import { toast } from "sonner";

export function EntidadClient({ 
  initialEntidades, 
  tipos, 
  cuentas,
  title = "Clientes y Proveedores",
  description,
  hideEmpresa = false
}: { 
  initialEntidades: any[], 
  tipos: any[], 
  cuentas: any[],
  title?: string,
  description?: string,
  hideEmpresa?: boolean
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [editingEntidad, setEditingEntidad] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
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
        toast.success("Entidad eliminada");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Error al eliminar la entidad.");
      }
    }
  };

  const config = entidadGridConfig(handleEdit, handleDelete, { hideEmpresa });

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
          {description && <p className="text-slate-500 font-medium italic">{description}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            Importar Docentes
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </header>

      <DataGrid
        config={config}
        data={initialEntidades}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, CUIT, DNI..."
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingEntidad ? "Editar Entidad" : "Nueva Entidad"}
      >
        <EntidadForm
          initialData={editingEntidad}
          tipos={tipos}
          cuentas={cuentas}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>

      <Dialog
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importar Docentes (Excel)"
      >
        <ImportDocentesModal
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>
    </div>
  );
}
