"use client";

import React, { useState, useEffect } from 'react';
import { Search, X, User, CreditCard, Hash } from 'lucide-react';
import { Dialog } from '../Dialog';

interface Entity {
  id: number;
  nombre: string;
  cuit: string | null;
  nroDoc: string | null;
}

interface EntitySearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entity: Entity) => void;
  entities: Entity[];
  title?: string;
}

export function EntitySearchDialog({ isOpen, onClose, onSelect, entities, title = "Buscar Docente" }: EntitySearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtered, setFiltered] = useState<Entity[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const terms = searchTerm.toLowerCase().split(' ').filter(t => t.length > 0);
    
    setSelectedIndex(0);

    if (terms.length === 0) {
      setFiltered(entities);
      return;
    }

    setFiltered(
      entities.filter(e => {
        const name = e.nombre.toLowerCase();
        const cuit = e.cuit?.toLowerCase() || '';
        const doc = e.nroDoc?.toLowerCase() || '';
        
        return terms.every(term => 
          name.includes(term) || 
          cuit.includes(term) || 
          doc.includes(term)
        );
      })
    );
  }, [searchTerm, entities]);

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="w-[500px] max-w-full -mt-4">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-hidden shadow-sm"
            placeholder="Buscar por nombre, CUIT o DNI..."
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
            filtered.map((entity, idx) => (
              <button
                key={entity.id}
                onClick={() => {
                  onSelect(entity);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${
                  idx === selectedIndex ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-700 group-hover:text-primary">{entity.nombre}</div>
                    <div className="flex gap-3 mt-0.5">
                      {entity.nroDoc && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <CreditCard className="w-3 h-3" />
                          DNI: {entity.nroDoc}
                        </div>
                      )}
                      {entity.cuit && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Hash className="w-3 h-3" />
                          CUIT: {entity.cuit}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm italic">
              No se encontraron docentes que coincidan.
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
