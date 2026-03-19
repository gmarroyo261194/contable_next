"use client";

import React, { useState } from 'react';
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  BadgeDollarSign
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
  { icon: Receipt, label: 'Documentos Proveedores', href: '/docprov' },
  { icon: BarChart3, label: 'Reportes', href: '/reportes' },
  { icon: Settings, label: 'Ajustes', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userInitial = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <aside className={`bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronLeft className="w-4 h-4 text-slate-500" />}
      </button>

      {/* Logo Section */}
      <div className={`p-6 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="bg-primary flex items-center justify-center rounded-lg min-w-10 min-h-10 text-white shadow-lg shadow-primary/20">
            <Calculator className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-slate-900 text-lg font-bold leading-tight truncate">ContableNext</h1>
              <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider truncate">Gestión Contable</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isActive
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-600 hover:bg-slate-100'
                } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
              {!isCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {isCollapsed && isActive && (
                <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className={`p-4 mt-auto`}>
        <div className={`bg-slate-50 rounded-2xl p-3 flex items-center border border-slate-100 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden text-slate-500 text-xs font-bold">
              {userInitial}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          {!isCollapsed && (
            <>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-slate-900 truncate">{session?.user?.name || 'Invitado'}</span>
                <span className="text-[11px] text-slate-500 truncate">{session?.user?.email || 'No identificado'}</span>
              </div>
              <button
                onClick={() => logout()}
                className="ml-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        {isCollapsed && (
          <button
            onClick={() => logout()}
            className="w-full mt-2 flex justify-center py-2 text-slate-400 hover:text-red-500 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
