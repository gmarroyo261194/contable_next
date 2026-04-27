"use client";

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Tags, Hash, Search, X } from 'lucide-react';
import { DataGrid, Column } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertCentroCosto, deleteCentroCosto } from "@/lib/actions/centro-costo-actions";
import { AccountSearchDialog, Account } from "@/components/AccountSearchDialog";

interface CentroCosto {
  id: number;
  nombre: string;
  cuentas: { cuentaId: number }[];
}

export function CentrosCostoClient({ 
  initialCentros, 
  cuentas, 
  empresaId 
}: { 
  initialCentros: CentroCosto[], 
  cuentas: Account[],
  empresaId: number
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSearchingCuenta, setIsSearchingCuenta] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroCosto | null>(null);
  const [formData, setFormData] = useState({ nombre: '', selectedAccountIds: [] as number[] });
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleCreate = () => {
    setEditingCentro(null);
    setFormData({ nombre: '', selectedAccountIds: [] });
    setIsFormOpen(true);
  };

  const handleEdit = (centro: CentroCosto) => {
    setEditingCentro(centro);
    setFormData({ 
      nombre: centro.nombre, 
      selectedAccountIds: centro.cuentas.map(c => c.cuentaId) 
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar este centro de costo?")) {
      try {
        await deleteCentroCosto(id);
        toast.success("Centro de costo eliminado.");
        router.refresh();
      } catch (error: any) {
        toast.error("Error al eliminar.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return toast.error("El nombre es requerido.");
    if (formData.selectedAccountIds.length === 0) return toast.error("Debe seleccionar al menos una cuenta.");

    setLoading(true);
    try {
      await upsertCentroCosto({
        id: editingCentro?.id,
        nombre: formData.nombre,
        cuentaIds: formData.selectedAccountIds
      });
      toast.success(editingCentro ? "Centro actualizado." : "Centro creado.");
      setIsFormOpen(false);
      router.refresh();
    } catch (e) {
      toast.error("Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = (id: number) => {
    setFormData(prev => ({
      ...prev,
      selectedAccountIds: prev.selectedAccountIds.includes(id)
        ? prev.selectedAccountIds.filter(aid => aid !== id)
        : [...prev.selectedAccountIds, id]
    }));
  };

  const columns: Column<CentroCosto>[] = [
    {
      header: "Nombre",
      accessor: "nombre",
      cell: (item: any) => (
        <span className="font-bold text-slate-800">{item.nombre}</span>
      )
    },
    {
      header: "Empresa",
      cell: (item: any) => (
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter truncate max-w-[150px]">
          {item.empresa?.nombreFantasia || item.empresa?.razonSocial}
        </span>
      )
    },
    {
      header: "Cuentas Asociadas",
      accessor: "cuentas",
      cell: (item: any) => (
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-black">
          {item.cuentas.length} cuentas
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Centros de Costo</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Agrupación de cuentas para reportes consolidados</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary px-8 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
        >
          <Plus className="w-4 h-4" />
          Nuevo Centro
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <DataGrid
          data={initialCentros}
          columns={columns}
          actions={(item) => (
            <>
              <button
                onClick={() => handleEdit(item)}
                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                title="Editar"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        />
      </div>

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCentro ? "Editar Centro de Costo" : "Nuevo Centro de Costo"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 w-[500px] max-w-full">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nombre del Centro</label>
            <input
              type="text"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-hidden font-bold text-slate-700"
              placeholder="Ej: Administración, Producción..."
              value={formData.nombre}
              onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Cuentas Seleccionadas</label>
              <button
                type="button"
                onClick={() => setIsSearchingCuenta(true)}
                className="text-xs font-black text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="size-3" />
                Agregar Cuenta
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[150px] max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
              {formData.selectedAccountIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-slate-400 italic text-sm text-center">
                   No hay cuentas seleccionadas.
                </div>
              ) : (
                formData.selectedAccountIds.map(id => {
                  const cuenta = cuentas.find(c => c.id === id);
                  if (!cuenta) return null;
                  return (
                    <div key={id} className="bg-white border border-slate-100 p-2 rounded-xl flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{cuenta.nombre}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{cuenta.codigo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAccount(id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary px-8 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Centro"}
            </button>
          </div>
        </form>
      </Dialog>

      <AccountSearchDialog
        isOpen={isSearchingCuenta}
        onClose={() => setIsSearchingCuenta(false)}
        onSelect={(cuenta) => toggleAccount(cuenta.id)}
        cuentas={cuentas}
      />
    </div>
  );
}
