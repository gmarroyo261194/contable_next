import { GridConfig } from "@/components/ui/DataGrid";
import { CheckCircle, RotateCcw, Pencil } from "lucide-react";

/**
 * Configuración del DataGrid para la grilla de cuotas de una inscripción.
 * @param onPagar - Callback para registrar el pago de una cuota.
 * @param onRevertir - Callback para revertir el pago de una cuota.
 * @param onEdit - Callback para editar datos de la cuota.
 */
export const cuotaGridConfig = (
  onPagar: (item: any) => void,
  onRevertir: (item: any) => void,
  onEdit: (item: any) => void
): GridConfig<any> => ({
  columns: [
    {
      key: "numeroCuota",
      header: "N°",
      className: "text-center w-16",
      render: (item) => (
        <span className="font-black text-primary text-base">{item.numeroCuota}</span>
      ),
    },
    {
      key: "importe",
      header: "Importe",
      type: "currency",
      className: "text-right font-bold",
      sortable: true,
    },
    {
      key: "fechaVencimiento",
      header: "Vencimiento",
      type: "date",
      sortable: true,
      className: "text-center",
      render: (item) => {
        const venc = new Date(item.fechaVencimiento);
        const hoy = new Date();
        const vencida = item.estado !== "Pagada" && venc < hoy;
        return (
          <span className={`text-sm font-semibold ${vencida ? "text-red-500" : "text-slate-700"}`}>
            {venc.toLocaleDateString("es-AR")}
          </span>
        );
      },
    },
    {
      key: "fechaPago",
      header: "Fecha de Pago",
      type: "date",
      className: "text-center",
      render: (item) =>
        item.fechaPago ? (
          <span className="text-emerald-600 font-semibold text-sm">
            {new Date(item.fechaPago).toLocaleDateString("es-AR")}
          </span>
        ) : (
          <span className="text-slate-300 text-xs italic">Sin pago</span>
        ),
    },
    {
      key: "estado",
      header: "Estado",
      className: "text-center",
      render: (item) => {
        const venc = new Date(item.fechaVencimiento);
        const hoy = new Date();
        const esVencida = item.estado !== "Pagada" && venc < hoy;
        const estadoReal = esVencida ? "Vencida" : item.estado;

        const map: Record<string, string> = {
          Pagada: "bg-emerald-100 text-emerald-700",
          Pendiente: "bg-amber-100 text-amber-700",
          Vencida: "bg-red-100 text-red-600",
        };
        return (
          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${map[estadoReal] || "bg-slate-100 text-slate-600"}`}>
            {estadoReal}
          </span>
        );
      },
    },
    {
      key: "observaciones",
      header: "Obs.",
      render: (item) => (
        <span className="text-xs text-slate-400 italic">{item.observaciones || "-"}</span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right",
    },
  ],
  actions: [
    {
      label: "Registrar Pago",
      icon: CheckCircle,
      onClick: onPagar,
      variant: "primary",
      showIf: (item) => item.estado !== "Pagada",
    },
    {
      label: "Revertir Pago",
      icon: RotateCcw,
      onClick: onRevertir,
      variant: "warning",
      showIf: (item) => item.estado === "Pagada",
    },
    {
      label: "Editar",
      icon: Pencil,
      onClick: onEdit,
      variant: "info",
    },
  ],
});
