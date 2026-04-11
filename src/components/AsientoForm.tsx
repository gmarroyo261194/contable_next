"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trash2,
  Plus,
  CheckCircle2,
  X,
  AlertCircle,
  XCircle,
  Search,
  Loader2,
  FileSearch
} from 'lucide-react';
import { createAsiento, updateAsiento, getCuentas } from '@/lib/actions/asiento-actions';
import { AccountSearchDialog } from './AccountSearchDialog';
import { toast } from 'sonner';

interface Account {
  id: number;
  codigo: string;
  codigoCorto: number | null;
  nombre: string;
}

interface Renglon {
  id: string; // temporary client-side id
  cuentaId: number | null;
  codigoDisplay: string;
  cuentaNombre: string;
  leyenda: string;
  debe: number;
  haber: number;
}

interface AsientoFormProps {
  onClose: () => void;
  asientoToEdit?: any;
  onJump?: (id: number) => void;
  readOnly?: boolean;
}

export function AsientoForm({ onClose, asientoToEdit, onJump, readOnly = false }: AsientoFormProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [renglones, setRenglones] = useState<Renglon[]>([
    { id: Math.random().toString(36).substr(2, 9), cuentaId: null, codigoDisplay: '', cuentaNombre: '', leyenda: '', debe: 0, haber: 0 },
    { id: Math.random().toString(36).substr(2, 9), cuentaId: null, codigoDisplay: '', cuentaNombre: '', leyenda: '', debe: 0, haber: 0 }
  ]);
  const [cuentas, setCuentas] = useState<Account[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchRow, setActiveSearchRow] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Load accounts once
  useEffect(() => {
    getCuentas().then(setCuentas);
  }, []);

  // Initialize if editing
  useEffect(() => {
    if (asientoToEdit) {
      setFecha(new Date(asientoToEdit.fecha).toISOString().split('T')[0]);
      setDescripcion(asientoToEdit.descripcion);
      setRenglones(asientoToEdit.renglones.map((r: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        cuentaId: r.cuentaId,
        codigoDisplay: r.cuenta.codigo,
        cuentaNombre: r.cuenta.nombre,
        leyenda: r.leyenda || '',
        debe: r.debe,
        haber: r.haber
      })));
      setTimeout(() => setIsDirty(false), 100);
    }
  }, [asientoToEdit]);

  const totalDebe = renglones.reduce((sum, r) => sum + r.debe, 0);
  const totalHaber = renglones.reduce((sum, r) => sum + r.haber, 0);
  const diferencia = Math.abs(totalDebe - totalHaber);
  const isCuadrado = diferencia < 0.01 && totalDebe > 0;

  const addLine = () => {
    setRenglones([...renglones, {
      id: Math.random().toString(36).substr(2, 9),
      cuentaId: null,
      codigoDisplay: '',
      cuentaNombre: '',
      leyenda: '',
      debe: 0,
      haber: 0
    }]);
  };

  const removeLine = (id: string) => {
    if (renglones.length > 2) {
      setRenglones(renglones.filter(r => r.id !== id));
    }
  };

  const updateRenglon = (id: string, updates: Partial<Renglon>) => {
    setRenglones(renglones.map(r => r.id === id ? { ...r, ...updates } : r));
    setIsDirty(true);
  };

  const handleLookup = (id: string, value: string) => {
    const account = cuentas.find(c =>
      c.codigo === value ||
      c.codigoCorto?.toString() === value
    );

    if (account) {
      updateRenglon(id, {
        cuentaId: account.id,
        codigoDisplay: account.codigo,
        cuentaNombre: account.nombre
      });
    } else {
      if (value) {
        updateRenglon(id, {
          cuentaId: null,
          codigoDisplay: value,
          cuentaNombre: 'CUENTA NO ENCONTRADA'
        });
      }
    }
  };

  const onSelectAccount = (account: Account) => {
    if (activeSearchRow) {
      updateRenglon(activeSearchRow, {
        cuentaId: account.id,
        codigoDisplay: account.codigo,
        cuentaNombre: account.nombre
      });
      setActiveSearchRow(null);
    }
  };

  const handleSubmit = async () => {
    // Filtrar renglones que tienen cuenta seleccionada
    const validRenglones = renglones.filter(r => r.cuentaId !== null);

    if (validRenglones.length < 2) {
      toast.error("El asiento debe tener al menos dos líneas con cuentas válidas.");
      return;
    }

    // Validar balance de las líneas válidas
    const vDebe = validRenglones.reduce((sum, r) => sum + r.debe, 0);
    const vHaber = validRenglones.reduce((sum, r) => sum + r.haber, 0);

    if (Math.abs(vDebe - vHaber) > 0.01) {
      toast.error("El asiento no está balanceado.");
      return;
    }

    if (vDebe === 0) {
      toast.error("El importe total del asiento no puede ser cero.");
      return;
    }

    if (!descripcion) {
      toast.error("Debe ingresar el concepto principal.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      fecha,
      descripcion,
      renglones: validRenglones.map(r => ({
        cuentaId: r.cuentaId!,
        debe: r.debe,
        haber: r.haber,
        leyenda: r.leyenda
      }))
    };

    let result;
    if (asientoToEdit) {
      result = await updateAsiento(asientoToEdit.id, payload);
    } else {
      result = await createAsiento(payload);
    }

    setIsSubmitting(false);

    if ('success' in result && result.success) {
      toast.success(asientoToEdit ? "Asiento actualizado correctamente." : "Asiento registrado correctamente.");
      onClose();
    } else {
      toast.error((result as any).error || "Error desconocido");
    }
  };

  // Keyboard shortcut F7
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F7') {
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'INPUT' && activeElement.getAttribute('data-row-id')) {
          e.preventDefault();
          setActiveSearchRow(activeElement.getAttribute('data-row-id'));
          setIsSearching(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
      {/* Header Section */}
      <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight font-display">
              {readOnly 
                ? `Asiento #${asientoToEdit?.numero.toString().padStart(5, '0')}`
                : asientoToEdit 
                  ? `Editar Asiento #${asientoToEdit.numero.toString().padStart(5, '0')}` 
                  : 'Nuevo Asiento Contable'}
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              {readOnly 
                ? 'Consulta de registro' 
                : asientoToEdit 
                  ? 'Modificación de registro' 
                  : 'Manual Journal Entry'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCloseAttempt}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!readOnly && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {asientoToEdit ? 'Guardar Cambios' : 'Registrar Asiento'}
            </button>
          )}
        </div>
      </header>


      {/* Banners de relación (Anulaciones) */}
      {asientoToEdit?.anulaA && (
        <div className="bg-orange-50 border-b border-orange-100 p-3 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">
              Este asiento es un CONTRA-ASIENTO que anula al Asiento #{asientoToEdit.anulaA.numero.toString().padStart(5, '0')}
            </p>
          </div>
          {onJump && (
            <button
              onClick={() => onJump(asientoToEdit.anulaAId)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase text-orange-600 hover:text-orange-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm"
            >
              Ver Original <FileSearch className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {asientoToEdit?.anulaciones?.length > 0 && (
        <div className="bg-red-50 border-b border-red-100 p-3 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">
              Este asiento ha sido ANULADO por el Asiento #{asientoToEdit.anulaciones[0].numero.toString().padStart(5, '0')}
            </p>
          </div>
          {onJump && (
            <button
              onClick={() => onJump(asientoToEdit.anulaciones[0].id)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-600 hover:text-red-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm"
            >
              Ver Anulación <FileSearch className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <section className="p-2 space-y-2">
          {/* Form Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1" htmlFor="entry_date">Fecha Asiento</label>
              <div className="relative">
                <input
                  className="w-[200px] bg-white border-slate-200 rounded-xl 
                  text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary focus:border-primary outline-hidden p-3 shadow-sm transition-all"
                  id="entry_date"
                  type="date"
                  disabled={readOnly}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1" htmlFor="main_desc">Concepto</label>
              <textarea
                className="w-full bg-white border-slate-200 rounded-xl text-sm font-medium text-slate-600 
                focus:ring-2 focus:ring-primary focus:border-primary outline-hidden p-3 shadow-sm transition-all min-h-[46px] resize-none"
                id="main_desc"
                placeholder="Ej: Pago de alquiler Octubre 2023..."
                disabled={readOnly}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={1}
              ></textarea>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-40">Código</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cuenta</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Leyenda / Comentario</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-44">Débito</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-44">Crédito</th>
                  <th className="px-4 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {renglones.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <input
                        data-row-id={r.id}
                        className="w-full border-none p-0 focus:ring-0 text-sm font-black text-primary placeholder-slate-200 bg-transparent"
                        placeholder="F7 para buscar"
                        type="text"
                        disabled={readOnly}
                        value={r.codigoDisplay}
                        onChange={(e) => updateRenglon(r.id, { codigoDisplay: e.target.value })}
                        onBlur={(e) => handleLookup(r.id, e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${r.cuentaId ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                        {r.cuentaNombre || 'Seleccione cuenta (F7)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        className="w-full border-none p-0 focus:ring-0 text-sm text-slate-500 placeholder-slate-200 bg-transparent font-medium"
                        placeholder="Referencia de línea..."
                        type="text"
                        disabled={readOnly}
                        value={r.leyenda}
                        onChange={(e) => updateRenglon(r.id, { leyenda: e.target.value })}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        className="w-full border-none p-0 focus:ring-0 text-sm text-right text-slate-900 font-black placeholder-slate-100 bg-transparent"
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        disabled={readOnly}
                        value={r.debe || ''}
                        onChange={(e) => updateRenglon(r.id, { debe: parseFloat(e.target.value) || 0, haber: 0 })}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        className="w-full border-none p-0 focus:ring-0 text-sm text-right text-slate-900 font-black placeholder-slate-100 bg-transparent"
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        disabled={readOnly}
                        value={r.haber || ''}
                        onChange={(e) => updateRenglon(r.id, { haber: parseFloat(e.target.value) || 0, debe: 0 })}
                        onKeyDown={(e) => {
                          if (readOnly) return;
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (idx === renglones.length - 1) {
                              // If it's the last line, add a new one with the same legend
                              setRenglones([...renglones, {
                                id: Math.random().toString(36).substr(2, 9),
                                cuentaId: null,
                                codigoDisplay: '',
                                cuentaNombre: '',
                                leyenda: r.leyenda, // Inherit legend
                                debe: 0,
                                haber: 0
                              }]);
                              setIsDirty(true);
                            }
                            // Small delay to allow react to render the new row before focusing
                            setTimeout(() => {
                              const nextRowCode = document.querySelector(`tr:nth-child(${idx + 2}) input[data-row-id]`) as HTMLInputElement;
                              nextRowCode?.focus();
                            }, 50);
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-4">
                      {!readOnly && (
                        <button
                          onClick={() => removeLine(r.id)}
                          className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!readOnly && (
              <div className="p-4 bg-slate-50/30 flex justify-between items-center">
                <button
                  onClick={addLine}
                  className="flex items-center gap-2 text-primary hover:text-blue-700 text-xs font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4" />
                  Añadir Línea
                </button>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Enter en Monto para nueva fila • F7 para búsqueda avanzada</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer / Balance Compacto */}
      <footer className="bg-slate-50 p-4 border-t border-slate-200">
        <div className="flex flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
          {/* Info de Estado */}
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${isCuadrado ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600 animate-pulse'}`}>
              {isCuadrado ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div>
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${isCuadrado ? 'text-green-700' : 'text-red-700'}`}>
                {isCuadrado ? 'Asiento Cuadrado' : 'Asiento Desbalanceado'}
              </h4>
              {!isCuadrado && (
                <p className="text-red-500 text-[10px] font-bold">
                  Diferencia: $ {diferencia.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          {/* Totales Horizontales */}
          <div className="flex items-center gap-8 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Débito</span>
              <span className="text-sm font-black text-slate-700">$ {totalDebe.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Crédito</span>
              <span className="text-sm font-black text-slate-700">$ {totalHaber.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance</span>
              <span className={`text-base font-black ${isCuadrado ? 'text-green-600' : 'text-slate-900'}`}>$ {diferencia.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </footer>
      {/* Search Dialog */}
      <AccountSearchDialog
        isOpen={isSearching}
        onClose={() => {
          setIsSearching(false);
          setActiveSearchRow(null);
        }}
        onSelect={onSelectAccount}
        cuentas={cuentas}
      />

      {/* Custom Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-orange-500">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-800">¿Cerrar sin guardar?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Tienes cambios sin registrar en este asiento. Si sales ahora, se perderán permanentemente.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
              >
                SÍ, SALIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
