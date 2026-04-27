"use client";

import React from "react";
import { Plus, Pencil, Trash2, Users, UserCheck, Building2, User, FileSpreadsheet } from "lucide-react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { EntidadForm } from "@/components/entidades/EntidadForm";
import { ImportDocentesModal } from "@/components/entidades/ImportDocentesModal";
import { deleteEntidad } from "@/app/entidades/actions";
import { useRouter } from "next/navigation";

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
      accessor: "nombre",
      cell: (e: any) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            {e.tipo?.nombre === 'CLIENTE' ? <UserCheck className="size-4" /> :
              e.tipo?.nombre === 'PROVEEDOR' ? <Building2 className="size-4" /> :
                e.tipo?.nombre === 'DOCENTE' ? <Users className="size-4" /> :
                <User className="size-4" />}
          </div>
          <span className="font-bold text-slate-800">{e.nombre}</span>
        </div>
      )
    },
    ...(!hideEmpresa ? [{
      header: "Empresa",
      cell: (e: any) => (
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter truncate max-w-[150px]">
          {e.empresa?.nombreFantasia || e.empresa?.razonSocial}
        </span>
      )
    }] : []),
    { header: "CUIT / CUIL", accessor: "cuit", className: "font-mono text-xs" },
    { header: "DNI", accessor: "nroDoc", className: "font-mono text-xs" },
    {
      header: "Tipo",
      cell: (e: any) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${e.tipo?.nombre === 'CLIENTE' ? 'bg-blue-50 text-blue-600' :
          e.tipo?.nombre === 'PROVEEDOR' ? 'bg-orange-50 text-orange-600' :
          e.tipo?.nombre === 'DOCENTE' ? 'bg-emerald-50 text-emerald-600' :
            'bg-purple-50 text-purple-600'
          }`}>
          {e.tipo?.nombre || 'S/D'}
        </span>
      )
    },
    {
      header: "Cuenta Contable",
      cell: (e: any) => (
        <span className="text-xs font-bold text-slate-500">
          {e.cuentaContable ? (
            <div className="flex flex-col">
              <span className="text-slate-700">{e.cuentaContable.nombre}</span>
              <span className="text-[10px] text-slate-400 font-mono">{e.cuentaContable.codigo}</span>
            </div>
          ) : (
            <span className="italic text-slate-300">No asignada</span>
          )}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">{title}</h2>
          {description && <p className="text-slate-500 text-sm">{description}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all font-display shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            Importar Docentes
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
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
