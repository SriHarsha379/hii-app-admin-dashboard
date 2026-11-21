
import React from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

export function FormSection({ title, icon, children, className, description }: FormSectionProps) {
  return (
    <div className={cn('relative rounded-3xl border border-white/[0.06] bg-white/[0.015] overflow-hidden', className)}>
      {/* Top accent line */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-3 px-8 pt-7 pb-5 border-b border-white/[0.04]">
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h4 className="text-[11px] font-black text-white/70 uppercase tracking-[0.25em]">{title}</h4>
          {description && <p className="text-[10px] text-white/30 font-medium mt-0.5">{description}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {children}
      </div>
    </div>
  );
}

interface RefinedFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  value?: any;
  onChange?: (e: any) => void;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function RefinedField({ label, name, icon, error, hint, className, ...props }: RefinedFieldProps) {
  return (
    <div className={cn('space-y-2 group/field', className)}>
      <label className="flex items-center justify-between">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] transition-colors duration-200 group-focus-within/field:text-primary/80">
          {label}
        </span>
        {hint && <span className="text-[9px] text-white/20 font-medium normal-case tracking-normal">{hint}</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-primary/60 transition-colors duration-200 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          name={name}
          className={cn(
            'w-full bg-[#0c0c10] border rounded-2xl py-3.5 text-sm text-white transition-all duration-200',
            'placeholder:text-white/15 focus:outline-none',
            'hover:border-white/15 focus:border-primary/50 focus:bg-[#0e0e14]',
            icon ? 'pl-11 pr-4' : 'px-4',
            error
              ? 'border-red-500/40 bg-red-500/5'
              : 'border-white/[0.07]',
            props.readOnly && 'opacity-50 cursor-not-allowed',
          )}
        />
        {/* Focus underline */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 scale-x-0 group-focus-within/field:scale-x-100 transition-transform duration-300 rounded-full" />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-[10px] text-red-400/80 font-bold uppercase tracking-widest flex items-center gap-1.5 pl-1"
          >
            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
