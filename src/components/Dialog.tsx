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
}

export function Dialog({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  hideHeader, 
  noPadding, 
  maxWidth = 'max-w-4xl',
  preventCloseOnOutsideClick = false,
  preventCloseOnEscape = false
}: DialogProps) {
  
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !preventCloseOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, preventCloseOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={() => !preventCloseOnOutsideClick && onClose()}
      />
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in fade-in zoom-in duration-200`}>
        {!hideHeader && (
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            {title ? (
              <h3 className="text-xl font-bold text-slate-800 font-display">{title}</h3>
            ) : <div></div>}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
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
