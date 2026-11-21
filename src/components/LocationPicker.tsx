import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
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
  cityBias?: string;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.maps) { resolve(); return; }
    const existing = document.getElementById('google-maps-script');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    (window as any).gm_authFailure = () => {};
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

async function nominatimSearch(query: string, cityBias?: string): Promise<any[]> {
  const q = cityBias ? `${query}, ${cityBias}, India` : `${query}, India`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return [];
  return res.json();
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const google = (window as any).google;
  if (!google?.maps) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  return new Promise((resolve) => {
    const gc = new google.maps.Geocoder();
    gc.geocode({ location: { lat, lng } }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) resolve(results[0].formatted_address);
      else resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    });
  });
}

export function LocationPicker({ value, onChange, placeholder = 'Search address...', className, cityBias }: LocationPickerProps) {
  const [query, setQuery] = useState(value.address || '');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    loadGoogleMaps().then(() => setMapLoaded(true));
  }, []);

  // Init map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || leafletMap.current) return;
    const google = (window as any).google;
    const lat = value.latitude ? parseFloat(value.latitude) : 20.5937;
    const lng = value.longitude ? parseFloat(value.longitude) : 78.9629;
    const map = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: value.latitude ? 15 : 5,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b9a' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a3e' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
    });
    if (value.latitude && value.longitude) {
      markerRef.current = new google.maps.Marker({ map, position: { lat, lng }, draggable: true });
      markerRef.current.addListener('dragend', async (e: any) => {
        const addr = await reverseGeocode(e.latLng.lat(), e.latLng.lng());
        setQuery(addr);
        onChange({ address: addr, latitude: String(e.latLng.lat()), longitude: String(e.latLng.lng()) });
      });
    }
    map.addListener('click', async (e: any) => {
      const lat2 = e.latLng.lat(), lng2 = e.latLng.lng();
      if (markerRef.current) markerRef.current.setPosition({ lat: lat2, lng: lng2 });
      else markerRef.current = new google.maps.Marker({ map, position: { lat: lat2, lng: lng2 }, draggable: true });
      const addr = await reverseGeocode(lat2, lng2);
      setQuery(addr);
      onChange({ address: addr, latitude: String(lat2), longitude: String(lng2) });
    });
    leafletMap.current = map;
  }, [mapLoaded]);

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
      try { setResults(await nominatimSearch(val, cityBias)); }
      catch { setResults([]); }
      finally { setIsSearching(false); }
    }, 400);
  };

  const handleSelect = (r: any) => {
    const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
    setQuery(r.display_name);
    setResults([]);
    setIsOpen(false);
    onChange({ address: r.display_name, latitude: r.lat, longitude: r.lon });
    if (leafletMap.current) {
      leafletMap.current.setCenter({ lat, lng });
      leafletMap.current.setZoom(16);
      if (markerRef.current) markerRef.current.setPosition({ lat, lng });
      else markerRef.current = new (window as any).google.maps.Marker({ map: leafletMap.current, position: { lat, lng }, draggable: true });
    }
  };

  const handleClear = () => {
    setQuery(''); setResults([]);
    onChange({ address: '', latitude: '', longitude: '' });
    if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full space-y-3', className)}>
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

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-[#0B0B0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-white/70 group-hover:text-white leading-snug">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {value.latitude && value.longitude && (
        <p className="text-[10px] text-emerald-400/70 font-mono ml-2">
          {parseFloat(value.latitude).toFixed(5)}, {parseFloat(value.longitude).toFixed(5)}
        </p>
      )}

      <div ref={mapRef} className="w-full rounded-2xl overflow-hidden border border-white/10" style={{ height: '220px' }} />
      <p className="text-[10px] text-white/30 ml-2">Search or click on the map to set location</p>
    </div>
  );
}
