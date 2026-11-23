const fs = require('fs');
let code = fs.readFileSync('src/components/LocationPicker.tsx', 'utf8');

// Replace the dropdown with a portal-based approach
code = code.replace(
  `      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-[#0B0B0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-white/70 group-hover:text-white leading-snug">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}`,
  `      {isOpen && results.length > 0 && dropdownPos && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 99999 }}
          className="bg-[#0B0B0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-white/70 group-hover:text-white leading-snug">{r.display_name}</span>
            </button>
          ))}
        </div>,
        document.body
      )}`
);

// Add ReactDOM import and dropdownPos state
code = code.replace(
  `import React, { useState, useRef, useEffect } from 'react';`,
  `import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';`
);

// Add dropdownPos state
code = code.replace(
  `  const [mapLoaded, setMapLoaded] = useState(false);`,
  `  const [mapLoaded, setMapLoaded] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{top:number,left:number,width:number}|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);`
);

// Update dropdownPos when isOpen changes
code = code.replace(
  `  const handleInput = (val: string) => {
    setQuery(val);
    setIsOpen(true);`,
  `  const handleInput = (val: string) => {
    setQuery(val);
    setIsOpen(true);
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }`
);

// Add ref to input
code = code.replace(
  `          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query && setIsOpen(true)}`,
  `          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (query) { setIsOpen(true); if (inputRef.current) { const r = inputRef.current.getBoundingClientRect(); setDropdownPos({top: r.bottom+4, left: r.left, width: r.width}); }}}}`
);

fs.writeFileSync('src/components/LocationPicker.tsx', code, 'utf8');
console.log('Done');
