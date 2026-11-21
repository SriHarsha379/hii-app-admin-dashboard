
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
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=in`;
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
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(+value.longitude-0.01).toFixed(4)},${(+value.latitude-0.01).toFixed(4)},${(+value.longitude+0.01).toFixed(4)},${(+value.latitude+0.01).toFixed(4)}&layer=mapnik&marker=${value.latitude},${value.longitude}`
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
