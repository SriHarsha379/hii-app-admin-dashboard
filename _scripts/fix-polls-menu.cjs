const fs = require('fs');
let code = fs.readFileSync('src/pages/PollsContests.tsx', 'utf8');

// Replace the dropdown content to add Preview, Edit, Analytics before Delete
code = code.replace(
  `                                  <div className="absolute right-0 top-12 z-20 w-40 rounded-2xl bg-[#0B0B0F] border border-white/10 shadow-2xl overflow-hidden">
                                    <button
                                      onClick={() => setDeletePollTarget(poll)}
                                      disabled={deletePollMutation.isPending}
                                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Remove
                                    </button>
                                  </div>`,
  `                                  <div className="absolute right-0 top-12 z-20 w-44 rounded-2xl bg-[#0B0B0F] border border-white/10 shadow-2xl overflow-hidden">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedPoll(poll); setOpenPollMenuId(null); }}
                                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Preview
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingPoll(poll); setOpenPollMenuId(null); }}
                                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                      <Settings className="w-4 h-4" />
                                      Edit
                                    </button>
                                    <div className="h-px bg-white/5 mx-3" />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeletePollTarget(poll); setOpenPollMenuId(null); }}
                                      disabled={deletePollMutation.isPending}
                                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Remove
                                    </button>
                                  </div>`
);

// Add editingPoll state if not present
if (!code.includes('editingPoll')) {
  code = code.replace(
    'const [deletePollTarget, setDeletePollTarget]     = useState<any>(null);',
    'const [deletePollTarget, setDeletePollTarget]     = useState<any>(null);\n  const [editingPoll, setEditingPoll]               = useState<any>(null);'
  );
}

fs.writeFileSync('src/pages/PollsContests.tsx', code, 'utf8');
console.log('Done');
