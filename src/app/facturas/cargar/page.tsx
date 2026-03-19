// src/app/facturas/cargar/page.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Zap
} from 'lucide-react';

interface UploadResult {
  ok: boolean;
  facturaId?: number;
  duplicado?: boolean;
  error?: string;
  resumen?: {
    emisor:   string;
    cuit:     string;
    tipo:     string;
    numero:   string;
    fecha:    string;
    importe:  number;
    cae:      string;
  };
}

type FileStatus = 'idle' | 'uploading' | 'success' | 'duplicate' | 'error';

interface FileEntry {
  file: File;
  status: FileStatus;
  result?: UploadResult;
}

export default function CargarFacturasPage() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    addFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addFiles(files);
    if (e.target) e.target.value = '';
  };

  const addFiles = (files: File[]) => {
    const newEntries: FileEntry[] = files.map((file) => ({
      file,
      status: 'idle',
    }));
    setEntries((prev) => [...prev, ...newEntries]);
  };

  const uploadFile = async (index: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, status: 'uploading' } : e))
    );

    const entry = entries[index];
    if (!entry) return;

    const formData = new FormData();
    formData.append('file', entry.file);

    try {
      const res = await fetch('/api/facturas/upload', {
        method: 'POST',
        body: formData,
      });
      const result: UploadResult = await res.json();

      const newStatus: FileStatus = !result.ok
        ? 'error'
        : result.duplicado
        ? 'duplicate'
        : 'success';

      setEntries((prev) =>
        prev.map((e, i) => (i === index ? { ...e, status: newStatus, result } : e))
      );
    } catch {
      setEntries((prev) =>
        prev.map((e, i) =>
          i === index
            ? { ...e, status: 'error', result: { ok: false, error: 'Error de red' } }
            : e
        )
      );
    }
  };

  const uploadAll = async () => {
    setIsProcessingAll(true);
    // Procesar en lotes o secuencial
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].status === 'idle') {
            await uploadFile(i);
        }
    }
    setIsProcessingAll(false);
  };

  const removeEntry = (index: number) =>
    setEntries((prev) => prev.filter((_, i) => i !== index));

  const clearAll = () => setEntries([]);

  const fmtImporte = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  const pendingCount = entries.filter((e) => e.status === 'idle').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* Navbar Minimalista */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <Link href="/facturas" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </Link>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Importador Digital</div>
          <div className="w-24"></div> {/* Spacer */}
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-10">

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <Zap className="w-3 h-3 fill-current" />
            Procesamiento Inteligente
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Carga de Facturas</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
            Sube los PDFs de tus comprobantes y nosotros nos encargamos de extraer toda la información automáticamente.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            group relative border-4 border-dashed rounded-[2.5rem] p-16 text-center cursor-pointer
            transition-all duration-500 overflow-hidden
            ${isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
              : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/30'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />

          <div className="relative flex flex-col items-center gap-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl
              ${isDragging ? 'bg-blue-600 text-white rotate-12' : 'bg-slate-900 text-white group-hover:-rotate-6'}`}>
              <UploadCloud className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {isDragging ? '¡Soltalos ahora!' : 'Arrastra tus PDFs aquí'}
              </h2>
              <p className="text-slate-500 font-medium">
                o haz click para explorar tus archivos localmente
              </p>
            </div>
            <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> AFIP A/B/C</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Extracción CAE</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Máx 10MB</span>
            </div>
          </div>
        </div>

        {/* List of Files */}
        {entries.length > 0 && (
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-slate-900">Archivos en cola</h3>
                <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                  {entries.length} items
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                    onClick={clearAll}
                    className="text-sm font-bold text-slate-400 hover:text-rose-600 transition-colors"
                >
                    Limpiar lista
                </button>
                {pendingCount > 0 && (
                    <button
                        onClick={uploadAll}
                        disabled={isProcessingAll}
                        className="bg-slate-900 text-white px-6 py-2 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isProcessingAll && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isProcessingAll ? 'Procesando lotes' : `Procesar todos (${pendingCount})`}
                    </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {entries.map((entry, index) => (
                <FileCard
                  key={`${entry.file.name}-${index}`}
                  entry={entry}
                  onUpload={() => uploadFile(index)}
                  onRemove={() => removeEntry(index)}
                  fmtImporte={fmtImporte}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FileCard({ entry, onUpload, onRemove, fmtImporte }: any) {
  const { file, status, result } = entry;

  const statusMap: any = {
    idle: { 
        style: 'bg-white border-slate-100', 
        badge: 'bg-slate-100 text-slate-500', 
        label: 'Esperando', 
        icon: Clock 
    },
    uploading: { 
        style: 'bg-blue-50 border-blue-100 ring-2 ring-blue-50', 
        badge: 'bg-blue-600 text-white', 
        label: 'Leyendo PDF', 
        icon: Loader2 
    },
    success: { 
        style: 'bg-emerald-50 border-emerald-100', 
        badge: 'bg-emerald-600 text-white shadow-lg shadow-emerald-100', 
        label: 'Completado', 
        icon: CheckCircle2 
    },
    duplicate: { 
        style: 'bg-amber-50 border-amber-100', 
        badge: 'bg-amber-500 text-white shadow-lg shadow-amber-100', 
        label: 'Duplicado', 
        icon: Clock 
    },
    error: { 
        style: 'bg-rose-50 border-rose-100', 
        badge: 'bg-rose-600 text-white shadow-lg shadow-rose-100', 
        label: 'Error de Lectura', 
        icon: AlertCircle 
    },
  };

  const current = statusMap[status];
  const StatusIcon = current.icon;

  return (
    <div className={`group border-2 rounded-[2rem] p-6 transition-all duration-300 ${current.style}`}>
      <div className="flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-5 min-w-0">
          <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm
            ${status === 'success' ? 'bg-emerald-500 text-white' : 
              status === 'error' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}>
            <FileText className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-slate-900 truncate pr-4">{file.name}</h4>
            <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs font-bold text-slate-400">PDF • {(file.size / 1024).toFixed(0)} KB</span>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${current.badge}`}>
                    {status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {current.label}
                </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === 'idle' && (
            <button 
                onClick={onUpload}
                className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-blue-600 transition-all shadow-md active:scale-95"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {status !== 'uploading' && (
            <button 
                onClick={onRemove}
                className="p-3 text-slate-300 hover:text-rose-600 transition-colors"
            >
                <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Result Panel */}
      {result?.ok && result.resumen && (
        <div className="mt-6 pt-6 border-t border-slate-100 animate-in zoom-in-95 duration-500">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <ResultItem label="Emisor" value={result.resumen.emisor} />
              <ResultItem label="CUIT" value={result.resumen.cuit} />
              <ResultItem label="Nro" value={`${result.resumen.tipo} ${result.resumen.numero}`} />
              <ResultItem label="Total" value={fmtImporte(result.resumen.importe)} isStrong />
           </div>
           
           <div className="mt-4 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400">CAE: <span className="text-slate-600">{result.resumen.cae}</span></div>
              {result.duplicado ? (
                <div className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> Factura ya registrada previamente
                </div>
              ) : (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Registrada correctamente #ID {result.facturaId}
                </div>
              )}
           </div>
        </div>
      )}

      {result && !result.ok && (
        <div className="mt-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
            <p className="text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {result.error}
            </p>
        </div>
      )}
    </div>
  );
}

function ResultItem({ label, value, isStrong }: any) {
    return (
        <div className="space-y-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
            <div className={`text-sm truncate ${isStrong ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{value}</div>
        </div>
    );
}
