import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface LocationValue {
  address: string;
  latitude: string;
  longitude: string;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (val: LocationValue) => void;
  placeholder?: string;
  className?: string;
}

// Simple geocoding via OpenStreetMap Nominatim (free, no API key needed)
async function geocode(query: string): Promise<{ display_name: string; lat: string; lon: string }[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return [];
  return res.json();
}

export function LocationPicker({ value, onChange, placeholder = 'Search address...', className }: LocationPickerProps) {
  const [query, setQuery] = useState(value.address || '');
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query if value.address changes externally
  useEffect(() => {
    if (value.address && value.address !== query) setQuery(value.address);
  }, [value.address]);

  // Click-outside closes dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const hits = await geocode(val);
        setResults(hits);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelect = (r: { display_name: string; lat: string; lon: string }) => {
    setQuery(r.display_name);
    setResults([]);
    setIsOpen(false);
    onChange({ address: r.display_name, latitude: r.lat, longitude: r.lon });
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onChange({ address: '', latitude: '', longitude: '' });
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Input */}
      <div className="relative group">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#09090B] border border-white/5 rounded-[28px] pl-11 pr-10 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 placeholder:text-white/10 font-medium"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        )}
        {!isSearching && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Coordinates display */}
      {value.latitude && value.longitude && (
        <p className="text-[10px] text-emerald-400/70 font-mono mt-2 ml-2">
          {parseFloat(value.latitude).toFixed(5)}, {parseFloat(value.longitude).toFixed(5)}
        </p>
      )}

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0B0B0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
            >
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-white/70 group-hover:text-white transition-colors leading-snug">
                {r.display_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
