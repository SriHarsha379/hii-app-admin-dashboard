const fs = require('fs');

// ── 1. Fix SingleSelectDropdown — always open UPWARD inside modals ───────────
fs.writeFileSync('src/components/SingleSelectDropdown.tsx', `
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
`, 'utf8');
console.log('✅ SingleSelectDropdown.tsx written — upward-aware');

// ── 2. Fix LocationPicker — cleaner design, z-index fix ──────────────────────
fs.writeFileSync('src/components/LocationPicker.tsx', `
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Loader2, X, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';

interface LocationValue {
  address: string; latitude: string; longitude: string;
}
interface LocationPickerProps {
  value: LocationValue;
  onChange: (val: LocationValue) => void;
  placeholder?: string;
  className?: string;
}

async function geocode(q: string) {
  const url = \`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(q)}&format=json&limit=6&countrycodes=in\`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return [];
  return res.json() as Promise<{ display_name: string; lat: string; lon: string }[]>;
}

export function LocationPicker({ value, onChange, placeholder = 'Search address...', className }: LocationPickerProps) {
  const [query, setQuery]         = useState(value.address || '');
  const [results, setResults]     = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen]       = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.address && value.address !== query) setQuery(value.address);
  }, [value.address]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const updatePos = () => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setDropdownPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width });
  };

  const handleInput = (val: string) => {
    setQuery(val);
    updatePos();
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try { setResults(await geocode(val)); }
      catch { setResults([]); }
      finally { setIsSearching(false); }
    }, 400);
  };

  const handleSelect = (r: { display_name: string; lat: string; lon: string }) => {
    setQuery(r.display_name); setResults([]); setIsOpen(false);
    onChange({ address: r.display_name, latitude: r.lat, longitude: r.lon });
  };

  const handleClear = () => {
    setQuery(''); setResults([]);
    onChange({ address: '', latitude: '', longitude: '' });
  };

  const hasCoords = value.latitude && value.longitude;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Input */}
      <div className="relative group">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => {
            if (query) { updatePos(); setIsOpen(true); }
          }}
          placeholder={placeholder}
          className="w-full bg-[#0c0c10] border border-white/[0.07] rounded-2xl pl-11 pr-10 py-3 text-sm text-white focus:outline-none focus:border-primary/40 transition-all hover:border-white/15 placeholder:text-white/15 font-medium"
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
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-[10px] text-emerald-400 font-mono">
            {parseFloat(value.latitude).toFixed(5)}, {parseFloat(value.longitude).toFixed(5)}
          </span>
          <span className="ml-auto text-[9px] text-emerald-400/50 font-black uppercase tracking-widest">Pinned</span>
        </div>
      )}

      {/* Portal dropdown — renders above everything */}
      {isOpen && results.length > 0 && createPortal(
        <div
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 99999 }}
          className="bg-[#0d0d12] border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden"
        >
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0 group">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-white/60 group-hover:text-white transition-colors leading-snug">{r.display_name}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
`, 'utf8');
console.log('✅ LocationPicker.tsx written — portal dropdown');

// ── 3. Patch Clubs.tsx Step 2 — full layout rewrite ─────────────────────────
let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// Replace the entire venueStep === 2 block
const step2Old = `                    {venueStep === 2 && (
                      <motion.div key="vs2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                        <FormSection title="Location Details" icon={<MapPin className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">City</label>
                              <SingleSelectDropdown options={(Array.isArray(cities) ? cities : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((city: any) => ({ label: city.city_name, value: city._id }))} value={venueFormData.city} onChange={(val: string) => setVenueFormData({ ...venueFormData, city: val })} placeholder="Select City..." />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                              <LocationPicker value={{ address: venueFormData.address, latitude: venueFormData.latitude, longitude: venueFormData.longitude }} onChange={loc => setVenueFormData({ ...venueFormData, address: loc.address, latitude: loc.latitude, longitude: loc.longitude })} placeholder="Search address or place..." />
                            </div>
                          </div>
                        </FormSection>
                        <FormSection title="Club Media" icon={<Layers className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 gap-12">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Cover Images</label>
                                <button type="button" onClick={addVenueLandscapeSlot} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white transition-all"><Plus className="w-4 h-4" /> Add Image</button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {venueLandscapePreviews.map((preview, index) => (
                                  <label key={index} className="group relative aspect-video rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl transition-all hover:border-primary/40 cursor-pointer block">
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleVenueLandscapeChange(e, index)} />
                                    {preview ? (
                                      <><img src={preview} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change</span></div></>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 group-hover:text-primary transition-colors"><Upload className="w-10 h-10" /><span className="text-[9px] font-black uppercase tracking-widest">Slot {index + 1}</span></div>
                                    )}
                                    <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); removeVenueLandscapeSlot(index); }} className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-5 h-5" /></button>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-6">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Profile Photo</label>
                              <label className="aspect-[9/16] max-w-[240px] mx-auto rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl group relative cursor-pointer hover:border-blue-400/40 transition-all block">
                                <input ref={venuePortraitRef} type="file" accept="image/*" className="hidden" onChange={handleVenuePortraitChange} />
                                {venuePortraitPreview ? (
                                  <><img src={venuePortraitPreview} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change</span></div></>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 group-hover:text-blue-400 transition-colors"><Upload className="w-10 h-10 group-hover:scale-110 transition-all" /><span className="text-[9px] font-black uppercase tracking-widest">Select Photo</span></div>
                                )}
                              </label>
                            </div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}`;

