import React, { useState, useRef, useEffect, useCallback } from 'react';
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
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
// Suppress Google Maps auth dialog globally
if (typeof window !== 'undefined') (window as any).gm_authFailure = () => {};

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.maps) { resolve(); return; }
    // Script is preloaded in index.html — just wait for it
    const check = setInterval(() => {
      if ((window as any).google?.maps) { clearInterval(check); resolve(); }
    }, 50);
    setTimeout(() => { clearInterval(check); resolve(); }, 5000);
  });
}

export function LocationPicker({ value, onChange, placeholder = 'Search address...', className }: LocationPickerProps) {
  const [query, setQuery] = useState(value.address || '');
  const [loaded, setLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    loadGoogleMaps().then(() => setLoaded(true));
  }, []);

  // Init map
  useEffect(() => {
    if (!loaded || !mapRef.current || leafletMap.current) return;
    const google = (window as any).google;
    const lat = value.latitude ? parseFloat(value.latitude) : 20.5937;
    const lng = value.longitude ? parseFloat(value.longitude) : 78.9629;
    const zoom = value.latitude ? 15 : 5;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b9a' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a3e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
    });

    if (value.latitude && value.longitude) {
      markerRef.current = new google.maps.Marker({ map, position: { lat, lng }, draggable: true });
      markerRef.current.addListener('dragend', async (e: any) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        const addr = await reverseGeocode(newLat, newLng);
        setQuery(addr);
        onChange({ address: addr, latitude: String(newLat), longitude: String(newLng) });
      });
    }

    map.addListener('click', async (e: any) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      if (markerRef.current) markerRef.current.setPosition({ lat: newLat, lng: newLng });
      else {
        markerRef.current = new google.maps.Marker({ map, position: { lat: newLat, lng: newLng }, draggable: true });
        markerRef.current.addListener('dragend', async (ev: any) => {
          const a = await reverseGeocode(ev.latLng.lat(), ev.latLng.lng());
          setQuery(a);
          onChange({ address: a, latitude: String(ev.latLng.lat()), longitude: String(ev.latLng.lng()) });
        });
      }
      const addr = await reverseGeocode(newLat, newLng);
      setQuery(addr);
      onChange({ address: addr, latitude: String(newLat), longitude: String(newLng) });
    });

    leafletMap.current = map;
  }, [loaded]);

  // Init Places Autocomplete (new API)
  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;
    const google = (window as any).google;
    // Try new API first, fall back to legacy
    try {
      const ac = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry', 'name'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const addr = place.formatted_address || place.name || '';
        setQuery(addr);
        onChange({ address: addr, latitude: String(lat), longitude: String(lng) });
        if (leafletMap.current) {
          leafletMap.current.setCenter({ lat, lng });
          leafletMap.current.setZoom(16);
          if (markerRef.current) markerRef.current.setPosition({ lat, lng });
          else markerRef.current = new google.maps.Marker({ map: leafletMap.current, position: { lat, lng }, draggable: true });
        }
      });
      autocompleteRef.current = ac;
    } catch(e) {
      console.warn('Places Autocomplete init failed:', e);
    }
  }, [loaded]);

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    const google = (window as any).google;
    return new Promise((resolve) => {
      const gc = new google.maps.Geocoder();
      gc.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) resolve(results[0].formatted_address);
        else resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      });
    });
  }

  const handleClear = () => {
    setQuery('');
    onChange({ address: '', latitude: '', longitude: '' });
    if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
  };

  return (
    <div className={cn('relative w-full space-y-3', className)}>
      <div className="relative group">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loaded ? placeholder : 'Loading maps...'}
          disabled={!loaded}
          className="w-full bg-[#09090B] border border-white/5 rounded-[28px] pl-11 pr-10 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 placeholder:text-white/10 font-medium disabled:opacity-50"
        />
        {!loaded && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
        {loaded && query && (
          <button type="button" onClick={handleClear} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {value.latitude && value.longitude && (
        <p className="text-[10px] text-emerald-400/70 font-mono ml-2">
          {parseFloat(value.latitude).toFixed(5)}, {parseFloat(value.longitude).toFixed(5)}
        </p>
      )}

      <div ref={mapRef} className="w-full rounded-2xl overflow-hidden border border-white/10" style={{ height: '280px' }} />
      <p className="text-[10px] text-white/30 ml-2">Search or click/drag on the map to set location</p>
    </div>
  );
}
