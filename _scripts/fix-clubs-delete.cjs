const fs = require('fs');
let code = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

code = code.replace(
  `                        <button onClick={(e) => { e.stopPropagation(); openEditVenue(withVenueData(club)); }} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" title="Edit venue">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>`,
  `                        <button onClick={(e) => { e.stopPropagation(); openEditVenue(withVenueData(club)); }} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" title="Edit venue">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteVenueTarget(club); }} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Delete venue">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>`
);

fs.writeFileSync('src/pages/Clubs.tsx', code, 'utf8');
console.log('Done');
