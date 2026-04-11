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
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const terms = searchTerm.toLowerCase().split(' ').filter(t => t.length > 0);
    
    setSelectedIndex(0); // Reset selection on new search

    if (terms.length === 0) {
      setFiltered(cuentas);
      return;
    }

    setFiltered(
      cuentas.filter(c => {
        const name = c.nombre.toLowerCase();
        const code = c.codigo.toLowerCase();
        const shortCode = c.codigoCorto?.toString() || '';
        
        // Match ALL terms (AND logic)
        return terms.every(term => 
          name.includes(term) || 
          code.includes(term) || 
          shortCode.includes(term)
        );
      })
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
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter' && filtered.length > 0) {
                e.preventDefault();
                onSelect(filtered[selectedIndex]);
                onClose();
              }
            }}
          />
        </div>

        <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar pb-2">
          {filtered.length > 0 ? (
            filtered.map((cuenta, idx) => (
              <button
                key={cuenta.id}
                onClick={() => {
                  onSelect(cuenta);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${
                  idx === selectedIndex ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'hover:bg-slate-50'
                }`}
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
