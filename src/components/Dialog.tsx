"use client";

import React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  hideHeader?: boolean;
  noPadding?: boolean;
  maxWidth?: string;
  preventCloseOnOutsideClick?: boolean;
  preventCloseOnEscape?: boolean;
  zIndex?: string;
}

/**
 * Componente de diálogo (modal) reutilizable.
 * Soporta personalización de ancho, cabecera y comportamiento de cierre.
 * 
 * @param {DialogProps} props - Propiedades del diálogo.
 * @returns {JSX.Element | null} El diálogo renderizado o null si está cerrado.
 */
export function Dialog({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  hideHeader, 
  noPadding, 
  maxWidth = 'max-w-4xl',
  preventCloseOnOutsideClick = false,
  preventCloseOnEscape = false,
  zIndex = 'z-[1000]'
}: DialogProps) {
  
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !preventCloseOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      // Prevenir scroll en el body cuando el diálogo está abierto
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, preventCloseOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm dark:bg-black/60" 
        onClick={() => !preventCloseOnOutsideClick && onClose()}
      />
      <div className={`relative bg-card border border-border rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in fade-in zoom-in duration-200`}>
        {!hideHeader && (
          <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/30">
            {title ? (
              <h3 className="text-xl font-bold text-foreground font-display">{title}</h3>
            ) : <div></div>}
            <button 
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              aria-label="Cerrar diálogo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className={noPadding ? "" : "p-8"}>
          {children}
        </div>
      </div>
    </div>
  );
}
