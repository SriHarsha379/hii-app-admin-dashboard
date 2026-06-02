import React from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, icon, children, className }: FormSectionProps) {
  return (
    <div className={cn("bg-white/[0.02] border border-white/5 rounded-[40px] p-10 space-y-10 relative overflow-hidden group/section", className)}>
      <div className="flex items-center gap-4 relative z-10 transition-transform duration-500 group-hover/section:translate-x-1">
        {icon && (
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover/section:rotate-12 transition-transform duration-500 shadow-[0_0_20px_rgba(255,45,154,0.1)]">
            {icon}
          </div>
        )}
        <h4 className="text-[11px] font-black text-white/60 uppercase tracking-[0.3em] font-sans">{title}</h4>
      </div>
      <div className="relative z-10">
        {children}
      </div>
      <div className="absolute top-0 right-0 p-10 opacity-0 group-hover/section:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

interface RefinedFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  icon?: React.ReactNode;
  error?: string;
  value?: any;
  onChange?: (e: any) => void;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function RefinedField({ label, name, icon, error, className, ...props }: RefinedFieldProps) {
  return (
    <div className={cn("space-y-4 group/field", className)}>
      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within/field:text-primary">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-8 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-primary transition-all duration-300">
            {icon}
          </div>
        )}
        <input 
          {...props}
          name={name}
          className={cn(
            "w-full bg-[#09090B] border border-white/5 rounded-[24px] py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 placeholder:text-white/10",
            icon ? "pl-16 pr-8" : "px-8",
            error && "border-red-500/50"
          )}
        />
        <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 scale-x-0 group-focus-within/field:scale-x-100 transition-transform duration-500" />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest ml-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
