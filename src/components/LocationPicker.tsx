import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Vite/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

async function geocode(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return [];
  return res.json();
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  const json = await res.json();
  return json.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export function LocationPicker({ value, onChange, placeholder = 'Search address...', className }: LocationPickerProps) {
  const [query, setQuery] = useState(value.address || '');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const defaultLat = value.latitude ? parseFloat(value.latitude) : 20.5937;
  const defaultLng = value.longitude ? parseFloat(value.longitude) : 78.9629;

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView([defaultLat, defaultLng], value.latitude ? 14 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    if (value.latitude && value.longitude) {
      markerRef.current = L.marker([parseFloat(value.latitude), parseFloat(value.longitude)]).addTo(map);
    }

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      else markerRef.current = L.marker([lat, lng]).addTo(map);
      const addr = await reverseGeocode(lat, lng);
      setQuery(addr);
      onChange({ address: addr, latitude: String(lat), longitude: String(lng) });
    });

    leafletMap.current = map;
    return () => { map.remove(); leafletMap.current = null; };
  }, []);

  // Update marker when value changes externally
  useEffect(() => {
    if (!leafletMap.current || !value.latitude || !value.longitude) return;
    const lat = parseFloat(value.latitude);
    const lng = parseFloat(value.longitude);
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else markerRef.current = L.marker([lat, lng]).addTo(leafletMap.current);
    leafletMap.current.setView([lat, lng], 14);
    if (value.address && value.address !== query) setQuery(value.address);
  }, [value.latitude, value.longitude]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
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
      try { setResults(await geocode(val)); }
      catch { setResults([]); }
      finally { setIsSearching(false); }
    }, 400);
  };

  const handleSelect = (r: any) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setQuery(r.display_name);
    setResults([]);
    setIsOpen(false);
    onChange({ address: r.display_name, latitude: r.lat, longitude: r.lon });
    if (leafletMap.current) {
      leafletMap.current.setView([lat, lng], 15);
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      else markerRef.current = L.marker([lat, lng]).addTo(leafletMap.current);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onChange({ address: '', latitude: '', longitude: '' });
    if (markerRef.current && leafletMap.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full space-y-3', className)}>
      {/* Search input */}
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
        {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
        {!isSearching && query && (
          <button type="button" onClick={handleClear} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-14 left-0 right-0 z-[1000] bg-[#0B0B0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-white/70 group-hover:text-white leading-snug">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Coordinates */}
      {value.latitude && value.longitude && (
        <p className="text-[10px] text-emerald-400/70 font-mono ml-2">
          {parseFloat(value.latitude).toFixed(5)}, {parseFloat(value.longitude).toFixed(5)}
        </p>
      )}

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full rounded-2xl overflow-hidden border border-white/10"
        style={{ height: '280px', zIndex: 0 }}
      />
      <p className="text-[10px] text-white/30 ml-2">Click on the map to pin your exact location</p>
    </div>
  );
}
