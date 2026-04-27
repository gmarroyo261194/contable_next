"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, CreditCard, Loader2, AlertCircle, CheckCircle, Search, Pencil, Check, X } from "lucide-react";
import { getMediosPago, createMedioPago, deleteMedioPago, updateMedioPagoAccount, updateMedioPagoName } from "@/lib/actions/pago-actions";
import { getCuentas } from "@/lib/actions/asiento-actions";
import { AccountSearchDialog, Account } from "./AccountSearchDialog";
import { toast } from "sonner";

export function MediosPagoManager() {
  const [loading, setLoading] = useState(true);
  const [medios, setMedios] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<Account[]>([]);
  const [newMedioNombre, setNewMedioNombre] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMedioId, setActiveMedioId] = useState<number | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([getMediosPago(), getCuentas("1101")]);
      setMedios(m);
      setCuentas(c as Account[]);
    } catch (error) {
      toast.error("Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async () => {
    if (!newMedioNombre.trim()) return;
    setIsAdding(true);
    try {
      const res = await createMedioPago(newMedioNombre);
      if ("success" in res) {
        toast.success("Medio de pago creado.");
        setNewMedioNombre("");
        loadData();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Error al crear.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este medio de pago?")) return;
    try {
      const res = await deleteMedioPago(id);
      if ("success" in res) {
        toast.success("Medio de pago eliminado.");
        loadData();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Error al eliminar.");
    }
  };

  const handleUpdateAccount = async (account: Account) => {
    if (!activeMedioId) return;
    try {
      const res = await updateMedioPagoAccount(activeMedioId, account.id);
      if ("success" in res) {
        toast.success("Cuenta contable asociada.");
        loadData();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Error al actualizar cuenta.");
    } finally {
      setIsSearchOpen(false);
      setActiveMedioId(null);
    }
  };

  const handleStartEdit = (m: any) => {
    setEditingId(m.id);
    setEditNombre(m.nombre);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditNombre("");
  };

  const handleSaveName = async (id: number) => {
    if (!editNombre.trim()) return;
    try {
      const res = await updateMedioPagoName(id, editNombre);
      if ("success" in res) {
        toast.success("Nombre actualizado.");
        setEditingId(null);
        loadData();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Error al guardar nombre.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nuevo Medio de Pago</label>
          <input
            type="text"
            value={newMedioNombre}
            onChange={(e) => setNewMedioNombre(e.target.value)}
            placeholder="Ej: Banco Galicia, Caja Chica..."
            className="w-full bg-white border-2 border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-700 focus:border-primary outline-none transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={isAdding || !newMedioNombre.trim()}
          className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {isAdding ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
        </button>
      </div>

      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
        {medios.map((m) => (
          <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <CreditCard className="size-4" />
                </div>
                
                {editingId === m.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      autoFocus
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="flex-1 bg-slate-50 border-2 border-primary/20 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:border-primary"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName(m.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <button onClick={() => handleSaveName(m.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md">
                      <Check className="size-4" />
                    </button>
                    <button onClick={handleCancelEdit} className="p-1 text-slate-400 hover:bg-slate-50 rounded-md">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{m.nombre}</span>
                    <button 
                      onClick={() => handleStartEdit(m)}
                      className="p-1 text-slate-300 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleDelete(m.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Cuenta Contable Asociada</label>
              <button
                onClick={() => {
                  setActiveMedioId(m.id);
                  setIsSearchOpen(true);
                }}
                className={`w-full flex items-center justify-between border-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all outline-none text-left ${
                  m.cuentaId 
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-700 hover:bg-emerald-50" 
                    : "bg-slate-50 border-slate-100 text-slate-400 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search className="size-3 text-slate-400" />
                  {m.cuenta ? `${m.cuenta.codigo} - ${m.cuenta.nombre}` : "Buscar cuenta para asientos..."}
                </div>
                {m.cuentaId && (
                   <CheckCircle className="size-3 text-emerald-500" />
                )}
              </button>
            </div>
            
            {!m.cuentaId && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 font-bold">
                <AlertCircle className="size-3" />
                Configuración pendiente (Necesaria para asientos)
              </div>
            )}
          </div>
        ))}
      </div>

      <AccountSearchDialog
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setActiveMedioId(null);
        }}
        onSelect={handleUpdateAccount}
        cuentas={cuentas}
      />
    </div>
  );
}
