import { GridConfig } from "@/components/ui/DataGrid";
import { format } from "date-fns";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Edit, 
  X, 
  Trash2, 
  ExternalLink 
} from "lucide-react";

export const docProvGridConfig = (
  handlers: {
    onEdit: (doc: any) => void;
    onAnular: (id: number) => void;
    onDelete: (id: number) => void;
    onAutorizar: (doc: any) => void;
    onPagar: (doc: any) => void;
  },
  state: {
    isContabilidadEnabled: boolean;
  }
): GridConfig<any> => ({
  columns: [
    {
      key: "fecha",
      header: "Fecha",
      sortable: true,
      render: (doc) => (
        <div>
          <div className="text-slate-700 font-bold text-sm">
            {format(new Date(doc.fecha), 'dd/MM/yyyy')}
          </div>
          {doc.vencimiento && (
            <div className="text-[10px] text-rose-500 font-black uppercase mt-0.5">
              Vence {format(new Date(doc.vencimiento), 'dd/MM/yyyy')}
            </div>
          )}
        </div>
      )
    },
    {
      key: "numero",
      header: "Comprobante",
      render: (doc) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900 tracking-tight">
            {doc.tipo} {doc.letra} {doc.numero}
          </span>
          {doc.cai && (
            <span className="text-[9px] text-slate-400 font-mono">CAI: {doc.cai}</span>
          )}
        </div>
      )
    },
    {
      key: "entidad",
      header: "Proveedor",
      sortable: true,
      render: (doc) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm truncate max-w-[250px]">
            {doc.entidad?.nombre}
          </span>
          <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">
            {doc.ejercicio?.empresa?.nombreFantasia}
          </span>
        </div>
      )
    },
    {
      key: "detalle",
      header: "Detalle",
      render: (doc) => (
        <p className="text-xs text-slate-500 font-medium line-clamp-2 max-w-[200px]">
          {doc.detalle || <span className="italic text-slate-300">Sin detalle</span>}
        </p>
      )
    },
    {
      key: "montoTotal",
      header: "Total",
      type: "currency",
      className: "text-right",
      sortable: true,
      render: (doc) => (
        <div className="text-right">
          <div className={`text-sm font-black tracking-tight ${doc.anulado ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(doc.montoTotal)}
          </div>
          {Number(doc.retencion) > 0 && (
            <div className="text-[10px] text-rose-500 font-bold">
              Ret. {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(doc.retencion)}
            </div>
          )}
        </div>
      )
    },
    {
      key: "autorizado",
      header: "Autorización",
      className: "text-center",
      render: (doc) => (
        <div className="flex flex-col items-center justify-center gap-1">
          {doc.autorizado ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Autorizado</span>
              </div>
              {doc.fechaAutorizacionPago && (
                <span className="text-[9px] font-bold text-slate-400">
                  {format(new Date(doc.fechaAutorizacionPago), 'dd/MM/yyyy')}
                </span>
              )}
            </>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-400 rounded-full border border-slate-200">
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Pendiente</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: "estadoContable",
      header: "Contable",
      className: "text-center",
      render: (doc) => (
        <div className="flex flex-col items-center justify-center gap-1">
          {doc.anulado ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
              <AlertCircle className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase">Anulado</span>
            </div>
          ) : doc.asientoId ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Contabilizado</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400">Asiento {doc.asiento?.numero}</span>
            </>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
              <AlertCircle className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Falta Asiento</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: "pagado",
      header: "Pago",
      className: "text-center",
      render: (doc) => (
        <div className="flex flex-col items-center justify-center gap-1">
          {doc.pagado ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Pagado</span>
              </div>
              {doc.asientoPago && (
                <span className="text-[9px] font-bold text-slate-400">Asiento {doc.asientoPago.numero}</span>
              )}
            </>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-400 rounded-full border border-slate-200">
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Impago</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: "exigible",
      header: "Exigible",
      className: "text-center",
      render: (doc) => {
        const esExigible = doc.ejercicioExigibleId !== null && doc.ejercicioExigibleId !== undefined;
        const origenNum = doc.ejercicioOrigen?.numero ?? doc.ejercicio?.numero;
        const destNum = doc.ejercicioExigible?.numero;
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
      label: "Autorizar",
      icon: ShieldCheck,
      onClick: handlers.onAutorizar,
      variant: "info",
      showIf: (doc) => !doc.anulado && !doc.autorizado
    },
    {
      label: "Pagar",
      icon: DollarSign,
      onClick: handlers.onPagar,
      variant: "info",
      showIf: (doc) => !doc.anulado && !!doc.autorizado && !doc.pagado && state.isContabilidadEnabled
    },
    {
      label: "Editar",
      icon: Edit,
      onClick: handlers.onEdit,
      variant: "info",
      showIf: (doc) => !doc.anulado
    },
    {
      label: "Anular",
      icon: X,
      onClick: (doc) => handlers.onAnular(doc.id),
      variant: "danger",
      showIf: (doc) => !doc.anulado && (!doc.asientoId || state.isContabilidadEnabled)
    },
    {
      label: "Eliminar",
      icon: Trash2,
      onClick: (doc) => handlers.onDelete(doc.id),
      variant: "danger",
      showIf: (doc) => !doc.asientoId && !doc.anulado
    },
    {
      label: "Ver Asiento",
      icon: ExternalLink,
      onClick: (doc) => window.open(`/asientos?search=${doc.asiento?.numero}`, '_blank'),
      showIf: (doc) => !!doc.asientoId
    }
  ]
});
