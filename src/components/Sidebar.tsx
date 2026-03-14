"use client";

import { 
  LayoutDashboard, 
  ReceiptText, 
  Network, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Calculator,
  Building2,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logout } from '@/lib/actions/auth-actions';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Empresas', href: '/empresas' },
  { icon: ReceiptText, label: 'Asientos Contables', href: '/asientos' },
  { icon: Network, label: 'Plan de Cuentas', href: '/plan-cuentas' },
  { icon: Calendar, label: 'Ejercicios', href: '/ejercicios' },
  { icon: Users, label: 'Clientes/Proveedores', href: '/entidades' },
  { icon: BarChart3, label: 'Reportes', href: '/reportes' },
  { icon: Settings, label: 'Ajustes', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userInitial = session?.user?.name 
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary flex items-center justify-center rounded-lg w-10 h-10 text-white">
            <Calculator className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-slate-900 text-lg font-bold leading-tight">ContableNext</h1>
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Gestión Contable</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 mt-auto">
        <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3 border border-slate-100">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden text-slate-500 text-xs font-bold">
              {userInitial}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-900 truncate">{session?.user?.name || 'Invitado'}</span>
            <span className="text-[11px] text-slate-500 truncate">{session?.user?.email || 'No identificado'}</span>
          </div>
          <button 
            onClick={() => logout()}
            className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
