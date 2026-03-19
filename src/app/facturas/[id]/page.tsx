// src/app/facturas/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Building2, 
  Calendar, 
  CreditCard, 
  Hash, 
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FacturaDetail {
  id:                  number;
  tipoComprobante:     string;
  codComprobante:      string | null;
  puntoVenta:          string;
  numeroComprobante:   string;
  fechaEmision:        string;
  fechaVtoPago:        string | null;
  periodoDesde:        string | null;
  periodoHasta:        string | null;
  condicionVenta:      string | null;
  caeNumero:           string | null;
  caeVto:              string | null;
  razonSocialEmisor:   string;
  cuitEmisor:          string;
  domicilioEmisor:     string | null;
  ingresosBrutos:      string | null;
  condicionIvaEmisor:  string | null;
  inicioActividades:   string | null;
  razonSocialReceptor: string | null;
  cuitReceptor:        string | null;
  domicilioReceptor:   string | null;
  condicionIvaReceptor:string | null;
  subtotal:            string;
  otrosTributos:       string;
  importeTotal:        string;
  archivoOrigen:       string;
  estado:              string;
  procesadoEn:         string;
  items: Array<{
    id:              number;
    codigo:          string | null;
    descripcion:     string | null;
    cantidad:        string | null;
    unidadMedida:    string | null;
    precioUnitario:  string | null;
    bonificacionPct: string | null;
    importeBonif:    string | null;
    subtotal:        string | null;
  }>;
}

