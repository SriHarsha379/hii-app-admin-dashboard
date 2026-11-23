const fs = require('fs');

// ── 1. SingleSelectDropdown — fix max-height + scrolling ────────────────────
fs.writeFileSync('src/components/SingleSelectDropdown.tsx', `
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
`, 'utf8');
console.log('✅ SingleSelectDropdown.tsx — portal + scrollable list');

// ── 2. LocationPicker — show mini map after selection ────────────────────────
fs.writeFileSync('src/components/LocationPicker.tsx', `
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Loader2, X, Navigation, Map } from 'lucide-react';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';

interface LocationValue { address: string; latitude: string; longitude: string; }
interface LocationPickerProps {
  value: LocationValue; onChange: (val: LocationValue) => void;
  placeholder?: string; className?: string;
}

async function geocode(q: string) {
  const url = \`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(q)}&format=json&limit=6&countrycodes=in\`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return [];
  return res.json() as Promise<{ display_name: string; lat: string; lon: string }[]>;
}

export function LocationPicker({ value, onChange, placeholder = 'Search address...', className }: LocationPickerProps) {
  const [query, setQuery]           = useState(value.address || '');
  const [results, setResults]       = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen]         = useState(false);
  const [dropPos, setDropPos]       = useState({ top: 0, left: 0, width: 0 });
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (value.address && value.address !== query) setQuery(value.address); }, [value.address]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('lp-portal');
        if (!portal || !portal.contains(e.target as Node)) setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const updatePos = () => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 6, left: r.left, width: r.width });
  };

  const handleInput = (val: string) => {
    setQuery(val); updatePos(); setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try { setResults(await geocode(val)); }
      catch { setResults([]); }
      finally { setIsSearching(false); }
    }, 450);
  };

  const handleSelect = (r: { display_name: string; lat: string; lon: string }) => {
    setQuery(r.display_name); setResults([]); setIsOpen(false);
    onChange({ address: r.display_name, latitude: r.lat, longitude: r.lon });
  };

  const handleClear = () => {
    setQuery(''); setResults([]);
    onChange({ address: '', latitude: '', longitude: '' });
  };

  const hasCoords = !!(value.latitude && value.longitude);
  const mapSrc = hasCoords
    ? \`https://www.openstreetmap.org/export/embed.html?bbox=\${(+value.longitude-0.01).toFixed(4)},\${(+value.latitude-0.01).toFixed(4)},\${(+value.longitude+0.01).toFixed(4)},\${(+value.latitude+0.01).toFixed(4)}&layer=mapnik&marker=\${value.latitude},\${value.longitude}\`
    : '';

  return (
    <div ref={containerRef} className={cn('relative w-full space-y-2', className)}>
      {/* Input row */}
      <div className="relative group">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { if (query) { updatePos(); setIsOpen(true); } }}
          placeholder={placeholder}
          className="w-full bg-[#0c0c10] border border-white/[0.07] rounded-2xl pl-11 pr-10 py-3 text-sm text-white focus:outline-none focus:border-primary/40 transition-all hover:border-white/15 placeholder:text-white/15"
        />
        {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
        {!isSearching && query && (
          <button type="button" onClick={handleClear} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Coords badge */}
      {hasCoords && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-[10px] text-emerald-400 font-mono flex-1">
            {parseFloat(value.latitude).toFixed(5)}, {parseFloat(value.longitude).toFixed(5)}
          </span>
          <span className="text-[9px] text-emerald-400/50 font-black uppercase tracking-widest">Pinned ✓</span>
        </div>
      )}

      {/* Mini map */}
      {hasCoords && (
        <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0c0c10]" style={{ height: '160px' }}>
          <iframe
            title="location-map"
            src={mapSrc}
            width="100%"
            height="160"
            style={{ border: 0, display: 'block', filter: 'invert(0.9) hue-rotate(180deg) brightness(0.85)' }}
            loading="lazy"
          />
        </div>
      )}

      {/* Portal results */}
      {typeof document !== 'undefined' && createPortal(
        isOpen && results.length > 0 ? (
          <div id="lp-portal"
            style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 99999 }}
            className="bg-[#0d0d12] border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
              {results.map((r, i) => (
                <button key={i} type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(r); }}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0 group">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-white/60 group-hover:text-white transition-colors leading-snug">{r.display_name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null,
        document.body
      )}
    </div>
  );
}
`, 'utf8');
console.log('✅ LocationPicker.tsx — mini map + portal results');

