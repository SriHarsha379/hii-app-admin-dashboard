const fs = require('fs');
let code = fs.readFileSync('src/pages/PollsContests.tsx', 'utf8');

// Replace the full dropdown with just Delete
code = code.replace(
  /(<div className="absolute right-0 top-12 z-20 w-44[^>]*>)[\s\S]*?(<\/div>\s*<\/>\s*\}\s*\}\s*<\/div>\s*<\/td>)/,
  `<div className="absolute right-0 top-12 z-20 w-40 rounded-2xl bg-[#0B0B0F] border border-white/10 shadow-2xl overflow-hidden">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeletePollTarget(poll); setOpenPollMenuId(null); }}
                                      disabled={deletePollMutation.isPending}
                                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Remove
                                    </button>
                                  </div>
                                </>
                              }
                            </div>
                          </td>`
);

fs.writeFileSync('src/pages/PollsContests.tsx', code, 'utf8');
console.log('Done');
