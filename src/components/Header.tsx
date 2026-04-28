"use client";

import { useSession } from 'next-auth/react';
import { Search, Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

/**
 * Componente de cabecera de la aplicación.
 * Incluye buscador global, notificaciones, selector de tema e información de la empresa.
 * 
 * @returns {JSX.Element} Cabecera con funcionalidades globales.
 */
export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar cuentas, asientos o facturas..."
              className="pl-10 pr-4 py-2 bg-muted border-none rounded-custom text-sm focus:ring-2 focus:ring-primary w-full outline-hidden text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <button className="p-2 text-muted-foreground hover:text-primary transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-card"></span>
          </button>

          <div className="h-8 w-px bg-border mx-2"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <p className="text-xs font-semibold leading-none text-foreground">{(session?.user as any)?.empresaNombre || 'Sin Empresa'}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {(session?.user as any)?.ejercicioNombre ? `Ejercicio ${(session?.user as any).ejercicioNombre}` : 'Sin Ejercicio'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
