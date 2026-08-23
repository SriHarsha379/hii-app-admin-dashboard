import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  TrendingUp, 
  TrendingDown,
  Mail,
  Bell,
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  BarChart2,
  Trophy,
  Zap,
  MessageCircle,
  FileText,
  User,
  ChevronRight,
  Shield,
  Activity,
  ArrowRight,
  Database,
  Lock,
  Eye,
  Settings,
  UserPlus,
  Layout as LayoutIcon,
  MousePointer2,
  Loader2,
  Check,
  Info,
  Star,
  MapPin,
  Building2,
  Phone,
  Globe,
  Instagram,
  Ticket,
  Music,
  Mic2,
  PartyPopper,
  Sparkles,
  Vote,
  BarChart3,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE } from '../lib/apiConfig';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const voteData = [
  { name: 'Option A', votes: 420, color: '#4F46E5' },
  { name: 'Option B', votes: 310, color: '#9333EA' },
  { name: 'Option C', votes: 150, color: '#EC4899' },
  { name: 'Option D', votes: 80, color: '#F59E0B' },
];

export default function PollsContests() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('polls');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPoll, setNewPoll] = useState({ title: '', city: 'ALL', endDate: '', options: ['', ''] });
  const [sortField, setSortField] = useState('end_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCity, setFilterCity] = useState('ALL');

  const { data: polls, isLoading: pollsLoading } = useQuery({
    queryKey: ['polls'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/polls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // FIXED: was returning the raw {success, message, data} wrapper —
      // Array.isArray(polls) further down was always false, so this table
      // was always empty regardless of what existed.
      const json = await res.json();
      return json.data ?? [];
    }
  });

  const { data: contests, isLoading: contestsLoading } = useQuery({
    queryKey: ['contests'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/contests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Same unwrap fix as the polls query above.
      const json = await res.json();
      return json.data ?? [];
    }
  });

  const [isAddContestModalOpen, setIsAddContestModalOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState<any>(null);
  const [newContest, setNewContest] = useState({ title: '', city: 'ALL', rules: '', reward: '', deadline: '' });

  const { data: participants, isLoading: participantsLoading } = useQuery({
    queryKey: ['contest_participants', selectedContest?.id],
    queryFn: async () => {
      if (!selectedContest?.id) return [];
      const res = await fetch(`${API_BASE}/contests/${selectedContest.id}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!selectedContest?.id
  });

  const addContestMutation = useMutation({
    mutationFn: async (contest: any) => {
      const res = await fetch(`${API_BASE}/contests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(contest)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      setIsAddContestModalOpen(false);
      setNewContest({ title: '', city: 'ALL', rules: '', reward: '', deadline: '' });
    }
  });

  const updateContestStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`${API_BASE}/contests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    }
  });

  const filteredPolls = (Array.isArray(polls) ? polls : []).filter((poll: any) => {
    return filterCity === 'ALL' || poll.city === filterCity;
  });

  const sortedPolls = [...filteredPolls].sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredContests = (Array.isArray(contests) ? contests : []).filter((contest: any) => {
    return filterCity === 'ALL' || contest.city === filterCity;
  });

  const sortedContests = [...filteredContests].sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const addPollMutation = useMutation({
    mutationFn: async (poll: any) => {
      const res = await fetch(`${API_BASE}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(poll)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setIsAddModalOpen(false);
      setNewPoll({ title: '', city: 'ALL', endDate: '', options: ['', ''] });
    }
  });

  const updatePollStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`${API_BASE}/polls/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    }
  });

  // FIXED: kebab menus on both poll and contest rows had no dropdown, no
  // actions at all — required building the entire backend for this page
  // first, since none of it existed.
  const [openPollMenuId, setOpenPollMenuId] = useState<string | null>(null);
  const [openContestMenuId, setOpenContestMenuId] = useState<string | null>(null);

  const deletePollMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/polls/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'Failed to remove poll');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setOpenPollMenuId(null);
    },
    onError: (err: any) => alert(err.message || 'Failed to remove poll'),
  });

  const deleteContestMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/contests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'Failed to remove contest');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      setOpenContestMenuId(null);
    },
    onError: (err: any) => alert(err.message || 'Failed to remove contest'),
  });

  const exportData = () => {
    const headers = ['Title', 'City', 'Votes', 'End Date', 'Status'];
    const rows = sortedPolls.map((poll: any) => [
      `"${poll.title || ''}"`, `"${poll.city || ''}"`, `"${poll.votes || 0}"`,
      `"${poll.end_date ? new Date(poll.end_date).toLocaleDateString() : ''}"`,
      `"${poll.status || ''}"`,
    ]);
    const csv  = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `polls-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...newPoll.options];
    newOptions.splice(index, 1);
    setNewPoll({ ...newPoll, options: newOptions });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({ ...newPoll, options: newOptions });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Polls & Contests</h2>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab('polls')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider",
                activeTab === 'polls' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Polls
            </button>
            <button
              onClick={() => setActiveTab('contests')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider",
                activeTab === 'contests' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Contests
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'polls' ? (
          <motion.div
            key="polls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Polls List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl border border-white/10">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Polls</h3>
                  <div className="flex items-center gap-4">
                    <FilterPanel>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                        <FilterDropdown
                          value={filterCity}
                          onChange={setFilterCity}
                          options={[
                            { label: 'All Cities', value: 'ALL' },
                            { label: 'Mumbai', value: 'Mumbai' },
                            { label: 'Delhi', value: 'Delhi' },
                            { label: 'Bangalore', value: 'Bangalore' },
                            { label: 'Goa', value: 'Goa' },
                          ]}
                        />
                      </div>
                    </FilterPanel>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Poll
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-b-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5">
                        <th
                          className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('title')}
                        >
                          <div className="flex items-center gap-2">
                            Poll Title
                            {sortField === 'title' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Votes</th>
                        <th
                          className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('end_date')}
                        >
                          <div className="flex items-center gap-2">
                            End Date
                            {sortField === 'end_date' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pollsLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading polls...</td>
                        </tr>
                      ) : sortedPolls.length > 0 ? sortedPolls.map((poll: any) => (
                        <tr key={poll.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                                <Vote className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{poll.title}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{typeof poll.city === 'object' ? poll.city?.city_name : poll.city}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              {/* FIXED: was `poll.votes || '1,240'` — a
                                  hardcoded fake fallback that showed
                                  "1,240" votes on any poll with genuinely
                                  zero votes, including every new poll. */}
                              <span className="text-xs font-bold text-white">{poll.votes ?? 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-muted-foreground">{new Date(poll.end_date).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3 relative">
                              <button
                                onClick={() => {
                                  updatePollStatusMutation.mutate({
                                    id: poll.id,
                                    status: poll.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE'
                                  });
                                }}
                                disabled={updatePollStatusMutation.isPending}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50",
                                  poll.status === 'ACTIVE'
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white"
                                )}
                              >
                                {poll.status === 'ACTIVE' ? 'Active Pop-up' : 'Activate'}
                              </button>
                              <button
                                onClick={() => setOpenPollMenuId(openPollMenuId === poll.id ? null : poll.id)}
                                className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {openPollMenuId === poll.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenPollMenuId(null)} />
                                  <div className="absolute right-0 top-12 z-20 w-40 rounded-2xl bg-[#0B0B0F] border border-white/10 shadow-2xl overflow-hidden">
                                    <button
                                      onClick={() => { if (confirm(`Remove "${poll.title}"?`)) deletePollMutation.mutate(poll.id); }}
                                      disabled={deletePollMutation.isPending}
                                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Remove
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-xs text-muted-foreground">No polls found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Poll Stats */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vote Distribution</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={voteData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        width={80}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={20}>
                        {voteData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {voteData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs text-muted-foreground font-medium">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{item.votes}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="contests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <FilterPanel>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                  <FilterDropdown
                    value={filterCity}
                    onChange={setFilterCity}
                    options={[
                      { label: 'All Cities', value: 'ALL' },
                      { label: 'Mumbai', value: 'Mumbai' },
                      { label: 'Delhi', value: 'Delhi' },
                      { label: 'Bangalore', value: 'Bangalore' },
                      { label: 'Goa', value: 'Goa' },
                    ]}
                  />
                </div>
              </FilterPanel>
              <button
                onClick={() => setIsAddContestModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Contest
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedContests.map((contest: any) => (
                <div key={contest.id} className="glass-card p-6 rounded-2xl border border-white/10 space-y-6 group hover:border-primary/40 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        "text-[10px] px-2 py-1 rounded-lg font-bold border uppercase tracking-widest",
                        contest.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {contest.status}
                      </span>
                      {contest.status === 'PENDING' && (
                        <button
                          onClick={() => updateContestStatusMutation.mutate({ id: contest.id, status: 'ACTIVE' })}
                          className="text-[10px] px-2 py-1 rounded-lg font-bold border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all uppercase"
                        >
                          Activate
                        </button>
                      )}
                      {/* FIXED: contests had no remove action anywhere on
                          the card at all. */}
                      <button
                        onClick={() => { if (confirm(`Remove "${contest.title}"?`)) deleteContestMutation.mutate(contest.id); }}
                        disabled={deleteContestMutation.isPending}
                        className="text-[10px] px-2 py-1 rounded-lg font-bold border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all uppercase disabled:opacity-50 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{contest.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {contest.participants || 0} Participants
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {contest.reward || 'Reward'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {typeof contest.city === 'object' ? contest.city?.city_name : contest.city}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedContest(contest)}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    View Participants
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {sortedContests.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                  No contests found.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Poll Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create New Poll</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Poll Title</label>
                <input
                  type="text"
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                  placeholder="Enter poll question..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target City</label>
                  <div className="relative">
                    <select
                      value={newPoll.city}
                      onChange={(e) => setNewPoll({ ...newPoll, city: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                    >
                      <option value="ALL">All Cities</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Goa">Goa</option>
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">End Date</label>
                <input
                  type="date"
                  value={newPoll.endDate}
                  onChange={(e) => setNewPoll({ ...newPoll, endDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 [color-scheme:dark]"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Answer Options</label>
                  <button
                    onClick={handleAddOption}
                    className="text-xs text-primary hover:text-primary/80 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                </div>
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    {newPoll.options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addPollMutation.mutate({ ...newPoll, end_date: newPoll.endDate })}
                  disabled={addPollMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addPollMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {addPollMutation.isPending ? 'Creating...' : 'Create Poll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Contest Modal */}
      {isAddContestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create New Contest</h3>
              <button onClick={() => setIsAddContestModalOpen(false)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contest Title</label>
                <input
                  type="text"
                  value={newContest.title}
                  onChange={(e) => setNewContest({ ...newContest, title: e.target.value })}
                  placeholder="Enter contest title..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target City</label>
                  <div className="relative">
                    <select
                      value={newContest.city}
                      onChange={(e) => setNewContest({ ...newContest, city: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                    >
                      <option value="ALL">All Cities</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Goa">Goa</option>
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rules</label>
                <textarea
                  value={newContest.rules}
                  onChange={(e) => setNewContest({ ...newContest, rules: e.target.value })}
                  placeholder="Enter contest rules..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reward</label>
                <input
                  type="text"
                  value={newContest.reward}
                  onChange={(e) => setNewContest({ ...newContest, reward: e.target.value })}
                  placeholder="Enter reward (e.g., VIP Access)..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">End Date</label>
                <input
                  type="date"
                  value={newContest.deadline}
                  onChange={(e) => setNewContest({ ...newContest, deadline: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
              <button
                onClick={() => setIsAddContestModalOpen(false)}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => addContestMutation.mutate(newContest)}
                disabled={!newContest.title || !newContest.deadline || !newContest.reward || addContestMutation.isPending}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addContestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Create Contest
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Participants Modal */}
      <AnimatePresence>
        {selectedContest && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContest(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#0A0A0F] border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contest Participants</h3>
                  <button onClick={() => setSelectedContest(null)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">{selectedContest.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {selectedContest.participants || 0} Participants
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {selectedContest.reward}
                    </div>
                  </div>
                </div>

                {/* Participants List */}
                <div className="space-y-4">
                  {participantsLoading ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">Loading participants...</div>
                  ) : participants?.length > 0 ? (
                    participants.map((participant: any) => (
                      <div key={participant.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {participant.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{participant.name}</p>
                              <p className="text-xs text-muted-foreground">{participant.email}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] px-2 py-1 rounded-lg font-bold border uppercase tracking-widest",
                            participant.status === 'WINNER' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            participant.status === 'RUNNER_UP' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            "bg-white/5 text-muted-foreground border-white/10"
                          )}>
                            {participant.status}
                          </span>
                        </div>

                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-sm text-muted-foreground">No participants yet.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}