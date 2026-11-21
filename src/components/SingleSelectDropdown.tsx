
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SingleSelectDropdownProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SingleSelectDropdown({
  options, value = '', onChange,
  placeholder = 'Select...', className,
}: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen]       = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine open direction on every open
  useEffect(() => {
    if (!isOpen || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenUpward(spaceBelow < 320);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  // Click outside
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false); setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const filtered  = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const selected  = options.find(o => o.value === value);

  return (
    <div className={cn('relative w-full', className)} ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-2 bg-[#0c0c10] border rounded-2xl px-4 py-3 text-sm transition-all text-left',
          isOpen ? 'border-primary/50 bg-[#0e0e14]' : 'border-white/[0.07] hover:border-white/15',
          selected ? 'text-white' : 'text-white/25',
        )}
      >
        <span className="flex-1 truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={cn('w-4 h-4 text-white/30 shrink-0 transition-transform duration-200', isOpen && 'rotate-180 text-primary')} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={cn(
              'absolute left-0 right-0 z-[9999] bg-[#131318] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden',
              openUpward ? 'bottom-full mb-2' : 'top-full mt-2',
            )}
          >
            {/* Search */}
            <div className="p-2.5 border-b border-white/[0.05]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  placeholder="Search..."
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary/30 placeholder:text-white/20"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto scrollbar-hide py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-5 text-xs text-white/30 text-center">No results</p>
              ) : filtered.map(opt => {
                const isSel = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={e => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.04] text-left',
                      isSel ? 'text-primary font-bold bg-primary/5' : 'text-white/60 hover:text-white',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSel && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
