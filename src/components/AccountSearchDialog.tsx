"use client";

import React, { useState, useEffect } from 'react';
import { Search, X, Hash } from 'lucide-react';
import { Dialog } from './Dialog';

interface Account {
  id: number;
  codigo: string;
  codigoCorto: number | null;
  nombre: string;
}

interface AccountSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (account: Account) => void;
  cuentas: Account[];
}

export function AccountSearchDialog({ isOpen, onClose, onSelect, cuentas }: AccountSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtered, setFiltered] = useState<Account[]>([]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFiltered(
      cuentas.filter(c => 
        c.nombre.toLowerCase().includes(term) || 
        c.codigo.includes(term) || 
        c.codigoCorto?.toString().includes(term)
      )
    );
  }, [searchTerm, cuentas]);

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Buscar Cuenta Contable">
      <div className="w-[500px] max-w-full -mt-4">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-hidden shadow-sm"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered.length > 0) {
                onSelect(filtered[0]);
                onClose();
              }
            }}
          />
        </div>

        <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar pb-2">
          {filtered.length > 0 ? (
            filtered.map((cuenta) => (
              <button
                key={cuenta.id}
                onClick={() => {
                  onSelect(cuenta);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all text-left group"
              >
                <div>
                  <div className="font-bold text-sm text-slate-700 group-hover:text-primary">{cuenta.nombre}</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{cuenta.codigo}</div>
                </div>
                {cuenta.codigoCorto && (
                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-black text-slate-500">
                    <Hash className="w-3 h-3" />
                    {cuenta.codigoCorto}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm italic">
              No se encontraron cuentas que coincidan.
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
