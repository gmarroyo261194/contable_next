import { GridConfig } from "@/components/ui/DataGrid";
import { 
  XCircle, 
  Printer, 
  FileSpreadsheet,
  ArrowRight
} from "lucide-react";

export const asientosGridConfig = (
  handlers: {
    onAnular: (asiento: any) => void;
    onImprimir?: (id: number) => void;
    onExportar?: (id: number) => void;
  }
): GridConfig<any> => ({
  columns: [
    {
      key: "fecha",
      header: "Fecha",
      sortable: true,
      className: "w-1 whitespace-nowrap text-center",
      render: (asiento) => {
        const d = new Date(asiento.fecha);
        const normalized = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return <span className="text-sm font-bold text-slate-600">{normalized.toLocaleDateString()}</span>;
      }
    },
    {
      key: "numero",
      header: "Asiento #",
      sortable: true,
      className: "w-1 whitespace-nowrap text-center",
      render: (asiento) => (
        <span className="text-xs font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
          {asiento.numero}
        </span>
      )
    },
    {
      key: "descripcion",
      header: "Concepto / Descripción",
      sortable: true,
      render: (asiento) => (
        <div className="flex items-center gap-2">
          <div className="text-sm font-black text-slate-800">{asiento.descripcion}</div>
          {asiento.anulaA && (
            <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">
              Anula #{asiento.anulaA.numero}
            </span>
          )}
          {asiento.anulaciones?.length > 0 && (
            <span className="bg-red-100 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">
              Anulado
            </span>
          )}
        </div>
      )
    },
    {
      key: "montoTotal",
      header: "Importe",
      className: "text-right",
      render: (asiento) => {
        const totalDebe = asiento.renglones?.reduce((sum: number, r: any) => sum + Number(r.debe), 0) || 0;
        return (
          <span className="text-sm font-black text-slate-900">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalDebe)}
          </span>
        );
      }
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-center"
    }
  ],
  actions: [
    {
      label: "Anular",
      icon: XCircle,
      onClick: handlers.onAnular,
      variant: "danger",
      showIf: (asiento) => !asiento.anulaA && !(asiento.anulaciones?.length > 0)
    },
    {
      label: "Imprimir",
      icon: Printer,
      onClick: (asiento) => handlers.onImprimir?.(asiento.id),
      variant: "info"
    },
    {
      label: "Exportar",
      icon: FileSpreadsheet,
      onClick: (asiento) => handlers.onExportar?.(asiento.id),
      variant: "info"
    }
  ]
});
