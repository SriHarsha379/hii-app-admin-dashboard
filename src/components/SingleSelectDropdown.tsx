import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SingleSelectDropdownProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Single-select twin of MultiSelectDropdown — identical trigger/panel/search
// styling, used so City & Venue in the Create Event form match the Clubs &
// Venues dropdowns exactly. Selecting an option sets the value and closes.
export function SingleSelectDropdown({ options, value = '', onChange, placeholder = 'Select...', className }: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpwards(spaceBelow < 300 && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn('relative w-full', isOpen ? 'z-50' : 'z-10', className)} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors focus-within:border-primary cursor-pointer min-h-[46px]"
      >
        <span className={cn('flex-1 truncate', selected ? 'text-white' : 'text-muted-foreground')}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpwards ? 5 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUpwards ? 5 : -5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-full bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl overflow-hidden',
              openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
            )}
          >
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto scrollbar-hide py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">No results found</div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/5',
                        isSelected ? 'text-primary font-bold bg-primary/5' : 'text-muted-foreground'
                      )}
                    >
                      <span>{option.label}</span>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
