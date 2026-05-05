import { GridConfig } from "@/components/ui/DataGrid";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Pencil, 
  XCircle, 
  Trash2,
  Loader2
} from "lucide-react";
import React from "react";

export const facturasDocentesGridConfig = (
  handlers: {
    onEdit: (f: any) => void;
    onAutorizar: (id: number) => void;
    onQuitarAutorizacion: (id: number) => void;
    onEliminar: (id: number) => void;
    onViewAsiento: (asientoId: number) => void;
  },
  loadingStates: {
    isAsientoLoading: boolean;
  }
): GridConfig<any> => ({
  features: {
    selection: true,
    sorting: true
  },
  columns: [
    {
      key: "entidad",
      header: "Docente",
      sortable: true,
      render: (f) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            <Users className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{f.entidad.nombre}</span>
            <span className="text-[10px] text-slate-400 font-medium">{f.entidad.cuit || f.entidad.nroDoc}</span>
          </div>
        </div>
      )
    },
    {
      key: "numero",
      header: "Comprobante",
      render: (f) => (
        <div className="font-mono text-xs font-bold text-slate-600">
          {f.puntoVenta}-{f.numero}
        </div>
      )
    },
    {
      key: "fecha",
      header: "Fecha",
      type: "date",
      sortable: true
    },
    {
      key: "periodo",
      header: "Período",
      render: (f) => (
        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase">
          {f.mesHonorarios}/{f.anioHonorarios}
        </span>
      )
    },
    {
      key: "importe",
      header: "Importe",
      type: "currency",
      className: "text-right",
      sortable: true
    },
    {
      key: "estado",
      header: "Estado",
      render: (f) => {
        const isPaid = !!f.asientoPagoId;
        const isAuthorized = f.estado === "Autorizado";

        if (isPaid) {
          return (
            <div className="flex flex-col">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  f.asientoPagoId && handlers.onViewAsiento(f.asientoPagoId);
                }}
                disabled={loadingStates.isAsientoLoading}
                className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase border border-emerald-100 flex items-center gap-1 w-fit hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingStates.isAsientoLoading ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}
                Pagado
              </button>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">Asiento Pago {f.asientoPago?.numero}</span>
            </div>
          );
        }

        if (isAuthorized) {
          return (
            <div className="flex flex-col">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase border border-blue-100 flex items-center gap-1 w-fit">
                <CheckCircle className="size-3" /> Autorizado
              </span>
              {f.fechaHabilitacionPago && (
                <span className="text-[9px] text-blue-500 font-bold mt-0.5">
                  Pago desde: {new Date(f.fechaHabilitacionPago).toLocaleDateString()}
                </span>
              )}
            </div>
          );
        }

        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase border border-amber-100 flex items-center gap-1 w-fit">
            <Clock className="size-3" /> Pendiente Aut.
          </span>
        );
      }
    },
    {
      key: "exigible",
      header: "Exigible",
      className: "text-center",
      render: (f) => {
        const esExigible = f.ejercicioExigibleId !== null && f.ejercicioExigibleId !== undefined;
        const origenNum = f.ejercicio?.numero;
        const destNum = f.ejercicioExigible?.numero;
        if (!esExigible) return <span className="text-slate-300 text-[10px] font-bold">—</span>;
        return (
          <div className="flex flex-col items-center gap-0.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200">
              <span className="text-[10px] font-black uppercase tracking-tighter">Exigible</span>
            </div>
            {origenNum && (
              <span className="text-[9px] font-bold text-slate-400">
                Orig. Ej.{origenNum} → Ej.{destNum ?? "?"}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right"
    }
  ],
  actions: [
    {
      label: "Editar",
      icon: Pencil,
      onClick: handlers.onEdit,
      variant: "info",
      showIf: (f) => !f.asientoPagoId
    },
    {
      label: "Autorizar",
      icon: CheckCircle,
      onClick: (f) => handlers.onAutorizar(f.id),
      variant: "info",
      showIf: (f) => (!f.estado || f.estado === "Autorizacion Pendiente") && !f.asientoPagoId
    },
    {
      label: "Quitar Autorización",
      icon: XCircle,
      onClick: (f) => handlers.onQuitarAutorizacion(f.id),
      variant: "warning",
      showIf: (f) => f.estado === "Autorizado" && !f.asientoPagoId
    },
    {
      label: "Eliminar",
      icon: Trash2,
      onClick: (f) => handlers.onEliminar(f.id),
      variant: "danger",
      showIf: (f) => !f.asientoPagoId
    }
  ]
});
