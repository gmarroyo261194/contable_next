"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Zap,
  Trash2,
  CheckCircle,
  RotateCcw,
  BookUser,
} from "lucide-react";
import {
  getCuotasByInscripcion,
  emitirCuotas,
  pagarCuota,
  revertirPagoCuota,
  eliminarCuotas,
  updateCuota,
} from "@/lib/actions/cuota-actions";
import { getInscripcionById } from "@/lib/actions/inscripcion-actions";
import { toast } from "sonner";
import { Dialog } from "@/components/Dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataGrid } from "@/components/ui/DataGrid";
import { cuotaGridConfig } from "@/lib/configs/cuotas.config";

/**
 * Página de cuotas de una inscripción.
 * Permite emitir cuotas, registrar pagos, revertirlos y editar datos individuales.
 */
export default function CuotasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const inscripcionId = Number(id);

  const [inscripcion, setInscripcion] = useState<any>(null);
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de diálogos
  const [isEmitirOpen, setIsEmitirOpen] = useState(false);
  const [isConfirmEliminar, setIsConfirmEliminar] = useState(false);
  const [isPagarOpen, setIsPagarOpen] = useState(false);
  const [isRevertirOpen, setIsRevertirOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [insc, cuotasData] = await Promise.all([
        getInscripcionById(inscripcionId),
        getCuotasByInscripcion(inscripcionId),
      ]);
      setInscripcion(insc);
      setCuotas(cuotasData);
    } catch {
      toast.error("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [inscripcionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ——— Emitir cuotas ———
  const handleEmitir = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fechaInicio = fd.get("fechaInicio") as string;
    const importeInput = fd.get("importe") as string;
    const importeOverride = importeInput ? Number(importeInput) : undefined;

    try {
      const result = await emitirCuotas({
        inscripcionId,
        fechaInicio,
        importeOverride,
      });
      toast.success(`${result.count} cuota(s) emitidas correctamente`);
      setIsEmitirOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Error al emitir cuotas.");
    }
  };

  // ——— Eliminar cuotas ———
  const handleEliminarCuotas = async () => {
    try {
      await eliminarCuotas(inscripcionId);
      toast.success("Cuotas eliminadas");
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar cuotas.");
    } finally {
      setIsConfirmEliminar(false);
    }
  };

  // ——— Pagar cuota ———
  const handlePagar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fechaPago = fd.get("fechaPago") as string;
    try {
      await pagarCuota(selectedCuota.id, fechaPago);
      toast.success(`Cuota N°${selectedCuota.numeroCuota} marcada como pagada`);
      setIsPagarOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Error al registrar pago.");
    }
  };

  // ——— Revertir pago ———
  const handleRevertir = async () => {
    try {
      await revertirPagoCuota(selectedCuota.id);
      toast.success(`Pago de cuota N°${selectedCuota.numeroCuota} revertido`);
      setIsRevertirOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Error al revertir pago.");
    }
  };

  // ——— Editar cuota ———
  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await updateCuota({
        id: selectedCuota.id,
        importe: Number(fd.get("importe")),
        fechaVencimiento: fd.get("fechaVencimiento") as string,
        observaciones: fd.get("observaciones") as string,
      });
      toast.success("Cuota actualizada");
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Error al actualizar cuota.");
    }
  };

  // Estadísticas rápidas
  const totalPagado = cuotas
    .filter((c) => c.estado === "Pagada")
    .reduce((acc, c) => acc + Number(c.importe), 0);
  const totalPendiente = cuotas
    .filter((c) => c.estado !== "Pagada")
    .reduce((acc, c) => acc + Number(c.importe), 0);
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

  const config = cuotaGridConfig(
    (cuota) => { setSelectedCuota(cuota); setIsPagarOpen(true); },
    (cuota) => { setSelectedCuota(cuota); setIsRevertirOpen(true); },
    (cuota) => { setSelectedCuota(cuota); setIsEditOpen(true); }
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <BookUser className="w-7 h-7 text-primary" />
            Cuotas de Inscripción
          </h2>
          {inscripcion && (
            <p className="text-slate-500 font-medium mt-0.5">
              <span className="font-black text-slate-700 dark:text-slate-300">
                {inscripcion.alumno?.apellido}, {inscripcion.alumno?.nombre}
              </span>{" "}
              — {inscripcion.curso?.nombre}{" "}
              <span className="text-xs text-slate-400">
                ({inscripcion.curso?.anioAcademico})
              </span>
            </p>
          )}
        </div>

        {/* Acciones de cuotas */}
        <div className="flex gap-2">
          {cuotas.length === 0 ? (
            <button
              onClick={() => setIsEmitirOpen(true)}
              className="flex items-center gap-2 bg-primary px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              <Zap className="w-4 h-4" />
              Emitir Cuotas
            </button>
          ) : (
            <button
              onClick={() => setIsConfirmEliminar(true)}
              className="flex items-center gap-2 bg-red-500 px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-red-600 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Cuotas
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {cuotas.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total Cuotas
            </p>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {cuotas.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {cuotas.filter((c) => c.estado === "Pagada").length} pagadas
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              Total Cobrado
            </p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {fmt(totalPagado)}
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
              Saldo Pendiente
            </p>
            <p className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">
              {fmt(totalPendiente)}
            </p>
          </div>
        </div>
      )}

      {/* Grid de cuotas */}
      <DataGrid
        config={config}
        data={cuotas}
        loading={loading}
        searchPlaceholder="Filtrar cuotas..."
      />

      {/* ——— Dialogs ——— */}

      {/* Emitir cuotas */}
      <Dialog
        isOpen={isEmitirOpen}
        onClose={() => setIsEmitirOpen(false)}
        title="Emitir Cuotas"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEmitir} className="space-y-4 p-4">
          {inscripcion && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
              <p className="font-bold text-slate-700 dark:text-slate-300">
                {inscripcion.curso?.nombre}
              </p>
              <p className="text-slate-500 mt-1">
                Cuotas a generar:{" "}
                <strong>{inscripcion.curso?.cantidadCuotas}</strong> — Costo
                total:{" "}
                <strong>
                  {fmt(Number(inscripcion.curso?.costo))}
                </strong>
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Importe por cuota (auto):{" "}
                <strong>
                  {fmt(
                    Number(inscripcion.curso?.costo) /
                      inscripcion.curso?.cantidadCuotas
                  )}
                </strong>
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-black text-slate-400 uppercase">
              Fecha de vencimiento 1° cuota
            </label>
            <input
              type="date"
              name="fechaInicio"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase">
              Importe por cuota (opcional — sobreescribe el automático)
            </label>
            <input
              type="number"
              step="0.01"
              name="importe"
              placeholder="Dejar vacío para calcular automáticamente"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsEmitirOpen(false)}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Emitir
            </button>
          </div>
        </form>
      </Dialog>

      {/* Confirmar eliminación de cuotas */}
      <ConfirmDialog
        isOpen={isConfirmEliminar}
        onClose={() => setIsConfirmEliminar(false)}
        onConfirm={handleEliminarCuotas}
        title="Eliminar todas las cuotas"
        description="¿Estás seguro? Se eliminarán todas las cuotas pendientes. Las cuotas pagadas bloquean esta acción."
        variant="danger"
      />

      {/* Registrar pago */}
      <Dialog
        isOpen={isPagarOpen}
        onClose={() => setIsPagarOpen(false)}
        title={`Registrar Pago — Cuota N°${selectedCuota?.numeroCuota}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handlePagar} className="space-y-4 p-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Importe:{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {fmt(Number(selectedCuota?.importe))}
              </strong>
            </p>
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase">
              Fecha de Pago
            </label>
            <input
              type="date"
              name="fechaPago"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsPagarOpen(false)}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Confirmar Pago
            </button>
          </div>
        </form>
      </Dialog>

      {/* Revertir pago */}
      <ConfirmDialog
        isOpen={isRevertirOpen}
        onClose={() => setIsRevertirOpen(false)}
        onConfirm={handleRevertir}
        title={`Revertir pago — Cuota N°${selectedCuota?.numeroCuota}`}
        description="¿Estás seguro de revertir este pago? La cuota volverá al estado Pendiente."
        variant="danger"
      />

      {/* Editar cuota */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Editar Cuota N°${selectedCuota?.numeroCuota}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleEdit} className="space-y-4 p-4">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase">
              Importe
            </label>
            <input
              type="number"
              step="0.01"
              name="importe"
              defaultValue={Number(selectedCuota?.importe)}
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              name="fechaVencimiento"
              defaultValue={
                selectedCuota?.fechaVencimiento
                  ? new Date(selectedCuota.fechaVencimiento)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase">
              Observaciones
            </label>
            <input
              name="observaciones"
              defaultValue={selectedCuota?.observaciones || ""}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
            >
              Guardar
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