// ── 3. Patch Clubs.tsx Step 3 — time picker per day + inline validation ──────
let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Replace the working hours step with per-day time pickers
const oldStep3 = `                    {venueStep === 3 && (
                      <motion.div key="vs3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <FormSection title="Opening Hours" icon={<Clock className="w-4 h-4" />}>
                          <div className="space-y-6">
                            {workingHours.map((item, index) => (
                              <div key={item.day} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 group p-4 rounded-[28px] hover:bg-white/[0.02] transition-all">
                                <button type="button" onClick={() => toggleDay(index)} className={cn('min-w-[140px] px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all border', item.active ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(255,45,154,0.3)] scale-105' : 'bg-[#09090B] border-white/5 text-white/20 hover:text-white/60')}>{item.day}</button>
                                <AnimatePresence>
                                  {item.active && (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 w-full">
                                      <RefinedField label="Open Hours" name={\`hours-\${index}\`} value={item.time} onChange={(e: any) => updateDayTime(index, e.target.value)} placeholder="22:00 - 04:00" icon={<Clock className="w-4 h-4" />} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                          <div className="mt-8 p-10 rounded-[40px] bg-blue-500/5 border border-blue-500/10 flex items-start gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20"><Info className="w-6 h-6" /></div>
                            <div className="space-y-2"><h4 className="text-xs font-black text-white uppercase tracking-widest">Note</h4><p className="text-[13px] text-white/40 leading-relaxed font-medium">Activating a day will automatically use the same hours as the previously selected day.</p></div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}`;

const newStep3 = `                    {venueStep === 3 && (
                      <motion.div key="vs3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-black text-white/70 uppercase tracking-[0.25em]">Opening Hours</h4>
                              <p className="text-[9px] text-white/30 mt-0.5">Toggle days on/off and set opening & closing time per day</p>
                            </div>
                          </div>

                          <div className="p-4 space-y-2">
                            {workingHours.map((item, index) => (
                              <div key={item.day} className={cn(
                                'rounded-xl border transition-all overflow-hidden',
                                item.active ? 'border-primary/20 bg-primary/[0.03]' : 'border-white/[0.05] bg-white/[0.01]'
                              )}>
                                {/* Day toggle row */}
                                <div className="flex items-center gap-3 px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleDay(index)}
                                    className={cn(
                                      'relative w-9 h-5 rounded-full transition-all shrink-0',
                                      item.active ? 'bg-primary' : 'bg-white/10'
                                    )}
                                  >
                                    <span className={cn(
                                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                                      item.active ? 'left-[18px]' : 'left-0.5'
                                    )} />
                                  </button>
                                  <span className={cn(
                                    'text-xs font-black uppercase tracking-widest flex-1 transition-colors',
                                    item.active ? 'text-white' : 'text-white/30'
                                  )}>
                                    {item.day}
                                  </span>
                                  {item.active && (
                                    <span className="text-[10px] text-primary/70 font-bold">
                                      {item.openTime || '22:00'} – {item.closeTime || '04:00'}
                                    </span>
                                  )}
                                </div>

                                {/* Time pickers — only when active */}
                                <AnimatePresence>
                                  {item.active && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                                        <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Opens at</label>
                                          <input
                                            type="time"
                                            value={item.openTime || '22:00'}
                                            onChange={e => {
                                              const nh = [...workingHours];
                                              nh[index] = { ...nh[index], openTime: e.target.value, time: \`\${e.target.value} - \${nh[index].closeTime || '04:00'}\` };
                                              setWorkingHours(nh);
                                            }}
                                            className="w-full bg-[#0c0c10] border border-white/[0.07] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/40 transition-all [color-scheme:dark]"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Closes at</label>
                                          <input
                                            type="time"
                                            value={item.closeTime || '04:00'}
                                            onChange={e => {
                                              const nh = [...workingHours];
                                              nh[index] = { ...nh[index], closeTime: e.target.value, time: \`\${nh[index].openTime || '22:00'} - \${e.target.value}\` };
                                              setWorkingHours(nh);
                                            }}
                                            className="w-full bg-[#0c0c10] border border-white/[0.07] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/40 transition-all [color-scheme:dark]"
                                          />
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quick presets */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 space-y-3">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Quick Presets</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'Mon–Fri', days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
                              { label: 'Weekends', days: ['Saturday','Sunday'] },
                              { label: 'All Week', days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
                              { label: 'Thu–Sun', days: ['Thursday','Friday','Saturday','Sunday'] },
                            ].map(preset => (
                              <button key={preset.label} type="button"
                                onClick={() => setWorkingHours(prev => prev.map(h => ({
                                  ...h,
                                  active: preset.days.includes(h.day),
                                  openTime: preset.days.includes(h.day) ? (h.openTime || '22:00') : h.openTime,
                                  closeTime: preset.days.includes(h.day) ? (h.closeTime || '04:00') : h.closeTime,
                                  time: preset.days.includes(h.day) ? \`\${h.openTime || '22:00'} - \${h.closeTime || '04:00'}\` : h.time,
                                })))}
                                className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-[10px] font-black text-white/50 uppercase tracking-widest hover:text-white hover:border-primary/30 hover:bg-primary/5 transition-all">
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Summary */}
                        {workingHours.some(h => h.active) && (
                          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
                            <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest mb-2">Schedule Summary</p>
                            <div className="space-y-1">
                              {workingHours.filter(h => h.active).map(h => (
                                <div key={h.day} className="flex items-center justify-between text-xs">
                                  <span className="text-white/60 font-bold">{h.day}</span>
                                  <span className="text-emerald-400 font-mono text-[11px]">{h.openTime || '22:00'} – {h.closeTime || '04:00'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </motion.div>
                    )}`;

