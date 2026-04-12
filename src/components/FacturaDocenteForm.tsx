"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Search,
  User,
  Calendar,
  CircleDollarSign,
  Loader2,
  BookOpen,
  CreditCard,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { getDocentes, createFacturaDocente, updateFacturaDocente } from '@/lib/actions/factura-docente-actions';
import { getCuentas } from '@/lib/actions/asiento-actions';
import { EntitySearchDialog } from './entidades/EntitySearchDialog';
import { AccountSearchDialog } from './AccountSearchDialog';
import { ConfirmDialog } from './ConfirmDialog';

interface FacturaDocenteFormProps {
  onClose: () => void;
  onSuccess: () => void;
  invoice?: any;
}

const MESES = [
  { id: 1, nombre: 'Enero' },
  { id: 2, nombre: 'Febrero' },
  { id: 3, nombre: 'Marzo' },
  { id: 4, nombre: 'Abril' },
  { id: 5, nombre: 'Mayo' },
  { id: 6, nombre: 'Junio' },
  { id: 7, nombre: 'Julio' },
  { id: 8, nombre: 'Agosto' },
  { id: 9, nombre: 'Septiembre' },
  { id: 10, nombre: 'Octubre' },
  { id: 11, nombre: 'Noviembre' },
  { id: 12, nombre: 'Diciembre' },
];

