import React from "react";
import Link from "next/link";
import { Coins, Shield, User, Bell, Globe, Database, Tag, ArrowDownCircleIcon, ArrowRightLeft, History } from "lucide-react";

const categories = [
  {
    title: "General",
    description: "Configuraciones básicas del sistema",
    icon: Globe,
    href: "/settings/general",
    color: "bg-blue-50 text-blue-600",
    disabled: true
  },
  {
    title: "Monedas",
    description: "Gestiona las monedas y cotizaciones",
    icon: Coins,
    href: "/settings/monedas",
    color: "bg-primary/10 text-primary",
    disabled: false
  },
  {
    title: "Seguridad",
    description: "Roles, permisos y auditoría",
    icon: Shield,
    href: "/settings/security",
    color: "bg-red-50 text-red-600",
    disabled: false
  },
  {
    title: "Personas Fisicas y Juridicas",
    description: "Configura categorías de clientes, proveedores y docentes",
    icon: User,
    href: "/settings/tipos-entidad",
    color: "bg-purple-50 text-purple-600",
    disabled: false
  },
  {
    title: "Notificaciones",
    description: "Alertas y correos del sistema",
    icon: Bell,
    href: "/settings/notifications",
    color: "bg-yellow-50 text-yellow-600",
    disabled: true
  },
  {
    title: "Rubros y Servicios",
    description: "Configuracion de rubros y servicios facturables y participaciones a fundacion y departamentos",
    icon: Tag,
    href: "/settings/rubros-servicios",
    color: "bg-green-50 text-green-600",
    disabled: false
  },
  {
    title: "Integracion AFIP",
    description: "Configuracion de la integracion con AFIP y sistema de facturacion electronica",
    icon: ArrowRightLeft,
    href: "/settings/integracion-afip",
    color: "bg-blue-50 text-blue-600",
    disabled: false
  },
  {
    title: "Auditoría",
    description: "Historial de cambios, quién hizo qué y cuándo",
    icon: History,
    href: "/settings/audit-logs",
    color: "bg-amber-50 text-amber-600",
    disabled: false
  }
];

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-800 font-display">Ajustes</h2>
        <p className="text-slate-500 text-sm">Configura y personaliza tu experiencia en ContableNext</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.title}
            href={cat.disabled ? "#" : cat.href}
            className={`group bg-white border border-slate-200 rounded-2xl p-6 transition-all duration-300 ${cat.disabled
              ? "opacity-60 cursor-not-allowed"
              : "hover:shadow-md hover:border-primary/30"
              }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`size-12 rounded-xl flex items-center justify-center ${cat.color}`}>
                <cat.icon className="size-6" />
              </div>
              <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">
                {cat.title}
              </h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              {cat.description}
            </p>
            {cat.disabled && (
              <span className="mt-4 inline-block text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                Próximamente
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
