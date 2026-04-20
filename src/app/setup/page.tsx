"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { completeInitialSetup } from "@/lib/actions/setup-actions";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    empresa: {
      nombre: "",
      cuit: "",
    },
    ejercicio: {
      anio: new Date().getFullYear(),
      inicio: `${new Date().getFullYear()}-01-01`,
      fin: `${new Date().getFullYear()}-12-31`,
    }
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!formData.empresa.nombre || !formData.empresa.cuit) {
      toast.error("Complete los datos de la empresa.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const result = await completeInitialSetup({
        empresa: formData.empresa,
        ejercicio: {
          anio: formData.ejercicio.anio,
          inicio: new Date(formData.ejercicio.inicio + "T00:00:00Z"),
          fin: new Date(formData.ejercicio.fin + "T00:00:00Z"),
        }
      });

      if (result.success) {
        toast.success("¡Configuración completada con éxito!");
        // Forzar recarga completa para que el middleware detecte la nueva empresa en la sesión
        window.location.href = "/";
      } else {
        toast.error((result as any).error || "Ocurrió un error.");
      }
    } catch (error) {
      toast.error("Error inesperado al configurar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Bienvenido a ContableNext" 
      subtitle="Vamos a configurar su espacio de trabajo inicial."
    >
      <div className="mt-8 space-y-6">
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-8 px-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500
                ${step >= i ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400'}
              `}>
                {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
              </div>
              {i < 2 && (
                <div className={`h-1 flex-1 mx-4 rounded-full transition-all duration-1000 ${step > i ? 'bg-primary' : 'bg-slate-100'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Building2 className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Información de la Empresa</h3>
                  <p className="text-slate-500 text-[10px]">Configure los datos básicos de su organización.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase">Razón Social</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Mi Empresa S.A."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-sm"
                    value={formData.empresa.nombre}
                    onChange={(e) => setFormData({
                      ...formData,
                      empresa: { ...formData.empresa, nombre: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase">CUIT</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 30-12345678-9"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-sm"
                    value={formData.empresa.cuit}
                    onChange={(e) => setFormData({
                      ...formData,
                      empresa: { ...formData.empresa, cuit: e.target.value }
                    })}
                  />
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!formData.empresa.nombre || !formData.empresa.cuit}
                className="w-full flex items-center justify-center gap-2 bg-primary py-3.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 rounded-2xl border border-green-100">
                <Calendar className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Primer Ejercicio Económico</h3>
                  <p className="text-slate-500 text-[10px]">Defina el período contable actual.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase">Año</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-sm"
                    value={formData.ejercicio.anio}
                    onChange={(e) => setFormData({
                      ...formData,
                      ejercicio: { ...formData.ejercicio, anio: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase">Inicio</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-sm"
                      value={formData.ejercicio.inicio}
                      onChange={(e) => setFormData({
                        ...formData,
                        ejercicio: { ...formData.ejercicio, inicio: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase">Cierre</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-sm"
                      value={formData.ejercicio.fin}
                      onChange={(e) => setFormData({
                        ...formData,
                        ejercicio: { ...formData.ejercicio, fin: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Master Admin Info */}
              <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-800">Seguridad</p>
                  <p className="text-[9px] text-slate-600 leading-relaxed mt-0.5">
                    Se creará un usuario administrador maestro por defecto para su sistema.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={prevStep}
                  className="flex-1 py-3.5 rounded-xl text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Regresar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-2 bg-primary py-3.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Finalizar Setup
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
