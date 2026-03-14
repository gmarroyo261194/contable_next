"use client";

import React from "react";
import { Plus, Coins, ArrowLeft } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { MonedaForm } from "@/components/settings/MonedaForm";
import { MonedaList } from "@/components/settings/MonedaList";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MonedaClientProps {
  initialMonedas: any[];
}

export function MonedaClient({ initialMonedas }: MonedaClientProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingMoneda, setEditingMoneda] = React.useState<any>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingMoneda(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (moneda: any) => {
    setEditingMoneda(moneda);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/settings"
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
          >
            <ArrowLeft className="size-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-display">Monedas</h2>
            <p className="text-slate-500 text-sm">Gestiona las monedas disponibles para tu contabilidad</p>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
        >
          <Plus className="w-4 h-4" />
          Nueva Moneda
        </button>
      </header>

      <div className="bg-slate-100/50 rounded-3xl p-6 border border-slate-200/60">
        <MonedaList 
          monedas={initialMonedas} 
          onEdit={handleEdit} 
        />
      </div>

      <Dialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        title={editingMoneda ? "Editar Moneda" : "Nueva Moneda"}
      >
        <MonedaForm 
          initialData={editingMoneda} 
          onClose={() => setIsDialogOpen(false)}
          onSuccess={handleSuccess}
        />
      </Dialog>
    </div>
  );
}
