const fs = require('fs');
let lines = fs.readFileSync('src/pages/PollsContests.tsx', 'utf8').split('\n');

// Find the closing of addPollMutation (find the }); after line 244)
let addPollEnd = -1;
let braceCount = 0;
let started = false;
for (let i = 243; i < Math.min(243 + 30, lines.length); i++) {
  if (lines[i].includes('useMutation(')) started = true;
  if (started) {
    braceCount += (lines[i].match(/\{/g) || []).length;
    braceCount -= (lines[i].match(/\}/g) || []).length;
    if (braceCount <= 0 && started && i > 243) { addPollEnd = i; break; }
  }
}
console.log('addPollMutation ends at line:', addPollEnd + 1);

const newMutations = [
  '',
  '  const updatePollMutation = useMutation({',
  '    mutationFn: async (data: any) => {',
  '      const res = await fetch(`${API_BASE}/polls/${data._id || data.id}`, {',
  "        method: 'PUT',",
  "        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },",
  '        body: JSON.stringify(data),',
  '      });',
  "      if (!res.ok) throw new Error('Failed to update poll');",
  '      return res.json();',
  '    },',
  "    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['polls'] }); setEditingPoll(null); success('Poll updated!'); },",
  "    onError: () => toastError('Failed to update poll'),",
  '  });',
  '',
  '  const updateContestMutation = useMutation({',
  '    mutationFn: async (data: any) => {',
  '      const res = await fetch(`${API_BASE}/contests/${data._id || data.id}`, {',
  "        method: 'PUT',",
  "        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },",
  '        body: JSON.stringify(data),',
  '      });',
  "      if (!res.ok) throw new Error('Failed to update contest');",
  '      return res.json();',
  '    },',
  "    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contests'] }); setEditingContest(null); success('Contest updated!'); },",
  "    onError: () => toastError('Failed to update contest'),",
  '  });',
];

if (addPollEnd > -1) {
  lines.splice(addPollEnd + 1, 0, ...newMutations);
  console.log('Inserted mutations after line', addPollEnd + 1);
}

fs.writeFileSync('src/pages/PollsContests.tsx', lines.join('\n'), 'utf8');
