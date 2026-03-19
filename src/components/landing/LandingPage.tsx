"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Rocket, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  BarChart3, 
  LogIn 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-xs leading-none">C</span>
            </div>
            <span className="text-lg font-black text-slate-800 tracking-tight font-display">Contable<span className="text-primary font-black italic">Next</span></span>
          </div>
          <Link 
            href="/login" 
            className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            <LogIn className="size-4" />
            Acceder al Portal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
              <Rocket className="size-3" />
              Nueva Plataforma 2026
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] font-display">
              La contabilidad <br />
              <span className="text-primary">del futuro</span>, hoy.
            </h1>
            <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
              Optimiza tu gestión contable con inteligencia y simplicidad. Diseñado para empresas argentinas que buscan eficiencia y transparencia.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/login" 
                className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                Probar ahora gratis
                <ArrowRight className="size-5" />
              </Link>
              <button className="bg-white border border-slate-200 px-10 py-4 rounded-2xl font-bold text-lg text-slate-700 hover:bg-slate-50 transition-all">
                Ver presentación
              </button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-600">
                <CheckCircle2 className="size-5 text-green-500" />
                Factura Electrónica
              </div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-600">
                <CheckCircle2 className="size-5 text-green-500" />
                Multimoneda
              </div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-600">
                <CheckCircle2 className="size-5 text-green-500" />
                Reportes AFIP
              </div>
            </div>
          </div>

          <div className="relative animate-in zoom-in-95 duration-700">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-75 -z-10"></div>
            <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center px-2">
                  <div className="h-4 w-32 bg-slate-200 rounded-full"></div>
                  <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-blue-50 rounded-2xl border border-blue-100"></div>
                  <div className="h-32 bg-green-50 rounded-2xl border border-green-100"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full bg-slate-200 rounded-full"></div>
                  <div className="h-3 w-4/5 bg-slate-200 rounded-full"></div>
                  <div className="h-3 w-3/4 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Minimalist Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Shield className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-display">Seguridad Total</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Infraestructura robusta y auditoría completa para tus datos fiscales y financieros.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <BarChart3 className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-display">Dashboard Analítico</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Visualiza el estado de tu empresa en tiempo real con gráficos claros y KPIs personalizables.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <LogIn className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-display">Multi-Ejercicios</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Gestiona múltiples periodos contables de forma simultánea sin pérdida de información.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xs text-slate-400 font-medium font-sans">© 2026 ContableNext. Todos los derechos reservados.</span>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-wider font-sans">Términos</Link>
            <Link href="#" className="text-xs text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-wider font-sans">Privacidad</Link>
            <Link href="#" className="text-xs text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-wider font-sans">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
