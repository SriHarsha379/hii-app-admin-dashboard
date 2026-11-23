const fs = require('fs');
let code = fs.readFileSync('src/pages/Events.tsx', 'utf8');

// 1. Add Host/Organizer th header after Venue/City
code = code.replace(
  `                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-1.5">Date & Time <SortIcon field="date" /></div>
                    </th>`,
  `                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Host / Organiser
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-1.5">Date & Time <SortIcon field="date" /></div>
                    </th>`
);

// 2. Add Host/Organizer td cell after Venue/City td
code = code.replace(
  `                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{new Date(event.date || Date.now()).toLocaleDateString()}</p>
                        <p className="text-[10px] text-muted-foreground">{event.start_time || '—'}</p>
                      </td>`,
  `                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{event.vendor_id?.name || getVendorName(getVendorId(event)) || '—'}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Organiser</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{new Date(event.date || Date.now()).toLocaleDateString()}</p>
                        <p className="text-[10px] text-muted-foreground">{event.start_time || '—'}</p>
                      </td>`
);

// 3. Update colSpan from 5 to 6 in loading/empty rows
code = code.replace(/colSpan=\{5\}/g, 'colSpan={6}');

fs.writeFileSync('src/pages/Events.tsx', code, 'utf8');
console.log('Done');
