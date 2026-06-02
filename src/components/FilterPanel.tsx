import React, { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FilterPanelProps {
  children: React.ReactNode;
}

export function FilterPanel({ children }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-lg border transition-all ${isOpen ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'}`}
      >
        <Filter className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-[#0A0A0F] border border-white/10 rounded-xl shadow-2xl z-40"
          >
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5 rounded-t-xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Filters</h4>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
