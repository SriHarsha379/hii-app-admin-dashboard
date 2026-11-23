const fs = require('fs');
let code = fs.readFileSync('src/pages/PollsContests.tsx', 'utf8');

// 1. Add editingContest state if missing
if (!code.includes('editingContest,') && !code.includes('[editingContest,')) {
  code = code.replace(
    'const [editingPoll, setEditingPoll]               = useState<any>(null);',
    'const [editingPoll, setEditingPoll]               = useState<any>(null);\n  const [editingContest, setEditingContest]         = useState<any>(null);'
  );
}

// 2. Add updatePollMutation after addPollMutation
if (!code.includes('updatePollMutation')) {
  code = code.replace(
    '  // ── Contests ──',
    `  const updatePollMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(\`\${API_BASE}/polls/\${editingPoll?._id || editingPoll?.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update poll');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['polls'] }); setEditingPoll(null); success('Poll updated!'); },
    onError: () => toastError('Failed to update poll'),
  });

  const updateContestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(\`\${API_BASE}/contests/\${editingContest?._id || editingContest?.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update contest');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contests'] }); setEditingContest(null); success('Contest updated!'); },
    onError: () => toastError('Failed to update contest'),
  });

  // ── Contests ──`
  );
}

// 3. Add Edit Poll Modal before closing of main return
const editPollModal = `
      {/* ── Edit Poll Modal ─────────────────────────────────────────────── */}
      {editingPoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Poll</h3>
              <button onClick={() => setEditingPoll(null)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Poll Title</label>
                <input type="text" value={editingPoll.title || ''} onChange={(e) => setEditingPoll({ ...editingPoll, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target City</label>
                <div className="relative">
                  <select value={editingPoll.city || 'ALL'} onChange={(e) => setEditingPoll({ ...editingPoll, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none">
                    <option value="ALL">All Cities</option>
                    {cityOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    {(Array.isArray(cities) ? cities : []).map((c: any) => <option key={c._id} value={c.city_name}>{c.city_name}</option>)}
                  </select>
                  <ChevronRight className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground rotate-90 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">End Date</label>
                <input type="date" value={editingPoll.end_date ? editingPoll.end_date.slice(0,10) : ''} onChange={(e) => setEditingPoll({ ...editingPoll, end_date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 [color-scheme:dark]" />
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Answer Options</label>
                {(editingPoll.options || []).map((opt: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={typeof opt === 'string' ? opt : (opt.text || opt.option || '')}
                      onChange={(e) => { const opts = [...editingPoll.options]; opts[i] = typeof opt === 'string' ? e.target.value : { ...opt, text: e.target.value }; setEditingPoll({ ...editingPoll, options: opts }); }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingPoll(null)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={() => updatePollMutation.mutate(editingPoll)} disabled={updatePollMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {updatePollMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                  {updatePollMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Contest Modal ───────────────────────────────────────────── */}
      {editingContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Contest</h3>
              <button onClick={() => setEditingContest(null)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contest Title</label>
                <input type="text" value={editingContest.title || ''} onChange={(e) => setEditingContest({ ...editingContest, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reward</label>
                <input type="text" value={editingContest.reward || ''} onChange={(e) => setEditingContest({ ...editingContest, reward: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">End Date</label>
                <input type="date" value={editingContest.end_date ? editingContest.end_date.slice(0,10) : ''} onChange={(e) => setEditingContest({ ...editingContest, end_date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 [color-scheme:dark]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Description</label>
                <textarea value={editingContest.description || ''} onChange={(e) => setEditingContest({ ...editingContest, description: e.target.value })} rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingContest(null)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={() => updateContestMutation.mutate(editingContest)} disabled={updateContestMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {updateContestMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                  {updateContestMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Poll Preview Modal ───────────────────────────────────────────── */}
      {selectedPoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Poll Preview</h3>
              <button onClick={() => setSelectedPoll(null)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Poll Question</p>
                <h4 className="text-lg font-bold text-white">{(selectedPoll as any).title}</h4>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className={cn("px-2 py-1 rounded-lg font-bold uppercase text-[10px]", (selectedPoll as any).status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 border border-white/10')}>{(selectedPoll as any).status}</span>
                <span>{(selectedPoll as any).city || 'All Cities'}</span>
                {(selectedPoll as any).end_date && <span>Ends {new Date((selectedPoll as any).end_date).toLocaleDateString()}</span>}
              </div>
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Options</p>
                {((selectedPoll as any).options || []).map((opt: any, i: number) => {
                  const label = typeof opt === 'string' ? opt : (opt.text || opt.option || \`Option \${i+1}\`);
                  const votes = typeof opt === 'object' ? (opt.votes || opt.count || 0) : 0;
                  const total = ((selectedPoll as any).options || []).reduce((s: number, o: any) => s + (typeof o === 'object' ? (o.votes || o.count || 0) : 0), 0);
                  const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-medium">{label}</span>
                        <span className="text-muted-foreground">{votes} votes ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all" style={{ width: \`\${pct}%\` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedPoll(null)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all">Close</button>
                <button onClick={() => { setEditingPoll(selectedPoll); setSelectedPoll(null); }} className="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-sm font-bold flex items-center justify-center gap-2">
                  <Pencil className="w-4 h-4" /> Edit Poll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

// Insert before the last </div> closing the return
code = code.replace(
  '      {deleteContestTarget && (',
  editPollModal + '\n      {deleteContestTarget && ('
);

fs.writeFileSync('src/pages/PollsContests.tsx', code, 'utf8');
console.log('Done');
