import Link from 'next/link';
import { Wallet, CheckCircle2 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-white">
              <Wallet className="size-6" />
            </div>
            <h2 className="text-slate-950 text-xl font-bold leading-tight tracking-tight">ContableNext</h2>
          </div>
          <div className="hidden sm:block">
            {title === "Iniciar Sesión" ? (
              <p className="text-slate-500 text-sm font-medium">
                ¿No tienes cuenta? <Link className="text-primary font-bold hover:underline ml-1" href="/register">Regístrate ahora</Link>
              </p>
            ) : (
              <p className="text-slate-500 text-sm font-medium">
                ¿Ya tienes cuenta? <Link className="text-primary font-bold hover:underline ml-1" href="/login">Inicia Sesión</Link>
              </p>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 pt-24 pb-12 relative z-10">
        <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-200/60 animate-in fade-in zoom-in-95 duration-700">

          {/* Left Side - Branding Section */}
          <div className="hidden lg:block relative bg-slate-950 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 opacity-40">
              <img
                src="/hero-dashboard.png"
                alt="Background"
                className="w-full h-full object-cover scale-110 blur-[2px]"
              />
            </div>
            <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-950/80 to-primary/30"></div>

            <div className="relative h-full flex flex-col justify-between p-12 py-16">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Plataforma Inteligente</span>
                </div>
                <h1 className="text-4xl font-black text-white leading-[1.1] tracking-tight">
                  Gestiona tu <br />
                  <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-400">contabilidad</span> con precisión.
                </h1>
                <p className="text-lg text-slate-300 font-medium leading-relaxed max-w-sm">
                  La herramienta definitiva para el crecimiento de tu empresa en Argentina.
                </p>
              </div>

              <div className="space-y-5">
                {[
                  "Informes inteligentes en tiempo real",
                  "Facturación automatizada AFIP",
                  "Integracion con pasarelas de pagos"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3.5 group">
                    <div className="size-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/20 group-hover:bg-blue-500/30 transition-colors">
                      <CheckCircle2 className="size-3.5 text-blue-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-200 tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-gray-100 relative">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-4xl font-black text-slate-950 mb-3 tracking-tight">{title}</h2>
                <p className="text-slate-500 font-medium tracking-tight leading-relaxed">{subtitle}</p>
              </div>

              <div className="relative z-10">
                {children}
              </div>

              {/* Mobile Auth Links */}
              <div className="mt-10 text-center sm:hidden">
                {title === "Iniciar Sesión" ? (
                  <p className="text-slate-500 text-sm font-medium">
                    ¿No tienes cuenta? <Link className="text-primary font-bold hover:underline ml-1" href="/register">Regístrate ahora</Link>
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm font-medium">
                    ¿Ya tienes cuenta? <Link className="text-primary font-bold hover:underline ml-1" href="/login">Inicia Sesión</Link>
                  </p>
                )}
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                  ContableNext
                </p>
                {/* <div className="flex gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <a href="#" className="hover:text-primary transition-colors">Términos</a>
                  <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
                  <a href="#" className="hover:text-primary transition-colors">Ayuda</a>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-6 text-center">
        <p className="text-[11px] font-medium text-slate-400 tracking-tight">
          © 2026 ContableNext. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
