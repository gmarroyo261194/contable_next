"use client";

import React, { useState } from "react";
import { Plus, Trash2, Users, Receipt, Calendar, CreditCard, Hash, BookOpen } from "lucide-react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { FacturaDocenteForm } from "@/components/FacturaDocenteForm";
import { deleteFacturaDocente } from "@/lib/actions/factura-docente-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function FacturaDocenteClient({ initialData }: { initialData: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta factura?")) {
      const result = await deleteFacturaDocente(id);
      if (result.success) {
        toast.success("Factura eliminada.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    }
  };

  const columns = [
    {
      header: "Docente",
      accessor: "entidad.nombre",
      cell: (f: any) => (
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
      header: "Comprobante", 
      cell: (f: any) => (
        <div className="font-mono text-xs font-bold text-slate-600">
          {f.puntoVenta}-{f.numero}
        </div>
      )
    },
    { 
      header: "Fecha", 
      accessor: "fecha", 
      cell: (f: any) => new Date(f.fecha).toLocaleDateString() 
    },
    { 
      header: "Período", 
      cell: (f: any) => (
        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase">
          {f.mesHonorarios}/{f.anioHonorarios}
        </span>
      )
    },
    { 
      header: "Importe", 
      accessor: "importe",
      className: "text-right font-black text-slate-900",
      cell: (f: any) => `$ ${Number(f.importe).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      header: "Estado Pago",
      cell: (f: any) => (
        <div className="flex items-center gap-2">
          {f.asientoPagoId ? (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase border border-emerald-100">
              Pagado (Asiento #{f.asientoPagoId})
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase border border-amber-100">
              Pendiente
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-slate-800 font-display">Facturas de Docentes</h2>
          </div>
          <p className="text-slate-500 text-sm">Registro de honorarios y comprobantes</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
        >
          <Plus className="w-4 h-4" />
          Registrar Factura
        </button>
      </header>

      <DataGrid
        data={initialData}
        columns={columns as any}
        actions={(item) => (
          <>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        hideHeader
        noPadding
        maxWidth="max-w-2xl"
      >
        <FacturaDocenteForm
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>
    </div>
  );
}
