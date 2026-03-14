"use client";

import React from "react";
import { Plus, Pencil, Trash2, FileSpreadsheet, Search, GitGraph, Tag, AlertCircle } from "lucide-react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { CuentaForm } from "@/components/plan-cuentas/CuentaForm";
import { ImportModal } from "@/components/plan-cuentas/ImportModal";
import { deleteCuenta } from "@/app/plan-cuentas/actions";
import { useRouter } from "next/navigation";

export function PlanCuentasClient({ initialCuentas }: { initialCuentas: any[] }) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [editingCuenta, setEditingCuenta] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const router = useRouter();

  const handleCreate = () => {
    setEditingCuenta(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cuenta: any) => {
    setEditingCuenta(cuenta);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta cuenta?")) {
      try {
        await deleteCuenta(id);
        router.refresh();
      } catch (error: any) {
        alert(error.message || "Error al eliminar la cuenta.");
      }
    }
  };

  const filteredCuentas = initialCuentas.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.codigo.includes(searchTerm)
  );

  const columns = [
    { 
      header: "Código", 
      accessor: (c: any) => (
        <span className={`font-mono text-xs ${c.imputable ? 'text-slate-600' : 'font-black text-slate-900'}`}>
          {c.codigo}
        </span>
      )
    },
    { 
      header: "Nombre / Cuenta", 
      accessor: (c: any) => (
        <div className="flex flex-col">
          <span className={`text-sm ${c.imputable ? 'text-slate-700' : 'font-black text-slate-900'}`}>
            {c.nombre}
          </span>
          {!c.imputable && (
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
              Cuenta de Agrupación
            </span>
          )}
        </div>
      )
    },
    { 
      header: "Tipo", 
      accessor: (c: any) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          c.tipo === 'ACTIVO' ? 'bg-green-50 text-green-600' :
          c.tipo === 'PASIVO' ? 'bg-red-50 text-red-600' :
          c.tipo === 'RESULTADO' ? 'bg-amber-50 text-amber-600' :
          'bg-slate-50 text-slate-600'
        }`}>
          {c.tipo}
        </span>
      )
    },
    { 
      header: "Imputable", 
      accessor: (c: any) => (
        <span className={`text-[10px] font-black uppercase ${c.imputable ? 'text-blue-600' : 'text-slate-300'}`}>
          {c.imputable ? 'Si' : 'No'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Plan de Cuentas</h2>
          <p className="text-slate-500 text-sm">Gestiona el catálogo de cuentas contables</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 transition-all font-display"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Importar
          </button>
          <button 
            onClick={handleCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
          >
            <Plus className="w-4 h-4" />
            Nueva Cuenta
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <GitGraph className="size-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-slate-400">Total Cuentas</span>
            <span className="text-sm font-bold text-slate-800">{initialCuentas.length}</span>
          </div>
        </div>
      </div>

      {initialCuentas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl text-center px-4">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <AlertCircle className="size-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No hay cuentas registradas</h3>
          <p className="text-slate-500 text-sm max-w-sm mb-8">
            Comienza importando tu plan de cuentas desde un archivo Excel o crea una cuenta manualmente.
          </p>
          <div className="flex gap-4">
            <button onClick={() => setIsImportOpen(true)} className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <FileSpreadsheet className="size-4 text-green-600" />
              Importar de Excel
            </button>
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2 px-8 py-2.5 shadow-lg shadow-primary/20">
              <Plus className="size-4" />
              Crear Manualmente
            </button>
          </div>
        </div>
      ) : (
        <DataGrid
          data={filteredCuentas}
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
      )}

      {/* Form Dialog */}
      <Dialog 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        title={editingCuenta ? "Editar Cuenta" : "Nueva Cuenta Contable"}
      >
        <CuentaForm 
          initialData={editingCuenta} 
          cuentas={initialCuentas}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>

      {/* Import Dialog */}
      <Dialog 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)}
        title="Importar Plan de Cuentas"
      >
        <ImportModal 
          onClose={() => setIsImportOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>
    </div>
  );
}
