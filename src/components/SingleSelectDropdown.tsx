
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

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
  const [isOpen, setIsOpen]         = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pos, setPos]               = useState({ top: 0, left: 0, width: 0, openUp: false });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const updatePos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < 280 && r.top > 280;
    setPos({ top: openUp ? r.top - 4 : r.bottom + 4, left: r.left, width: r.width, openUp });
  };

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(t)) {
        // also check the portal dropdown
        const portal = document.getElementById('ssd-portal');
        if (!portal || !portal.contains(t)) { setIsOpen(false); setSearchTerm(''); }
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 60);
  }, [isOpen]);

  const filtered = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const selected = options.find(o => o.value === value);

  const dropdown = isOpen ? (
    <div
      id="ssd-portal"
      style={{
        position: 'fixed',
        top: pos.openUp ? undefined : pos.top,
        bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
      }}
      className="bg-[#131318] border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
    >
      {/* Search */}
      <div className="p-2.5 border-b border-white/[0.05] sticky top-0 bg-[#131318]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
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
      {/* Options — fixed height with real scroll */}
      <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
        {filtered.length === 0 ? (
          <p className="px-4 py-5 text-xs text-white/30 text-center">No results</p>
        ) : filtered.map(opt => {
          const isSel = opt.value === value;
          return (
            <button key={opt.value} type="button"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.05] text-left',
                isSel ? 'text-primary font-bold bg-primary/5' : 'text-white/60 hover:text-white',
              )}>
              <span className="truncate">{opt.label}</span>
              {isSel && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { if (!isOpen) { updatePos(); setIsOpen(true); } else { setIsOpen(false); setSearchTerm(''); } }}
        className={cn(
          'w-full flex items-center justify-between gap-2 bg-[#0c0c10] border rounded-2xl px-4 py-3 text-sm transition-all text-left',
          isOpen ? 'border-primary/50 bg-[#0e0e14]' : 'border-white/[0.07] hover:border-white/15',
          selected ? 'text-white' : 'text-white/25',
        )}
      >
        <span className="flex-1 truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={cn('w-4 h-4 text-white/30 shrink-0 transition-transform duration-200', isOpen && 'rotate-180 text-primary')} />
      </button>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div key="ssd" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}
              style={{ position: 'fixed', top: pos.openUp ? undefined : pos.top, bottom: pos.openUp ? window.innerHeight - pos.top : undefined, left: pos.left, width: pos.width, zIndex: 99999 }}
              className="bg-[#131318] border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="p-2.5 border-b border-white/[0.05]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  <input ref={inputRef} type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Search cities..."
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-primary/30 placeholder:text-white/20" />
                </div>
              </div>
              <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: '220px' }}>
                {filtered.length === 0
                  ? <p className="px-4 py-5 text-xs text-white/30 text-center">No results</p>
                  : filtered.map(opt => {
                    const isSel = opt.value === value;
                    return (
                      <button key={opt.value} type="button"
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                        className={cn('w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.05] text-left', isSel ? 'text-primary font-bold bg-primary/5' : 'text-white/60 hover:text-white')}>
                        <span className="truncate">{opt.label}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                      </button>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
