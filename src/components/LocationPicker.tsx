import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Map, Marker } from 'pigeon-maps';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LocationValue { address: string; latitude: string | number; longitude: string | number; }
interface LocationPickerProps {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  placeholder?: string;
}

// Mumbai fallback until a point is chosen
const DEFAULT_CENTER: [number, number] = [19.0760, 72.8777];
const NOMINATIM = 'https://nominatim.openstreetmap.org';

// Replaces manual Address + Latitude + Longitude inputs with one address
// search (OpenStreetMap Nominatim, keyless) that fills lat/lng automatically,
// plus a tap-to-pin map. Produces exactly { address, latitude, longitude }
// so the existing event/venue submit (which sends city_id + latitude +
// longitude to the backend) needs no other change.
export function LocationPicker({ value, onChange, placeholder = 'Search address or place...' }: LocationPickerProps) {
  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => { setQuery(value?.address || ''); }, [value?.address]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const search = useCallback((q: string) => {
    if (!q || q.trim().length < 3) { setResults([]); return; }
    setLoading(true);
    fetch(`${NOMINATIM}/search?format=json&addressdetails=1&dedupe=1&countrycodes=in&limit=8&q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((data) => { setResults(Array.isArray(data) ? data : []); setOpen(true); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const onInput = (q: string) => {
    setQuery(q);
    onChange({ ...value, address: q });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 450);
  };

  const pick = (r: any) => {
    setQuery(r.display_name);
    setOpen(false);
    onChange({ address: r.display_name, latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) });
  };

  const setPoint = (lat: number, lon: number) => {
    onChange({ ...value, latitude: lat, longitude: lon });
    fetch(`${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((d) => { if (d?.display_name) { setQuery(d.display_name); onChange({ address: d.display_name, latitude: lat, longitude: lon }); } })
      .catch(() => {});
  };

  const lat = parseFloat(String(value?.latitude));
  const lon = parseFloat(String(value?.longitude));
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0);
  const center: [number, number] = hasPoint ? [lat, lon] : DEFAULT_CENTER;

  return (
    <div className="space-y-4">
      <div className="relative" ref={boxRef}>
        <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-white/20 z-10" />
        <input
          value={query}
          onChange={(e) => onInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#09090B] border border-white/5 hover:border-white/10 focus:border-primary rounded-2xl pl-14 pr-10 py-4 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
        />
        {loading && <Loader2 className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin" />}
        <AnimatePresence>
          {open && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto scrollbar-hide"
            >
              {results.map((r) => (
                <button key={r.place_id} type="button" onClick={() => pick(r)}
                  className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="leading-snug">{r.display_name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 240 }}>
        <Map height={240} center={center} defaultZoom={hasPoint ? 15 : 11} onClick={({ latLng }: any) => setPoint(latLng[0], latLng[1])}>
          {hasPoint && <Marker width={44} anchor={[lat, lon]} color="#FF2D9A" />}
        </Map>
      </div>

      {hasPoint && (
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest ml-1">
          Pinned {lat.toFixed(5)}, {lon.toFixed(5)} — tap the map to adjust
        </p>
      )}
    </div>
  );
}
