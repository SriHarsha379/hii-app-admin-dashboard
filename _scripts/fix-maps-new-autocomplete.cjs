const fs = require('fs');
let code = fs.readFileSync('src/components/LocationPicker.tsx', 'utf8');

// Replace legacy Autocomplete with PlaceAutocompleteElement
code = code.replace(
  `  // Init Places Autocomplete (new API)
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
  }, [loaded]);`,
  `  // Init Places Autocomplete using new PlaceAutocompleteElement API
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
  }, [loaded]);`
);

// Replace the input with a container div for PlaceAutocompleteElement
code = code.replace(
  `      <div className="relative group">
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
      </div>`,
  `      <div className="relative group">
        {!loaded && (
          <div className="w-full bg-[#09090B] border border-white/5 rounded-[28px] px-11 py-4 text-sm text-white/20 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading maps...
          </div>
        )}
        {loaded && (
          <div ref={acContainerRef} className="w-full [&>*]:w-full [&_input]:bg-transparent [&_input]:text-white [&_input]:py-4 [&_input]:px-4 [&_input]:rounded-[28px] [&_input]:border [&_input]:border-white/10 [&_input]:outline-none [&_input]:text-sm" />
        )}
      </div>`
);

fs.writeFileSync('src/components/LocationPicker.tsx', code, 'utf8');
console.log('Done');
