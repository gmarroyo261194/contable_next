"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, 
  BookOpen, 
  Users, 
  Settings, 
  LayoutDashboard,
  CreditCard
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Libro Diario', href: '/asientos', icon: BookOpen },
  { name: 'Cuentas Corrientes', href: '/cuentas-corrientes', icon: CreditCard },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Entidades', href: '/entidades', icon: Users },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="brand">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
          Contable<span style={{ color: '#38bdf8' }}>Next</span>
        </h1>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