export default function FacturaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [factura, setFactura] = useState<FacturaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch(`/api/facturas/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setFactura(d); setLoading(false); })
      .catch(() => { setError('Error al cargar la factura.'); setLoading(false); });
  }, [params.id]);

  const fmt = (n: string | null) =>
    n != null
      ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(parseFloat(n))
      : '-';

  const fmtFecha = (iso: string | null) => {
    if (!iso) return '-';
    return format(new Date(iso), 'dd MMMM yyyy', { locale: es });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
       <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin"></div>
        </div>
    </div>
  );

  if (error || !factura) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-2xl font-bold text-slate-900">{error || 'Comprobante no encontrado'}</h2>
        <button onClick={() => router.back()} className="text-blue-600 font-bold hover:underline underline-offset-4">
            Volver atrás
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* Navbar Superior */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="text-sm font-bold text-slate-700 uppercase tracking-widest">Documento #{factura.id}</div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Printer className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Download className="w-5 h-5" />
            </button>
          </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">

        {/* Header Hero */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                    {factura.tipoComprobante}
                  </span>
                  <StatusBadge estado={factura.estado} />
               </div>
               <div>
                  <h1 className="text-4xl font-black text-slate-900 leading-tight">{factura.razonSocialEmisor}</h1>
                  <p className="text-slate-500 font-semibold flex items-center gap-2 mt-1">
                    <User className="w-4 h-4" /> CUIT {factura.cuitEmisor}
                  </p>
               </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 text-right min-w-[240px]">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Comprobante</div>
               <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                 {fmt(factura.importeTotal)}
               </div>
               <div className="text-sm text-slate-500 font-bold mt-2">
                 PV {factura.puntoVenta} — Nro {factura.numeroComprobante}
               </div>
               <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                 {fmtFecha(factura.fechaEmision)}
               </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Emisor y Receptor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <InfoCard 
                 title="Datos del Emisor" 
                 icon={Building2} 
                 color="text-blue-500"
               >
                 <DataField label="Razón Social" value={factura.razonSocialEmisor} />
                 <DataField label="CUIT" value={factura.cuitEmisor} />
                 <DataField label="Domicilio" value={factura.domicilioEmisor} />
                 <DataField label="I.V.A." value={factura.condicionIvaEmisor} />
                 <DataField label="Ing. Brutos" value={factura.ingresosBrutos} />
               </InfoCard>

               <InfoCard 
                 title="Datos del Receptor" 
                 icon={User} 
                 color="text-indigo-500"
               >
                 <DataField label="Destinatario" value={factura.razonSocialReceptor} />
                 <DataField label="CUIT / Doc" value={factura.cuitReceptor} />
                 <DataField label="Domicilio" value={factura.domicilioReceptor} />
                 <DataField label="Condición IVA" value={factura.condicionIvaReceptor} />
               </InfoCard>
            </div>

            {/* Ítems Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Detalle de conceptos</h2>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{factura.items.length} ítems</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cant.</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Importe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {factura.items.length > 0 ? factura.items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-slate-800">{item.descripcion || 'Sin descripción'}</div>
                                        <div className="text-[10px] font-mono text-slate-400">COD: {item.codigo || '-'}</div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-slate-700">
                                        {item.cantidad} <span className="text-[10px] text-slate-400 ml-1">{item.unidadMedida}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right tabular-nums font-semibold text-slate-600">
                                        {item.precioUnitario ? fmt(item.precioUnitario) : '-'}
                                    </td>
                                    <td className="px-8 py-5 text-right tabular-nums font-extrabold text-slate-900">
                                        {item.subtotal ? fmt(item.subtotal) : '-'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                                        No se encontraron ítems detallados en este comprobante.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          {/* Side Column: Technical Details */}
          <div className="space-y-6">
             
             {/* Importes Box */}
             <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" /> Resumen Económico
                </h3>
                <div className="space-y-4">
                    <SummaryRow label="Subtotal (Neto)" value={fmt(factura.subtotal)} />
                    <SummaryRow label="Otros Tributos" value={fmt(factura.otrosTributos)} />
                    <div className="pt-4 border-t border-slate-800 mt-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Final</span>
                            <span className="text-3xl font-black text-white tracking-tighter tabular-nums">{fmt(factura.importeTotal)}</span>
                        </div>
                    </div>
                </div>
             </div>

             {/* CAE y Fechas */}
             <InfoCard title="Certificación Fiscal" icon={CheckCircle2} color="text-emerald-500">
                 <DataField label="CAE Nro" value={factura.caeNumero} mono />
                 <DataField label="Vto CAE" value={fmtFecha(factura.caeVto)} />
                 <DataField label="Punto Venta" value={factura.puntoVenta} />
                 <DataField label="Comprobante" value={factura.numeroComprobante} />
                 <DataField label="Fecha Emisión" value={fmtFecha(factura.fechaEmision)} />
                 <DataField label="Cond. Venta" value={factura.condicionVenta} />
             </InfoCard>

             {/* Auditoría */}
             <div className="bg-white rounded-[2rem] border border-slate-100 p-6 space-y-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Registro del Sistema</div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-slate-400 font-bold uppercase text-[9px]">Procesado el</div>
                            <div className="text-slate-700 font-extrabold">{fmtFecha(factura.procesadoEn)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-slate-400 font-bold uppercase text-[9px]">Nombre de archivo</div>
                            <div className="text-slate-700 font-extrabold truncate">{factura.archivoOrigen}</div>
                        </div>
                    </div>
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, icon: Icon, color, children }: any) {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Icon className={`w-5 h-5 ${color}`} /> {title}
            </h3>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

function DataField({ label, value, mono }: any) {
    return (
        <div className="space-y-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
            <div className={`text-sm font-bold text-slate-700 ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
        </div>
    );
}

function SummaryRow({ label, value }: any) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-slate-400">{label}</span>
            <span className="font-extrabold text-slate-200 tabular-nums">{value}</span>
        </div>
    );
}

function StatusBadge({ estado }: { estado: string }) {
  const config: Record<string, { icon: any, label: string, color: string }> = {
    ok:        { icon: CheckCircle2, label: 'Válido',    color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    error:     { icon: AlertCircle,  label: 'Erróneo',   color: 'bg-rose-50 text-rose-600 border-rose-100' },
    duplicado: { icon: Clock,        label: 'Duplicado', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  };
  
  const current = config[estado] || { icon: AlertCircle, label: estado, color: 'bg-slate-50 text-slate-500 border-slate-100' };
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${current.color}`}>
      <Icon className="w-3 h-3" />
      {current.label}
    </span>
  );
}