const step2New = `                    {venueStep === 2 && (
                      <motion.div key="vs2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">

                        {/* ── City + Location ── */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-[11px] font-black text-white/70 uppercase tracking-[0.25em]">Location</h4>
                          </div>
                          <div className="p-5 space-y-4">
                            {/* City selector */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">City</label>
                              <SingleSelectDropdown
                                options={(Array.isArray(cities) ? cities : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((city: any) => ({ label: city.city_name, value: city._id }))}
                                value={venueFormData.city}
                                onChange={(val: string) => setVenueFormData({ ...venueFormData, city: val })}
                                placeholder="Select city..."
                              />
                            </div>
                            {/* Address search */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Address / Pin Location</label>
                              <LocationPicker
                                value={{ address: venueFormData.address, latitude: venueFormData.latitude, longitude: venueFormData.longitude }}
                                onChange={loc => setVenueFormData({ ...venueFormData, address: loc.address, latitude: loc.latitude, longitude: loc.longitude })}
                                placeholder="Search address, landmark or place..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* ── Profile Photo ── */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-[11px] font-black text-white/70 uppercase tracking-[0.25em]">Profile Photo</h4>
                              <p className="text-[9px] text-white/30 mt-0.5">Portrait image shown on the club card</p>
                            </div>
                          </div>
                          <div className="p-5">
                            <label className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-blue-400/30 hover:bg-blue-500/[0.03] transition-all cursor-pointer group">
                              <input ref={venuePortraitRef} type="file" accept="image/*" className="hidden" onChange={handleVenuePortraitChange} />
                              {venuePortraitPreview ? (
                                <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                  <img src={venuePortraitPreview} alt="" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <Upload className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-16 h-20 rounded-xl bg-white/[0.03] border border-white/[0.06] border-dashed flex items-center justify-center shrink-0 group-hover:border-blue-400/40 transition-colors">
                                  <Upload className="w-5 h-5 text-white/20 group-hover:text-blue-400 transition-colors" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">
                                  {venuePortraitPreview ? 'Change profile photo' : 'Upload profile photo'}
                                </p>
                                <p className="text-[10px] text-white/30 mt-0.5">Portrait ratio recommended (3:4)</p>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* ── Cover / Gallery Images ── */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.04]">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                <Layers className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h4 className="text-[11px] font-black text-white/70 uppercase tracking-[0.25em]">Cover Gallery</h4>
                                <p className="text-[9px] text-white/30 mt-0.5">Landscape images shown in the venue gallery</p>
                              </div>
                            </div>
                            <button type="button" onClick={addVenueLandscapeSlot}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shrink-0">
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          </div>
                          <div className="p-5">
                            <div className="grid grid-cols-2 gap-3">
                              {venueLandscapePreviews.map((preview, index) => (
                                <label key={index} className="group relative aspect-video rounded-xl bg-[#0c0c10] border border-white/[0.06] border-dashed overflow-hidden hover:border-primary/40 cursor-pointer transition-all block">
                                  <input type="file" accept="image/*" className="hidden" onChange={e => handleVenueLandscapeChange(e, index)} />
                                  {preview ? (
                                    <>
                                      <img src={preview} alt="" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Change</span>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/15 group-hover:text-primary/60 transition-colors">
                                      <Upload className="w-6 h-6" />
                                      <span className="text-[9px] font-black uppercase tracking-widest">Image {index + 1}</span>
                                    </div>
                                  )}
                                  {/* Remove button */}
                                  <button type="button"
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); removeVenueLandscapeSlot(index); }}
                                    className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/70 border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <X className="w-3 h-3" />
                                  </button>
                                </label>
                              ))}
                              {/* Empty add slot hint */}
                              {venueLandscapePreviews.length === 0 && (
                                <div className="col-span-2 py-8 text-center text-[10px] text-white/20 font-bold uppercase tracking-widest">
                                  No images added yet — click Add above
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    )}`;

if (clubs.includes(step2Old)) {
  clubs = clubs.replace(step2Old, step2New);
  console.log('✅ Step 2 layout replaced');
} else {
  console.log('⚠️  Step 2 block not found — check manually');
}

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('✅ Clubs.tsx written');

