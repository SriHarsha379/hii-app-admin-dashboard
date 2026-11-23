const fs = require('fs');
let code = fs.readFileSync('src/pages/PollsContests.tsx', 'utf8');

// 1. POLLS: add Preview + Edit before Delete in the dropdown
code = code.replace(
  `                                  <div className="absolute right-0 top-12 z-20 w-40 rounded-2xl bg-[#0B0B0F] border border-white/10 shadow-2xl overflow-hidden">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeletePollTarget(poll); setOpenPollMenuId(null); }}
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
                                      <Pencil className="w-4 h-4" />
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

// 2. CONTESTS: replace inline Remove button with a ... menu
code = code.replace(
  `                      {/* FIXED: contests had no remove action anywhere on
                          the card at all. */}
                      <button
                        onClick={() => setDeleteContestTarget(contest)}
                        disabled={deleteContestMutation.isPending}
                        className="text-[10px] px-2 py-1 rounded-lg font-bold border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all uppercase disabled:opacity-50 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>`,
  `                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenContestMenuId(openContestMenuId === (contest._id || contest.id) ? null : (contest._id || contest.id)); }}
                          className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openContestMenuId === (contest._id || contest.id) && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenContestMenuId(null)} />
                            <div className="absolute right-0 top-10 z-20 w-44 rounded-2xl bg-[#0B0B0F] border border-white/10 shadow-2xl overflow-hidden">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedContest(contest); setOpenContestMenuId(null); }}
                                className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingContest(contest); setOpenContestMenuId(null); }}
                                className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </button>
                              <div className="h-px bg-white/5 mx-3" />
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteContestTarget(contest); setOpenContestMenuId(null); }}
                                disabled={deleteContestMutation.isPending}
                                className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          </>
                        )}
                      </div>`
);

// 3. Add missing state vars if not present
if (!code.includes('editingPoll,')) {
  code = code.replace(
    'const [deletePollTarget, setDeletePollTarget]     = useState<any>(null);',
    'const [deletePollTarget, setDeletePollTarget]     = useState<any>(null);\n  const [editingPoll, setEditingPoll]               = useState<any>(null);\n  const [selectedContest, setSelectedContest]       = useState<any>(null);\n  const [editingContest, setEditingContest]         = useState<any>(null);'
  );
}

// 4. Add Pencil to imports if missing
if (!code.includes('Pencil')) {
  code = code.replace("import {", "import { Pencil,");
}

fs.writeFileSync('src/pages/PollsContests.tsx', code, 'utf8');
console.log('Done');
