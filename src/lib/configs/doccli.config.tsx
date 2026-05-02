import { ColumnConfig, GridAction, GridConfig } from "@/components/ui/DataGrid";
import { format } from "date-fns";
import { 
  FileText, 
  Edit, 
  DollarSign, 
  Link as LinkIcon, 
  Mail, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { getTipoComprobanteNombre } from "@/lib/utils/voucher-utils";

export const docCliGridConfig = (
  handlers: {
    onVerItems: (doc: any) => void;
    onEditar: (doc: any) => void;
    onRegistrarPago: (doc: any) => void;
    onGenerarLink: (id: number) => void;
    onEnviarEmail: (id: number) => void;
    onDescargarPdf: (id: number) => void;
    onEliminar: (id: number) => void;
  },
  state: {
    isContabilidadEnabled: boolean;
    isGeneratingLink: number | null;
    isSendingEmail: number | null;
    isDownloadingPdf: number | null;
  }
): GridConfig<any> => ({
  columns: [
    {
      key: "fecha",
      header: "Fecha",
      sortable: true,
      render: (doc) => (
        <div className="text-slate-700 font-bold text-xs">
          {format(new Date(doc.fecha), 'dd/MM/yyyy')}
        </div>
      )
    },
    {
      key: "cliente",
      header: "Cliente",
      sortable: true,
      render: (doc) => (
        <div>
          <div className="font-bold text-slate-900 text-sm truncate max-w-[280px]">
            {doc.entidad?.nombre}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {doc.entidad?.cuit || doc.entidad?.nroDoc}
          </div>
        </div>
      )
    },
    {
      key: "servicio",
      header: "Servicio",
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
          <div className="text-[13px] font-bold text-slate-700 italic truncate max-w-[200px]">
            {doc.servicio?.nombre || 'General'}
          </div>
        </div>
      )
    },
    {
      key: "numero",
      header: "Comprobante",
      render: (doc) => (
        <div>
          <div className="font-black text-slate-700 text-xs">{doc.numero}</div>
          <div className="text-[9px] text-indigo-500 font-black uppercase mt-0.5">
            {getTipoComprobanteNombre(doc.tipo)}
          </div>
        </div>
      )
    },
    {
      key: "montoTotal",
      header: "Total",
      type: "currency",
      className: "text-right",
      sortable: true
    },
    {
      key: "estado",
      header: "Estado",
      className: "text-center",
      render: (doc) => (
        <div className="flex flex-col gap-1 items-center">
          {doc.asientoId ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase">Asiento {doc.asiento?.numero}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase">Pendiente</span>
            </div>
          )}
          {doc.pagos360Url && (
            <a href={doc.pagos360Url} target="_blank" rel="noreferrer" className="text-[9px] text-indigo-600 font-bold hover:underline">Link Pago</a>
          )}
        </div>
      )
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right"
    }
  ],
  actions: [
    {
      label: "Ver Items",
      icon: FileText,
      onClick: handlers.onVerItems
    },
    {
      label: "Editar Factura",
      icon: Edit,
      onClick: handlers.onEditar,
      variant: "info",
      showIf: (doc) => !doc.asientoId
    },
    {
      label: "Registrar Cobro",
      icon: DollarSign,
      onClick: handlers.onRegistrarPago,
      variant: "info",
      showIf: (doc) => !doc.asientoId && state.isContabilidadEnabled
    },
    {
      label: "Generar Link de Pago",
      icon: LinkIcon,
      onClick: (doc) => handlers.onGenerarLink(doc.id),
      variant: "info",
      showIf: (doc) => !doc.asientoId && !doc.pagos360Url
    },
    {
      label: "Enviar Link por Email",
      icon: Mail,
      onClick: (doc) => handlers.onEnviarEmail(doc.id),
      variant: "info",
      showIf: (doc) => !doc.asientoId && !!doc.pagos360Url
    },
    {
      label: "Descargar PDF",
      icon: Download,
      onClick: (doc) => handlers.onDescargarPdf(doc.id),
      variant: "warning",
      showIf: (doc) => !doc.asientoId
    },
    {
      label: "Eliminar Factura",
      icon: Trash2,
      onClick: (doc) => handlers.onEliminar(doc.id),
      variant: "danger",
      showIf: (doc) => !doc.asientoId
    }
  ]
});
