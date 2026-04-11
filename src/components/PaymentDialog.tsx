"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/Dialog";
import { motion } from "framer-motion";
import { CreditCard, Calendar, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { getMediosPago, processPaymentDocente } from "@/lib/actions/pago-actions";
import { toast } from "sonner";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedInvoices: any[];
}

export function PaymentDialog({ isOpen, onClose, onSuccess, selectedInvoices }: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [medios, setMedios] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    medioPagoId: "",
    observaciones: ""
  });

  useEffect(() => {
    if (isOpen) {
      loadMedios();
    }
  }, [isOpen]);

  async function loadMedios() {
    const data = await getMediosPago();
    setMedios(data);
    if (data.length > 0) {
      setFormData(prev => ({ ...prev, medioPagoId: data[0].id.toString() }));
    }
  }

  const total = selectedInvoices.reduce((sum, inv) => sum + Number(inv.importe), 0);
  const entidadNombre = selectedInvoices[0]?.entidad?.nombre || "Docente";

  const handleSubmit = async () => {
    if (!formData.medioPagoId) {
      toast.error("Seleccione un medio de pago.");
      return;
    }

    // Validar fecha habilitación vs fecha pago
    const paymentDate = new Date(formData.fecha);
    for (const inv of selectedInvoices) {
      if (inv.fechaHabilitacionPago && paymentDate < new Date(inv.fechaHabilitacionPago)) {
        toast.error(`La fecha de pago no puede ser anterior a la habilitación (${new Date(inv.fechaHabilitacionPago).toLocaleDateString()}) para la factura ${inv.puntoVenta}-${inv.numero}`);
        return;
      }
    }

    setLoading(true);
    try {
      const ids = selectedInvoices.map(inv => inv.id);
      const result = await processPaymentDocente(ids, {
        fecha: formData.fecha,
        medioPagoId: parseInt(formData.medioPagoId),
        observaciones: formData.observaciones
      });

      if ("success" in result) {
        toast.success("Pago procesado correctamente.");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al procesar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Procesar Pago"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Resumen */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
            <span>Beneficiario</span>
            <span>Total a Pagar</span>
          </div>
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <FileText className="size-4" />
              </div>
              <span className="font-bold text-slate-800">{entidadNombre}</span>
            </div>
            <span className="text-2xl font-black text-primary font-display">
              $ {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase">
              {selectedInvoices.length} Comprobante(s) seleccionado(s)
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Fecha de Pago</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="date"
                value={formData.fecha}
                onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 pl-10 pr-4 font-bold text-slate-700 focus:border-primary focus:ring-0 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Medio de Pago</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <select
                value={formData.medioPagoId}
                onChange={e => setFormData({ ...formData, medioPagoId: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2.5 pl-10 pr-4 font-bold text-slate-700 focus:border-primary focus:ring-0 transition-all outline-none appearance-none"
              >
                <option value="">Seleccione...</option>
                {medios.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} {m.cuenta ? `(${m.cuenta.nombre})` : '(Sin cuenta)'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Observaciones (Opcional)</label>
          <textarea
            value={formData.observaciones}
            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-medium text-slate-700 focus:border-primary focus:ring-0 transition-all outline-none min-h-[80px] resize-none"
            placeholder="Detalles adicionales del pago..."
          />
        </div>

        {/* Validaciones visuales */}
        {medios.find(m => m.id.toString() === formData.medioPagoId) && !medios.find(m => m.id.toString() === formData.medioPagoId)?.cuentaId && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-xs font-medium">
            <AlertCircle className="size-4 shrink-0" />
            <span>El medio de pago seleccionado no tiene una cuenta contable asociada. Debe configurarla antes de pagar.</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.medioPagoId}
            className="flex-1 px-6 py-3 bg-primary rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle className="size-4" />
            )}
            Confirmar Pago
          </button>
        </div>
      </div>
    </Dialog>
  );
}
