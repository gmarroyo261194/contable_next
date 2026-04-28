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
  ChevronDown,
  ChevronUp,
  Receipt,
  BadgeDollarSign,
  Tags,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logout } from '@/lib/actions/auth-actions';
import { getModulos } from '@/lib/actions/module-actions';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Empresas', href: '/empresas' },
  {
    icon: BookOpen,
    label: 'Contabilidad',
    href: '/contabilidad',
    children: [
      { icon: ReceiptText, label: 'Asientos Contables', href: '/asientos', moduleCode: 'CONTABILIDAD' },
      { icon: Network, label: 'Plan de Cuentas', href: '/plan-cuentas', moduleCode: 'CONTABILIDAD' },
      { icon: Calendar, label: 'Ejercicios', href: '/ejercicios' },
      { icon: Tags, label: 'Centros de Costo', href: '/centros-costos', moduleCode: 'CONTABILIDAD' },
      { icon: BarChart3, label: 'Reportes', href: '/reportes', moduleCode: 'CONTABILIDAD' },
    ]
  },
  {
    icon: GraduationCap,
    label: 'Honorarios Docentes',
    href: '/honorarios-docentes',
    children: [
      { icon: Users, label: 'Docentes', href: '/docentes' },
      { icon: ReceiptText, label: 'Facturas Docentes', href: '/facturas-docentes' },
    ]
  },
  {
    icon: Users,
    label: 'Clientes y Proveedores',
    href: '/cliente-prov',
    children: [
      { icon: Users, label: 'Pers. Fisicas y Juridicas', href: '/entidades' },
      { icon: Receipt, label: 'Documentos Proveedores', href: '/docprov' },
      { icon: Receipt, label: 'Facturas Emitidas', href: '/doccli' },
    ]
  },
  { icon: Settings, label: 'Ajustes', href: '/settings' },
];

/**
 * Componente de barra lateral de navegación.
 * Soporta colapsado, submenús y cambio de tema automático.
 * 
 * @returns {JSX.Element} Barra lateral con navegación principal.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Contabilidad']);
  const [activeModules, setActiveModules] = useState<string[]>([]);

  React.useEffect(() => {
    async function loadModules() {
      const modulos = await getModulos();
      setActiveModules(modulos.filter(m => m.activo).map(m => m.codigo));
    }
    loadModules();
  }, []);

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(m => m !== label)
        : [...prev, label]
    );
  };

  const filteredNavItems = navItems.map(item => {
    const children = item.children?.filter(child => 
      !child.moduleCode || activeModules.includes(child.moduleCode)
    );
    
    // Si el item principal tiene moduleCode y no está activo, o si tenía hijos y ahora no tiene ninguno (y no es Dashboard/Empresas/Ajustes)
    // Pero en este caso, Contabilidad siempre tiene Ejercicios, así que no se filtrará completamente.
    return { ...item, children };
  }).filter(item => {
    if ((item as any).moduleCode && !activeModules.includes((item as any).moduleCode)) return false;
    return true;
  });

  const userInitial = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <aside className={`bg-card border-r border-border flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-card border border-border rounded-full p-1 shadow-sm hover:bg-muted transition-colors z-50 text-foreground"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Logo Section */}
      <div className={`p-6 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="bg-primary flex items-center justify-center rounded-lg min-w-10 min-h-10 text-primary-foreground shadow-lg shadow-primary/20">
            <Calculator className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-foreground text-lg font-bold leading-tight truncate">ContableNext</h1>
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider truncate">Gestión Contable</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar`}>
        {filteredNavItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus.includes(item.label);
          const isActive = pathname === item.href || (hasChildren && item.children?.some(child => pathname === child.href));

          return (
            <div key={item.label} className="space-y-1">
              {hasChildren ? (
                <button
                  onClick={() => !isCollapsed && toggleMenu(item.label)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium truncate flex-1 text-left">{item.label}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </>
                  )}
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href || '#'}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${pathname === item.href
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${pathname === item.href ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {isCollapsed && pathname === item.href && (
                    <div className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-r-full" />
                  )}
                </Link>
              )}

              {hasChildren && isExpanded && !isCollapsed && (
                <div className="ml-9 space-y-1 border-l border-border pl-2">
                  {item.children?.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.label}
                        href={child.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isChildActive
                          ? 'text-primary font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                      >
                        <span className="text-sm">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className={`p-4 mt-auto`}>
        <div className={`bg-muted rounded-2xl p-3 flex items-center border border-border ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-card border-2 border-border shadow-sm flex items-center justify-center overflow-hidden text-muted-foreground text-xs font-bold">
              {userInitial}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-muted rounded-full"></div>
          </div>

          {!isCollapsed && (
            <>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground truncate">{session?.user?.name || 'Invitado'}</span>
                <span className="text-[11px] text-muted-foreground truncate">{session?.user?.email || 'No identificado'}</span>
              </div>
              <button
                onClick={() => logout()}
                className="ml-2 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
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
            className="w-full mt-2 flex justify-center py-2 text-muted-foreground hover:text-red-500 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
