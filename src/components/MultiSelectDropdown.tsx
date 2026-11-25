import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface MultiSelectDropdownProps {
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelectDropdown({ options, value = [], onChange, placeholder = "Select...", className }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 6, left: r.left, width: r.width });
  };

  useEffect(() => {
    if (isOpen) updatePos();
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const toggleOption = (val: string) => onChange(value.includes(val) ? value.filter(v => v !== val) : [...value, val]);

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.97, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 99999 }}
          className="rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden bg-[#0f0f1a] border border-white/[0.08]"
        >
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2 text-[13px] text-white placeholder:text-white/15 focus:outline-none focus:border-[#FF2D9A]/30 transition-all"
                onClick={e => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1.5 scrollbar-hide">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-[12px] text-white/20 text-center font-bold uppercase tracking-widest">No results</div>
            ) : filteredOptions.map(option => {
              const isSelected = value.includes(option.value);
              return (
                <button key={option.value} type="button"
                  onClick={e => { e.stopPropagation(); toggleOption(option.value); }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-all",
                    isSelected ? "text-[#FF2D9A] bg-[#FF2D9A]/[0.06] font-bold" : "text-white/50 hover:text-white hover:bg-white/[0.03] font-medium"
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#FF2D9A]/20 border border-[#FF2D9A]/40 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#FF2D9A]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {value.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{value.length} selected</span>
              <button onClick={() => onChange([])} className="text-[10px] font-black text-[#FF2D9A]/60 hover:text-[#FF2D9A] uppercase tracking-widest transition-colors">Clear all</button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("relative w-full", className)}>
      <div ref={triggerRef}
        onClick={() => { setIsOpen(!isOpen); updatePos(); }}
        className={cn(
          "w-full flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 text-sm cursor-pointer min-h-[48px] transition-all",
          "bg-[#0c0c14] border",
          isOpen ? "border-[#FF2D9A]/50 shadow-[0_0_0_3px_rgba(255,45,154,0.08)]" : "border-white/[0.07] hover:border-white/15"
        )}
      >
        {value.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {value.map(val => {
              const option = options.find(o => o.value === val);
              return (
                <span key={val} className="inline-flex items-center gap-1.5 bg-[#FF2D9A]/15 text-[#FF2D9A] text-[10px] font-black px-2.5 py-1 rounded-full border border-[#FF2D9A]/25 uppercase tracking-wide">
                  {option?.label || val}
                  <X className="w-2.5 h-2.5 cursor-pointer hover:text-white transition-colors"
                    onClick={e => { e.stopPropagation(); onChange(value.filter(v => v !== val)); }} />
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-white/20 flex-1 text-[13px]">{placeholder}</span>
        )}
        <ChevronDown className={cn("w-4 h-4 text-white/20 shrink-0 transition-transform duration-200", isOpen && "rotate-180 text-[#FF2D9A]/60")} />
      </div>
      {typeof document !== 'undefined' && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
}
