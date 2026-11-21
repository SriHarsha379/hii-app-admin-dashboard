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
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {};
  // Auto-dismiss the "can't load Google Maps" dialog if it appears
  const observer = new MutationObserver(() => {
    const dialogs = document.querySelectorAll('.dismissButton, [class*="dismissButton"]');
    dialogs.forEach((el: any) => el.click());
    // Also find by text content
    document.querySelectorAll('button').forEach((btn: any) => {
      if (btn.textContent?.trim() === 'OK' && btn.closest('[class*="gm-"]')) btn.click();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

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

  // Init Places Autocomplete using new PlaceAutocompleteElement API
  const acContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loaded || autocompleteRef.current) return;
    const google = (window as any).google;
    if (!google?.maps?.places?.PlaceAutocompleteElement) return;
    try {
      const el = new google.maps.places.PlaceAutocompleteElement({
        types: ['establishment', 'geocode'],
      });
      // Style to match our input
      el.style.cssText = 'width:100%;--gmp-mat-color-surface:transparent;';
      if (acContainerRef.current) {
        acContainerRef.current.innerHTML = '';
        acContainerRef.current.appendChild(el);
      }
      el.addEventListener('gmp-select', async (event: any) => {
        const place = event.placePrediction.toPlace();
        await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
        const lat = place.location.lat();
        const lng = place.location.lng();
        const addr = place.formattedAddress || place.displayName || '';
        setQuery(addr);
        onChange({ address: addr, latitude: String(lat), longitude: String(lng) });
        if (leafletMap.current) {
          leafletMap.current.setCenter({ lat, lng });
          leafletMap.current.setZoom(16);
          if (markerRef.current) markerRef.current.setPosition({ lat, lng });
          else markerRef.current = new google.maps.Marker({ map: leafletMap.current, position: { lat, lng }, draggable: true });
        }
      });
      autocompleteRef.current = el;
    } catch(e) {
      console.warn('PlaceAutocompleteElement init failed:', e);
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
        {!loaded && (
          <div className="w-full bg-[#09090B] border border-white/5 rounded-[28px] px-11 py-4 text-sm text-white/20 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading maps...
          </div>
        )}
        {loaded && (
          <div ref={acContainerRef} className="w-full [&>*]:w-full [&_input]:bg-transparent [&_input]:text-white [&_input]:py-4 [&_input]:px-4 [&_input]:rounded-[28px] [&_input]:border [&_input]:border-white/10 [&_input]:outline-none [&_input]:text-sm" />
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