export function FacturaDocenteForm({ onClose, onSuccess, invoice }: FacturaDocenteFormProps) {
  const [loading, setLoading] = useState(false);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);

  const [selectedDocente, setSelectedDocente] = useState<any>(null);
  const [isSearchingDocente, setIsSearchingDocente] = useState(false);

  const [selectedCuenta, setSelectedCuenta] = useState<any>(null);
  const [isSearchingCuenta, setIsSearchingCuenta] = useState(false);

  const [formData, setFormData] = useState({
    puntoVenta: '',
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    importe: '',
    anioHonorarios: new Date().getFullYear(),
    mesHonorarios: new Date().getMonth() + 1,
    observaciones: ''
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    Promise.all([getDocentes(), getCuentas()]).then(([d, c]) => {
      setDocentes(d);
      setCuentas(c);

      if (invoice) {
        setFormData({
          puntoVenta: invoice.puntoVenta,
          numero: invoice.numero,
          fecha: new Date(invoice.fecha).toISOString().split('T')[0],
          importe: invoice.importe.toString(),
          anioHonorarios: invoice.anioHonorarios,
          mesHonorarios: invoice.mesHonorarios,
          observaciones: invoice.observaciones || ''
        });
        setSelectedDocente(invoice.entidad);
        setSelectedCuenta(invoice.cuentaGastos);
      }
    });
  }, [invoice]);

  const handlePadPOS = () => {
    if (formData.puntoVenta) {
      setFormData(prev => ({ ...prev, puntoVenta: prev.puntoVenta.padStart(5, '0') }));
    }
  };

  const handlePadNum = () => {
    if (formData.numero) {
      setFormData(prev => ({ ...prev, numero: prev.numero.padStart(8, '0') }));
    }
  };

  const executeSubmit = async () => {
    setLoading(true);

    const payload = {
      entidadId: selectedDocente.id,
      puntoVenta: formData.puntoVenta,
      numero: formData.numero,
      fecha: formData.fecha,
      importe: Number(formData.importe),
      anioHonorarios: formData.anioHonorarios,
      mesHonorarios: formData.mesHonorarios,
      cuentaGastosId: selectedCuenta.id,
      observaciones: formData.observaciones
    };

    const result = invoice
      ? await updateFacturaDocente(invoice.id, payload)
      : await createFacturaDocente(payload);

    setLoading(false);
    if (result.success) {
      toast.success(invoice ? "Factura actualizada." : "Factura registrada correctamente.");
      onSuccess();
      onClose();
    } else {
      toast.error(result.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDocente) return toast.error("Debe seleccionar un docente.");
    if (!selectedCuenta) return toast.error("Debe seleccionar una cuenta de gastos.");
    if (!formData.puntoVenta || !formData.numero) return toast.error("Punto de venta y número son obligatorios.");
    if (Number(formData.importe) <= 0) return toast.error("El importe debe ser mayor a cero.");

    if (invoice && invoice.asientoPagoId && selectedCuenta.id !== invoice.cuentaGastosId) {
      setShowConfirmDialog(true);
      return;
    }

    await executeSubmit();
  };

  return (
    <div className="w-full">
      <header className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight font-display">
            {invoice ? "Editar Factura Docente" : "Nueva Factura Docente"}
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            {invoice ? `Editando Comprobante ${invoice.puntoVenta}-${invoice.numero}` : "Carga manual de honorarios"}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
          <X className="w-6 h-6" />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-8 pt-6">
        <div className={`flex flex-col lg:flex-row gap-8 ${invoice?.gestionPago ? 'items-start' : ''}`}>
          {/* Main Form Content */}
          <div className="flex-1 space-y-5">
            {/* Docente Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Docente / Beneficiario</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchingDocente(true)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-left hover:border-primary/30 transition-all shadow-sm flex items-center justify-between"
                >
                  <span className={selectedDocente ? "text-slate-900 font-bold" : "text-slate-400"}>
                    {selectedDocente ? selectedDocente.nombre : "Seleccionar docente..."}
                  </span>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
                    <Search className="w-3 h-3 text-slate-400" />
                  </div>
                </button>
                {selectedDocente && (
                  <div className="mt-1 flex gap-2 ml-1 text-[10px] text-slate-400 font-medium">
                    <span>DNI: {selectedDocente.nroDoc || '-'}</span>
                    <span>CUIT: {selectedDocente.cuit || '-'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Numero Factura */}
              <div className="col-span-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Punto de Venta (5 dígs)</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-hidden transition-all shadow-sm font-mono tracking-widest"
                  placeholder="00001"
                  value={formData.puntoVenta || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setFormData(prev => ({ ...prev, puntoVenta: val }));
                  }}
                  onBlur={handlePadPOS}
                />
              </div>
              <div className="col-span-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número (8 dígs)</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-hidden transition-all shadow-sm font-mono tracking-widest"
                  placeholder="00000001"
                  value={formData.numero || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setFormData(prev => ({ ...prev, numero: val }));
                  }}
                  onBlur={handlePadNum}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Emisión</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-hidden transition-all shadow-sm"
                    value={formData.fecha || ''}
                    onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importe Total</label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    disabled={invoice?.asientoPagoId}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-hidden transition-all shadow-sm font-bold text-slate-800 disabled:opacity-60 disabled:bg-slate-100"
                    placeholder="0.00"
                    value={formData.importe || ''}
                    onChange={e => setFormData(prev => ({ ...prev, importe: e.target.value }))}
                  />
                </div>
                {invoice?.asientoPagoId && (
                  <p className="text-[9px] text-amber-600 font-bold uppercase ml-1 mt-1">
                    No se puede modificar importe (Ya pagado)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mes Honorarios</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-hidden transition-all shadow-sm appearance-none cursor-pointer"
                  value={formData.mesHonorarios}
                  onChange={e => setFormData(prev => ({ ...prev, mesHonorarios: parseInt(e.target.value) }))}
                >
                  {MESES.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Año Honorarios</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-hidden transition-all shadow-sm font-medium"
                  value={formData.anioHonorarios}
                  onChange={e => setFormData(prev => ({ ...prev, anioHonorarios: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            {/* GL Account Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cuenta de Gastos</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchingCuenta(true)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-left hover:border-primary/30 transition-all shadow-sm flex items-center justify-between"
                >
                  <span className={selectedCuenta ? "text-slate-900 font-bold" : "text-slate-400"}>
                    {selectedCuenta ? `${selectedCuenta.codigo} - ${selectedCuenta.nombre}` : "Seleccionar cuenta contable..."}
                  </span>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
                    <Search className="w-3 h-3 text-slate-400" />
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones / Detalle</label>
              <textarea
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-hidden transition-all shadow-sm resize-none"
                placeholder="Información adicional relevante..."
                value={formData.observaciones || ''}
                onChange={e => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={loading}
                className="flex-[2] bg-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                {invoice ? "Guardar Cambios" : "Registrar Factura"}
              </button>
            </div>
          </div>

          {/* Payment Sidebar (only for paid invoices) */}
          {invoice?.gestionPago && (
            <div className="w-full lg:w-[320px] bg-emerald-50/50 border border-emerald-100 rounded-[32px] p-8 space-y-6 lg:sticky lg:top-0 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-widest block leading-none">Pago</span>
                  <span className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Confirmado</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5 p-4 bg-white rounded-2xl border border-emerald-100/50 shadow-sm">
                  <label className="text-[9px] font-bold text-emerald-600/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-emerald-500" /> Fecha del Pago
                  </label>
                  <p className="text-lg font-black text-emerald-900 leading-none">
                    {new Date(invoice.gestionPago.fecha).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-1.5 p-4 bg-white rounded-2xl border border-emerald-100/50 shadow-sm">
                  <label className="text-[9px] font-bold text-emerald-600/40 uppercase tracking-widest flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3 text-emerald-500" /> Medio / Instrumento
                  </label>
                  <p className="text-sm font-black text-emerald-900">
                    {invoice.gestionPago.medioPago.nombre}
                  </p>
                </div>

                <div className="space-y-1.5 p-4 bg-white rounded-2xl border border-emerald-100/50 shadow-sm">
                  <label className="text-[9px] font-bold text-emerald-600/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-emerald-500" /> Origen de Fondos
                  </label>
                  <p className="text-sm font-black text-emerald-900">
                    {invoice.gestionPago.medioPago.cuenta?.nombre}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-500/60 font-mono tracking-tighter">
                    {invoice.gestionPago.medioPago.cuenta?.codigo}
                  </p>
                </div>

                <div className="pt-4 border-t border-emerald-100/50">
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">ID Gestión</span>
                    <span className="font-mono text-xs font-bold bg-emerald-100 px-2 py-0.5 rounded-lg">#{invoice.gestionPagoId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Dialogs */}
      <EntitySearchDialog
        isOpen={isSearchingDocente}
        onClose={() => setIsSearchingDocente(false)}
        entities={docentes}
        onSelect={setSelectedDocente}
      />

      <AccountSearchDialog
        isOpen={isSearchingCuenta}
        onClose={() => setIsSearchingCuenta(false)}
        cuentas={cuentas}
        onSelect={setSelectedCuenta}
      />

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={executeSubmit}
        title="Cambio de Imputación"
        description="Esta factura ya ha sido pagada. Al cambiar la cuenta de gastos, se modificará también el asiento contable del pago. ¿Desea continuar?"
        confirmText="Sí, continuar"
        cancelText="No, cancelar"
        variant="warning"
      />
    </div>
  );
}
