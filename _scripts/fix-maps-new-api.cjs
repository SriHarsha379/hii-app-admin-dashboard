const fs = require('fs');
let code = fs.readFileSync('src/components/LocationPicker.tsx', 'utf8');

// Switch to Places API (New) by using v=beta and importLibrary
code = code.replace(
  `script.src = \`https://maps.googleapis.com/maps/api/js?key=\${API_KEY}&libraries=places\`;`,
  `script.src = \`https://maps.googleapis.com/maps/api/js?key=\${API_KEY}&libraries=places,maps&v=beta\`;`
);

// Replace legacy Autocomplete with PlaceAutocompleteElement (new API)
code = code.replace(
  `  // Init Places Autocomplete
  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;
    const google = (window as any).google;
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
  }, [loaded]);`,
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
  }, [loaded]);`
);

fs.writeFileSync('src/components/LocationPicker.tsx', code, 'utf8');
console.log('Done');
