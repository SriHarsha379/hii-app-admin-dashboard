const fs = require('fs');
let code = fs.readFileSync('src/pages/PollsContests.tsx', 'utf8');

// 1. Make voteData use selectedPoll when available
code = code.replace(
  `    const pollList = Array.isArray(polls) ? polls : [];
    if (pollList.length === 0) return [];
    // Use the first active poll that has options
    const activePoll = pollList.find((p: any) => p.status === 'ACTIVE' && Array.isArray(p.options) && p.options.length > 0)
      || pollList.find((p: any) => Array.isArray(p.options) && p.options.length > 0);`,
  `    const pollList = Array.isArray(polls) ? polls : [];
    if (pollList.length === 0) return [];
    // Use selectedPoll when available, otherwise first active poll
    const activePoll = (selectedPoll && Array.isArray((selectedPoll as any).options) && (selectedPoll as any).options.length > 0 ? selectedPoll : null)
      || pollList.find((p: any) => p.status === 'ACTIVE' && Array.isArray(p.options) && p.options.length > 0)
      || pollList.find((p: any) => Array.isArray(p.options) && p.options.length > 0);`
);

// 2. Update the Vote Distribution header to show selected poll title
code = code.replace(
  `<h3 className="text-sm font-bold text-white uppercase tracking-wider">Vote Distribution</h3>`,
  `<h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {selectedPoll ? (selectedPoll as any).title : 'Vote Distribution'}
                </h3>
                {selectedPoll && (
                  <button onClick={() => setSelectedPoll(null)} className="text-[10px] text-muted-foreground hover:text-white uppercase tracking-widest font-bold">Clear</button>
                )}`
);

fs.writeFileSync('src/pages/PollsContests.tsx', code, 'utf8');
console.log('Done');
