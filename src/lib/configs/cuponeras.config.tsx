import { GridConfig } from "@/components/ui/DataGrid";
import { CuotaLegacy } from "@/lib/actions/cuponeras-actions";

/**
 * Configuración del DataGrid para las cuotas de las cuponeras.
 * Sigue el estándar de metadata-driven UI.
 */
export const cuponeraGridConfig: GridConfig<CuotaLegacy & { id: number; nombre_persona: string; numfactura: number; id_factura: number }> = {
  columns: [
    {
      key: "id_factura",
      header: "Cuponera",
      type: "number",
      width: "100px",
      className: "font-black font-mono text-primary"
    },
    {
      key: "num_cuota",
      header: "Cuota",
      render: (row) => `#${row.num_cuota}`,
      width: "80px"
    },
    {
      key: "importe_cuota",
      header: "Importe",
      type: "currency",
      className: "text-right font-black"
    },
    {
      key: "recargo_cuota",
      header: "Recargo",
      type: "currency",
      className: "text-right font-bold text-amber-600"
    },
    {
      key: "fecha_vto",
      header: "Vencimiento",
      type: "date",
      className: "text-center"
    },
    {
      key: "pagada_label",
      header: "Estado Pago",
      render: (row) => (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm ${row.estado_pagado === 1 ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
          {row.pagada_label}
        </span>
      ),
      className: "text-center"
    }
  ],
  features: {
    pagination: true,
    sorting: true,
    filtering: true
  },
  groupBy: "nombre_persona"
};
