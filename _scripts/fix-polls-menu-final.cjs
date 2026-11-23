const fs = require('fs');
let lines = fs.readFileSync('src/pages/PollsContests.tsx', 'utf8').split('\n');

// Find the dropdown div and replace everything between it and </div>
let inDropdown = false;
let dropdownStart = -1;
let dropdownEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('absolute right-0 top-12 z-20')) {
    dropdownStart = i;
    inDropdown = true;
  }
  if (inDropdown && dropdownEnd === -1 && i > dropdownStart && lines[i].match(/^\s*<\/div>\s*$/)) {
    dropdownEnd = i;
    break;
  }
}

console.log('Dropdown:', dropdownStart, '-', dropdownEnd);

if (dropdownStart > -1 && dropdownEnd > -1) {
  const newDropdown = [
    '                                  <div className="absolute right-0 top-12 z-20 w-40 rounded-2xl bg-[#0B0B0F] border border-white/10 shadow-2xl overflow-hidden">',
    '                                    <button',
    '                                      onClick={(e) => { e.stopPropagation(); setDeletePollTarget(poll); setOpenPollMenuId(null); }}',
    '                                      disabled={deletePollMutation.isPending}',
    '                                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"',
    '                                    >',
    '                                      <Trash2 className="w-4 h-4" />',
    '                                      Remove',
    '                                    </button>',
    '                                  </div>',
  ];
  lines.splice(dropdownStart, dropdownEnd - dropdownStart + 1, ...newDropdown);
  console.log('Replaced dropdown');
}

fs.writeFileSync('src/pages/PollsContests.tsx', lines.join('\n'), 'utf8');
