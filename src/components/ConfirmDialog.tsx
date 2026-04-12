"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmación",
  description,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  variant = 'warning'
}: ConfirmDialogProps) {
  
  const variantStyles = {
    danger: "bg-red-500 hover:bg-red-600 shadow-red-200",
    warning: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
    primary: "bg-primary hover:bg-primary/90 shadow-primary/20"
  };

  const iconStyles = {
    danger: "text-red-500 bg-red-50",
    warning: "text-amber-500 bg-amber-50",
    primary: "text-primary bg-primary/10"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
          >
            {/* Header / Close */}
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-10 text-center">
              {/* Icon */}
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${iconStyles[variant]}`}>
                <AlertCircle className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
                {title}
              </h3>
              
              <p className="text-slate-500 text-sm leading-relaxed mb-10 font-medium px-4">
                {description}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${variantStyles[variant]}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
