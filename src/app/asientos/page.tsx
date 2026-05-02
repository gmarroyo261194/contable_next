"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Dialog } from '@/components/Dialog';
import { AsientoForm } from '@/components/AsientoForm';
import { getAsientos, anularAsiento, getAsientoById } from '@/lib/actions/asiento-actions';
import { anularPago } from '@/lib/actions/pago-actions';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getModulos } from '@/lib/actions/module-actions';
import { DataGrid } from '@/components/ui/DataGrid';
import { asientosGridConfig } from '@/lib/configs/asientos.config';
import { AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function AsientosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [asientos, setAsientos] = useState<any[]>([]);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getModulos().then(mods => setActiveModules(mods.filter(m => m.activo).map(m => m.codigo)));
  }, []);

  const isContabilidadEnabled = activeModules.length === 0 || activeModules.includes("CONTABILIDAD");

  // Read from URL Search Params
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const sortBy = searchParams.get('sortBy') || 'numero';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const searchTerm = searchParams.get('search') || '';

  const [selectedAsiento, setSelectedAsiento] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [asientoToAnular, setAsientoToAnular] = useState<any>(null);

  const updateFilters = useCallback((newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const fetchAsientos = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAsientos({
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: searchTerm
      });
      setAsientos(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error("Error al cargar los asientos.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    fetchAsientos();
  }, [fetchAsientos]);

  const handleEdit = (asiento: any) => {
    setSelectedAsiento(asiento);
    setIsDialogOpen(true);
  };

  const handleJump = async (id: number) => {
    setLoading(true);
    try {
      const fullAsiento = await getAsientoById(id);
      if (fullAsiento) {
        setSelectedAsiento(fullAsiento);
        setIsDialogOpen(true);
      } else {
        toast.error("No se pudo encontrar el asiento relacionado.");
      }
    } catch (err) {
      toast.error("Error al cargar el asiento.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async () => {
    if (!asientoToAnular) return;
    const payment = asientoToAnular.pagosGestion?.[0];
    const isPayment = !!payment;
    try {
      const result = isPayment
        ? await anularPago(payment.id)
        : await anularAsiento(asientoToAnular.id);

      if ('success' in result && result.success) {
        toast.success(isPayment
          ? "Pago y asiento anulados correctamente."
          : "Asiento anulado correctamente."
        );
        fetchAsientos();
      } else {
        toast.error((result as any).error || "Error al anular");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado al anular.");
    } finally {
      setIsConfirmOpen(false);
      setAsientoToAnular(null);
    }
  };

  const config = asientosGridConfig({
    onAnular: (asiento) => {
      setAsientoToAnular(asiento);
      setIsConfirmOpen(true);
    },
    onImprimir: (id) => toast.info("Impresión en desarrollo"),
    onExportar: (id) => toast.info("Exportación en desarrollo")
  });

  if (activeModules.length > 0 && !isContabilidadEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
        <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 mb-8 shadow-inner border border-amber-100">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Módulo Contable Desactivado</h1>
        <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
          El acceso al Libro Diario ha sido restringido por la administración.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <DataGrid
        config={config}
        data={asientos}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => updateFilters({ page: p })}
        onPageSizeChange={(size) => updateFilters({ pageSize: size, page: 1 })}
        loading={loading}
        title="Asientos Contables"
        description="Libro Diario General"
        searchTerm={searchTerm}
        onSearchChange={(val) => updateFilters({ search: val, page: 1 })}
        searchPlaceholder="Buscar por descripción, número, importe..."
        onCreate={() => { setSelectedAsiento(null); setIsDialogOpen(true); }}
        createLabel="Nuevo Asiento"
        onRowDoubleClick={handleEdit}
        sortBy={sortBy as any}
        sortOrder={sortOrder}
        onSortChange={(key, dir) => updateFilters({ sortBy: key as string, sortOrder: dir, page: 1 })}
        extraActions={
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Excel
          </button>
        }
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedAsiento(null);
        }}
        hideHeader
        noPadding
        maxWidth="max-w-screen-2xl"
        preventCloseOnOutsideClick
        preventCloseOnEscape
      >
        <AsientoForm
          asientoToEdit={selectedAsiento}
          onJump={handleJump}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedAsiento(null);
          }}
        />
      </Dialog>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleAnular}
        title={asientoToAnular?.pagosGestion?.[0] ? "Anular Pago y Asiento" : "Anular Asiento"}
        description={asientoToAnular?.pagosGestion?.[0]
          ? "Este asiento está asociado al pago de facturas docentes. Al anularlo, el pago se cancelará. ¿Desea proceder?"
          : "¿Está seguro que desea anular este asiento? Se generará un contra-asiento compensatorio."
        }
        confirmText="Confirmar Anulación"
        variant="danger"
      />
    </div>
  );
}
