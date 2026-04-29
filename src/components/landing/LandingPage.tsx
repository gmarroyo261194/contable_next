"use client";

import React from 'react';
import Link from 'next/link';
import {
  Rocket,
  ArrowRight,
  CheckCircle2,
  Shield,
  BarChart3,
  LogIn,
  Wallet
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-white">
              <Wallet className="size-6" />
            </div>
            <h2 className="text-[#0a192f] dark:text-white text-xl font-bold leading-tight tracking-tight">ContableNext</h2>
          </div>
          <Link
            href="/login"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            <LogIn className="size-4" />
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-10 animate-in slide-in-from-left-8 duration-1000 ease-out">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/50 backdrop-blur-sm rounded-full shadow-sm border border-slate-200/60 transition-all hover:bg-white hover:border-primary/30 group cursor-default">
              <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Rocket className="size-2.5 text-primary" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Nueva Plataforma 2026
              </span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-black text-slate-950 leading-[0.95] tracking-[-0.04em]">
              La contabilidad <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary via-blue-600 to-indigo-700">
                del futuro
              </span>, hoy.
            </h1>

            <p className="text-xl text-slate-500/90 max-w-lg leading-relaxed font-medium tracking-tight">
              Optimiza tu gestión contable con inteligencia y simplicidad. <br className="hidden md:block" />
              Diseñado para empresas argentinas que buscan eficiencia y transparencia.
            </p>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6">
              {[
                { label: "Factura Electrónica", icon: CheckCircle2 },
                { label: "Multimoneda", icon: CheckCircle2 },
                { label: "Centros de Costos", icon: CheckCircle2 }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 group cursor-default">
                  <div className="size-6 rounded-full bg-green-50 flex items-center justify-center border border-green-100 group-hover:bg-green-100 transition-colors">
                    <item.icon className="size-3.5 text-green-600" />
                  </div>
                  <span className="font-bold text-sm text-slate-700 tracking-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-in zoom-in-95 duration-700 group">
            <div className="absolute inset-0 bg-primary/30 blur-[120px] rounded-full scale-75 -z-10 group-hover:bg-primary/40 transition-colors duration-700"></div>
            <div className="relative bg-white/5 backdrop-blur-sm p-1.5 rounded-[2.5rem] shadow-2xl border border-white/10 rotate-2 hover:rotate-0 transition-all duration-700 hover:scale-[1.02]">
              <img 
                src="/hero-dashboard.png" 
                alt="ContableNext Dashboard" 
                className="w-full h-auto rounded-[2.2rem] shadow-inner object-cover"
              />
              
              {/* Overlay glow */}
              <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none"></div>
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
