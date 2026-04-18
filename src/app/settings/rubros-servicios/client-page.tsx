"use client";

import React, { useState } from 'react';
import { RubroTable } from '@/components/settings/rubros-servicios/RubroTable';
import { RubroModal } from '@/components/settings/rubros-servicios/RubroModal';
import { DeptoTable } from '@/components/settings/rubros-servicios/DeptoTable';
import { DeptoModal } from '@/components/settings/rubros-servicios/DeptoModal';
import { ServicioTable } from '@/components/settings/rubros-servicios/ServicioTable';
import { ServicioModal } from '@/components/settings/rubros-servicios/ServicioModal';
import { Tag, Building, Wrench, Settings2 } from 'lucide-react';

interface RubrosServiciosClientProps {
  initialRubros: any[];
  initialDepartamentos: any[];
  initialServicios: any[];
  cuentas: any[];
  empresaId: number;
}

export function RubrosServiciosClient({ 
  initialRubros, 
  initialDepartamentos, 
  initialServicios,
  cuentas,
  empresaId
}: RubrosServiciosClientProps) {
  const [activeTab, setActiveTab] = useState<'servicios' | 'rubros' | 'departamentos'>('servicios');
  
  // Modals state
  const [rubroModal, setRubroModal] = useState<{ isOpen: boolean; data: any | null }>({ isOpen: false, data: null });
  const [deptoModal, setDeptoModal] = useState<{ isOpen: boolean; data: any | null }>({ isOpen: false, data: null });
  const [servicioModal, setServicioModal] = useState<{ isOpen: boolean; data: any | null }>({ isOpen: false, data: null });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Settings2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Rubros y Servicios</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">Configuración global de rubros, departamentos y servicios con imputación por empresa.</p>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-6">
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveTab('servicios')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'servicios' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" /> Servicios
          </button>
          <button
            onClick={() => setActiveTab('rubros')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'rubros' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Tag className="w-4 h-4" /> Rubros
          </button>
          <button
            onClick={() => setActiveTab('departamentos')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'departamentos' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building className="w-4 h-4" /> Departamentos
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in zoom-in-95 duration-300">
          {activeTab === 'servicios' && (
            <ServicioTable 
              servicios={initialServicios} 
              onEdit={(s) => setServicioModal({ isOpen: true, data: s })}
              onAdd={() => setServicioModal({ isOpen: true, data: null })}
            />
          )}
          {activeTab === 'rubros' && (
            <RubroTable 
              rubros={initialRubros} 
              onEdit={(r) => setRubroModal({ isOpen: true, data: r })}
              onAdd={() => setRubroModal({ isOpen: true, data: null })}
            />
          )}
          {activeTab === 'departamentos' && (
            <DeptoTable 
              departamentos={initialDepartamentos} 
              onEdit={(d) => setDeptoModal({ isOpen: true, data: d })}
              onAdd={() => setDeptoModal({ isOpen: true, data: null })}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <RubroModal 
        isOpen={rubroModal.isOpen} 
        onClose={() => setRubroModal({ ...rubroModal, isOpen: false })} 
        rubro={rubroModal.data}
      />
      <DeptoModal 
        isOpen={deptoModal.isOpen} 
        onClose={() => setDeptoModal({ ...deptoModal, isOpen: false })} 
        departamento={deptoModal.data}
      />
      <ServicioModal 
        isOpen={servicioModal.isOpen} 
        onClose={() => setServicioModal({ ...servicioModal, isOpen: false })} 
        servicio={servicioModal.data}
        rubros={initialRubros}
        departamentos={initialDepartamentos}
        cuentas={cuentas}
        empresaId={empresaId}
      />
    </div>
  );
}
