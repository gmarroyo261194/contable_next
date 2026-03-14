"use client";

import React from "react";
import { Plus, Building2 } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { EmpresaForm } from "@/components/empresas/EmpresaForm";
import { EmpresaList } from "@/components/empresas/EmpresaList";
import { useRouter } from "next/navigation";

interface EmpresaClientProps {
  initialEmpresas: any[];
  monedas: any[];
}

export function EmpresaClient({ initialEmpresas, monedas }: EmpresaClientProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEmpresa, setEditingEmpresa] = React.useState<any>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingEmpresa(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (empresa: any) => {
    setEditingEmpresa(empresa);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Empresas</h2>
          <p className="text-slate-500 text-sm">Gestiona tus entidades contables y configuraciones</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </button>
      </header>

      <div className="bg-slate-100/50 rounded-3xl p-6 border border-slate-200/60">
        <EmpresaList 
          empresas={initialEmpresas} 
          onEdit={handleEdit} 
        />
      </div>

      <Dialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        title={editingEmpresa ? "Editar Empresa" : "Nueva Empresa"}
      >
        <EmpresaForm 
          initialData={editingEmpresa} 
          monedas={monedas}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={handleSuccess}
        />
      </Dialog>
    </div>
  );
}
