import Link from 'next/link';
import { Wallet } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="bg-[#f8f6f6] dark:bg-[#221610] font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 lg:px-20 bg-white dark:bg-[#0a192f]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-[#ec5b13] text-white">
                <Wallet className="size-6" />
              </div>
              <h2 className="text-[#0a192f] dark:text-white text-xl font-bold leading-tight tracking-tight">ContableNext</h2>
            </div>
            <div className="hidden md:block">
              {title === "Iniciar Sesión" ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  ¿No tienes cuenta? <Link className="text-[#ec5b13] font-semibold hover:underline" href="/register">Regístrate ahora</Link>
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  ¿Ya tienes cuenta? <Link className="text-[#ec5b13] font-semibold hover:underline" href="/login">Inicia Sesión</Link>
                </p>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white dark:bg-[#0a192f] rounded-xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
              {/* Left Side - Branding (Hidden on mobile) */}
              <div className="hidden lg:block relative bg-[#ec5b13]/10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ec5b13]/20 to-[#0a192f]/40"></div>
                <div className="relative h-full flex flex-col justify-center p-12 text-[#0a192f] dark:text-white">
                  <h1 className="text-4xl font-black mb-6 leading-tight">Optimiza tu contabilidad con ContableNext</h1>
                  <p className="text-lg opacity-90 mb-8">La plataforma líder para la gestión financiera de tu empresa. Simple, rápida y segura.</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="size-5 rounded-full bg-[#ec5b13] flex items-center justify-center text-white">
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>Informes en tiempo real</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-5 rounded-full bg-[#ec5b13] flex items-center justify-center text-white">
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>Facturación automatizada</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-5 rounded-full bg-[#ec5b13] flex items-center justify-center text-white">
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>Seguridad de grado bancario</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-[#0a192f] dark:text-white mb-2">{title}</h2>
                  <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
                </div>
                
                {children}

                {/* Mobile Links */}
                <div className="mt-8 text-center md:hidden">
                  {title === "Iniciar Sesión" ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      ¿No tienes cuenta? <Link className="text-[#ec5b13] font-semibold hover:underline" href="/register">Regístrate ahora</Link>
                    </p>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      ¿Ya tienes cuenta? <Link className="text-[#ec5b13] font-semibold hover:underline" href="/login">Inicia Sesión</Link>
                    </p>
                  )}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 italic">
                    Protegido por ContableNext Security. © 2024 Todos los derechos reservados.
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="px-6 py-8 flex flex-col items-center gap-4 bg-[#f8f6f6] dark:bg-[#221610]">
            <div className="flex gap-6 text-slate-500 dark:text-slate-400 text-sm">
              <a className="hover:text-[#ec5b13] transition-colors" href="#">Términos de Servicio</a>
              <a className="hover:text-[#ec5b13] transition-colors" href="#">Privacidad</a>
              <a className="hover:text-[#ec5b13] transition-colors" href="#">Ayuda</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
