"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Loader2,
  Receipt,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { registrarPagoDocumento } from "@/lib/actions/sync-facturas-actions";
import { toast } from "sonner";
import { AccountSearchDialog } from "@/components/AccountSearchDialog";

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  documento: any; // El documento a pagar
  onSuccess?: () => void;
  cuentas: any[];
}

/**
 * Modal para registrar el cobro/pago de una factura de cliente.
 * Permite ingresar la fecha y el importe cobrado.
 */
export default function RegistrarPagoModal({
  isOpen,
  onClose,
  documento,
  onSuccess,
  cuentas
}: RegistrarPagoModalProps) {
  const [loading, setLoading] = useState(false);
  const [fechaPago, setFechaPago] = useState("");
  const [montoPagado, setMontoPagado] = useState<string>("");
  const [selectedCuenta, setSelectedCuenta] = useState<any | null>(null);
  const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);

  useEffect(() => {
    if (isOpen && documento) {
      if (documento.fechaPago) {
        setFechaPago(new Date(documento.fechaPago).toISOString().split('T')[0]);
      } else {
        setFechaPago(new Date().toISOString().split('T')[0]);
      }
      
      if (documento.montoPagado) {
        setMontoPagado(documento.montoPagado.toString());
      } else {
        setMontoPagado(documento.montoTotal.toString());
      }
    }
  }, [isOpen, documento]);

  if (!isOpen || !documento) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!fechaPago) throw new Error("Debe ingresar la fecha de pago.");
      if (!montoPagado || parseFloat(montoPagado) <= 0) throw new Error("Debe ingresar un monto válido.");
      if (!selectedCuenta) throw new Error("Debe seleccionar una cuenta contable para el cobro.");

      const result = await registrarPagoDocumento(
        documento.id,
        new Date(fechaPago),
        parseFloat(montoPagado),
        selectedCuenta.id
      ) as any;

      if (result.error) throw new Error(result.error);

      toast.success("Pago registrado correctamente");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Registrar Cobro</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <Receipt className="w-3.5 h-3.5" />
                Factura {documento.numero}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100/50">
            {/* Info Item */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-bold">Total Factura</span>
                <span className="text-slate-900 font-black tracking-tight text-lg">
                  $ {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(documento.montoTotal)}
                </span>
            </div>

            <div className="h-px bg-slate-200/50 w-full" />

            {/* Fecha de Pago */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Fecha de Cobro
                </label>
                <input 
                  type="date"
                  required
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 border-b-2 hover:border-slate-300 transition-all"
                />
            </div>

            {/* Importe Cobrado */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    Importe Cobrado
                </label>
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-indigo-500 transition-colors">
                        $
                    </div>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={montoPagado}
                      onChange={(e) => setMontoPagado(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-4 text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 border-b-2 hover:border-slate-300 transition-all placeholder:text-slate-300"
                    />
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">
                    Por defecto se sugiere el total del documento.
                </p>
            </div>

            {/* Cuenta Contable (HABER) */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Search className="w-3 h-3 text-indigo-500" />
                    Cuenta Contable (HABER)
                </label>
                <div className="relative group">
                    <button
                        type="button"
                        onClick={() => setIsAccountSelectorOpen(true)}
                        className={`w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold transition-all border-b-2 hover:border-indigo-300 ${
                            selectedCuenta ? "text-indigo-600 border-indigo-200 bg-indigo-50/10" : "text-slate-400"
                        }`}
                    >
                        {selectedCuenta ? (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-indigo-400 font-black uppercase leading-tight">{selectedCuenta.codigo}</span>
                                <span className="truncate">{selectedCuenta.nombre}</span>
                            </div>
                        ) : (
                            "Seleccione cuenta de cobro (Ej: Caja, Banco...)"
                        )}
                    </button>
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors pointer-events-none" />
                </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 text-sm font-black text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
            >
                CANCELAR
            </button>
            <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                    <CheckCircle2 className="w-4 h-4" />
                    REGISTRAR PAGO
                    </>
                )}
            </button>
          </div>
        </form>
      </div>

      <AccountSearchDialog 
        isOpen={isAccountSelectorOpen}
        onClose={() => setIsAccountSelectorOpen(false)}
        cuentas={cuentas}
        onSelect={(cuenta) => {
            setSelectedCuenta(cuenta);
            setIsAccountSelectorOpen(false);
        }}
      />
    </div>
  );
}