if (clubs.includes(oldStep3)) {
  clubs = clubs.replace(oldStep3, newStep3);
  console.log('✅ Step 3 working hours replaced with per-day time pickers');
} else {
  console.log('⚠️  Step 3 block not found — check manually');
}

// ── 4. Replace alert() validation with inline toast-style errors ─────────────
// Replace alert calls in the Next button with inline state
clubs = clubs.replace(
  `onClick={() => {
                      if (venueStep === 1) {
                        if (!venueFormData.name) { alert('Enter a club name'); return; }
                        if (!selectedClub && !venueFormData.vendor_id) { alert('Select a vendor'); return; }
                        if (!venueFormData.type?.length) { alert('Select a category'); return; }
                      }
                      if (venueStep === 2 && !venueFormData.city) { alert('Select a city'); return; }
                      setVenueStep(v => v + 1);
                    }}`,
  `onClick={() => {
                      if (venueStep === 1) {
                        if (!venueFormData.name) { setVenueError('Enter a club name'); return; }
                        if (!selectedClub && !venueFormData.vendor_id) { setVenueError('Select a vendor / organiser'); return; }
                        if (!venueFormData.type?.length) { setVenueError('Select at least one category'); return; }
                      }
                      if (venueStep === 2 && !venueFormData.city) { setVenueError('Select a city before continuing'); return; }
                      setVenueError('');
                      setVenueStep(v => v + 1);
                    }}`
);

// Add venueError state after the existing venueStep state
clubs = clubs.replace(
  `  const [venueStep, setVenueStep] = useState(1);`,
  `  const [venueStep, setVenueStep] = useState(1);
  const [venueError, setVenueError] = useState('');`
);

// Add error display above the footer buttons — find the footer div
clubs = clubs.replace(
  `<div className="px-6 py-5 border-t border-white/[0.05] flex items-center justify-between bg-[#0a0a0f]">`,
  `{venueError && (
              <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-400 font-bold">{venueError}</p>
              </div>
            )}
            <div className="px-6 py-5 border-t border-white/[0.05] flex items-center justify-between bg-[#0a0a0f]">`
);

// Also clear error on close
clubs = clubs.replace(
  `onClick={() => { setIsCreatingClub(false); resetVenueForm(); }}
                  className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 transition-all">
                  Cancel`,
  `onClick={() => { setIsCreatingClub(false); resetVenueForm(); setVenueError(''); }}
                  className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 transition-all">
                  Cancel`
);

// Also clear venueError on resetVenueForm
clubs = clubs.replace(
  `    setWorkingHours(prev => prev.map(h => ({ ...h, active: false })));
    setVenueStep(1); setIsEditingVenue(false);`,
  `    setWorkingHours(prev => prev.map(h => ({ ...h, active: false })));
    setVenueStep(1); setIsEditingVenue(false); setVenueError('');`
);

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('✅ Clubs.tsx — Step 3 time pickers + inline validation');

console.log('\n✅ All done');
