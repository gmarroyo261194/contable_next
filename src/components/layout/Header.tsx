"use client"

import { useAppStore } from '@/store/useAppStore'
import { ChevronDown, Building2, Calendar } from 'lucide-react'

export default function Header() {
  const { empresaId, ejercicioId } = useAppStore()

  return (
    <header className="header">
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <Building2 size={18} className="text-secondary" />
          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
            {empresaId ? `Empresa ${empresaId}` : 'Seleccione Empresa'}
          </span>
          <ChevronDown size={14} className="text-secondary" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <Calendar size={18} className="text-secondary" />
          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
            {ejercicioId ? `Ejercicio ${ejercicioId}` : 'Seleccione Ejercicio'}
          </span>
          <ChevronDown size={14} className="text-secondary" />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          borderRadius: '50%', 
          backgroundColor: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>
          JD
        </div>
      </div>
    </header>
  )
}
