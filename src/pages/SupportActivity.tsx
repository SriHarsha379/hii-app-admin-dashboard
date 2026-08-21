import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
  Flag,
  RefreshCw,
  Reply,
  Trash2,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { API_BASE } from '../lib/apiConfig';
const priorityColors: any = {
  'HIGH': 'bg-red-500/10 text-red-400 border-red-500/20',
  'MEDIUM': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'LOW': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const statusColors: any = {
  'OPEN': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'RESOLVED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'CLOSED': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function SupportActivity() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const queryClient = useQueryClient();

  // Maps this page's UI-level status labels (used for the Close/Resolve
  // buttons and the color-coded badges) to each backend model's own status
  // enum, since ReportProblem and UserReport don't share one.
  const uiToBackendStatus = (type: 'requests' | 'complaints', uiStatus: string) => {
    if (type === 'requests') {
      // ReportProblem: Pending | Inprogress | Resolve | Closed
      if (uiStatus === 'RESOLVED') return 'Resolve';
      if (uiStatus === 'CLOSED') return 'Closed';
      return 'Pending';
    }
    // UserReport: Pending | Reviewed | Resolved | Rejected
    if (uiStatus === 'RESOLVED') return 'Resolved';
    if (uiStatus === 'CLOSED') return 'Rejected';
    return 'Pending';
  };

  const backendToUiStatus = (type: 'requests' | 'complaints', backendStatus: string) => {
    if (type === 'requests') {
      const map: Record<string, string> = { Pending: 'PENDING', Inprogress: 'OPEN', Resolve: 'RESOLVED', Closed: 'CLOSED' };
      return map[backendStatus] || 'PENDING';
    }
    const map: Record<string, string> = { Pending: 'PENDING', Reviewed: 'OPEN', Resolved: 'RESOLVED', Rejected: 'CLOSED' };
    return map[backendStatus] || 'PENDING';
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, type, status }: { id: string, type: 'requests' | 'complaints', status: string }) => {
      const backendStatus = uiToBackendStatus(type, status);

      // NOTE: was PATCHing `${API_BASE}/${type}/${id}` — a route that never
      // existed on the backend for either type. Each type has its own real
      // endpoint and payload shape.
      const res = type === 'requests'
        ? await fetch(`${API_BASE}/support-requests/update_status/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: backendStatus, admin_reply: responseMessage }),
          })
        : await fetch(`${API_BASE}/users/update_report_status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ report_id: id, status: backendStatus, admin_note: responseMessage }),
          });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message?.[0] || json?.message || 'Failed to update status');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setSelectedItem(null);
      setResponseMessage('');
    }
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      // NOTE: was hitting the bare `${API_BASE}/requests` — no matching
      // backend route existed, so this tab always showed nothing even
      // though users had real "Report a Problem" tickets sitting in the
      // database. Real endpoint is `/support-requests/get_all`, and the raw
      // ReportProblem documents are normalized here into the shape this
      // page's UI expects (it has no native "subject"/"priority" fields).
      const res = await fetch(`${API_BASE}/support-requests/get_all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const list = json.data?.requests ?? [];
      return list.map((r: any) => ({
        id: r._id,
        username: r.user_id?.name || r.user_id?.email || 'Unknown user',
        subject: r.description ? (r.description.length > 60 ? `${r.description.slice(0, 60)}…` : r.description) : 'Reported problem',
        message: r.description || '',
        priority: 'MEDIUM',
        status: backendToUiStatus('requests', r.status),
        created_at: r.createdAt,
        updatedAt: r.updatedAt,
        admin_reply: r.admin_reply || '',
      }));
    }
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      // NOTE: was hitting the bare `${API_BASE}/complaints` — same issue.
      // "Complaints" are user-reports-user records, which already have a
      // real admin endpoint (built for the Users page fix) at
      // `/users/get_all_user_reports`.
      const res = await fetch(`${API_BASE}/users/get_all_user_reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const list = json.data?.reports ?? [];
      return list.map((r: any) => ({
        id: r._id,
        username: r.reported_by?.name || r.reported_by?.email || 'Unknown user',
        subject: `Reported user: ${r.reported_user?.name || r.reported_user?.email || 'Unknown'}${r.reason ? ` — ${r.reason}` : ''}`,
        message: r.description || r.reason || '',
        priority: 'MEDIUM',
        status: backendToUiStatus('complaints', r.status),
        created_at: r.createdAt,
        updatedAt: r.updatedAt,
        admin_reply: r.admin_note || '',
      }));
    }
  });

  const currentData = activeTab === 'requests' ? requests : complaints;
  const isLoading = activeTab === 'requests' ? requestsLoading : complaintsLoading;

  const filteredData = (Array.isArray(currentData) ? currentData : [])?.filter((item: any) => {
    const matchesSearch = item.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter
      || (statusFilter === 'UNRESOLVED' ? (item.status !== 'RESOLVED' && item.status !== 'CLOSED') : item.status === statusFilter);
    return matchesSearch && matchesStatus;
  }).sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'created_at') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    } else {
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    }

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

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field
      ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)
      : <ArrowUpDown className="w-3 h-3 opacity-50" />;

  const exportData = () => {
    const headers = ['User', 'Subject', 'Priority', 'Status', 'Date'];
    const rows = filteredData.map((item: any) => [
      `"${item.username || ''}"`, `"${item.subject || ''}"`, `"${item.priority || 'MEDIUM'}"`,
      `"${item.status || 'OPEN'}"`, `"${item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}"`,
    ]);
    const csv  = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Support & Requests</h2>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider",
                activeTab === 'requests' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider",
                activeTab === 'complaints' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Complaints
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(activeTab === 'requests' || activeTab === 'complaints') && (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats — was showing item.length for "Open"/"Pending" (i.e. ALL
                requests/complaints regardless of status, not just open/pending
                ones), and Avg. Response Time / Resolution Rate were hardcoded
                fake values ("2.4h", "94%") that never reflected real data.
                Now computed for real, and every card is clickable — clicking
                switches to the relevant tab and filters the list below to
                match, so the numbers on top and the rows on bottom always agree. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(() => {
                const reqList = Array.isArray(requests) ? requests : [];
                const compList = Array.isArray(complaints) ? complaints : [];
                const openRequests = reqList.filter((r: any) => r.status !== 'RESOLVED' && r.status !== 'CLOSED').length;
                const pendingComplaints = compList.filter((c: any) => c.status === 'PENDING').length;

                const allClosed = [...reqList, ...compList].filter((i: any) => i.status === 'RESOLVED' || i.status === 'CLOSED');
                const resolutionRate = (reqList.length + compList.length) > 0
                  ? Math.round((allClosed.length / (reqList.length + compList.length)) * 100)
                  : 0;

                const resolvedWithTimes = allClosed.filter((i: any) => i.created_at && i.updatedAt);
                const avgResolveMs = resolvedWithTimes.length > 0
                  ? resolvedWithTimes.reduce((sum: number, i: any) => sum + (new Date(i.updatedAt).getTime() - new Date(i.created_at).getTime()), 0) / resolvedWithTimes.length
                  : null;
                const avgResolveLabel = avgResolveMs === null ? '—' : avgResolveMs < 3600000
                  ? `${Math.round(avgResolveMs / 60000)}m`
                  : `${(avgResolveMs / 3600000).toFixed(1)}h`;

                return [
                  {
                    label: 'Open Requests', value: openRequests, icon: MessageSquarePlus, color: 'text-blue-400', bg: 'bg-blue-400/10',
                    onClick: () => { setActiveTab('requests'); setStatusFilter('UNRESOLVED'); },
                  },
                  {
                    label: 'Pending Complaints', value: pendingComplaints, icon: Flag, color: 'text-red-400', bg: 'bg-red-400/10',
                    onClick: () => { setActiveTab('complaints'); setStatusFilter('PENDING'); },
                  },
                  {
                    label: 'Avg. Time to Resolve', value: avgResolveLabel, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10',
                    onClick: null, // computed average, not tied to one filterable status
                  },
                  {
                    label: 'Resolution Rate', value: `${resolutionRate}%`, icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-400/10',
                    onClick: () => { setActiveTab('requests'); setStatusFilter('RESOLVED'); },
                  },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    onClick={stat.onClick || undefined}
                    disabled={!stat.onClick}
                    className={cn(
                      "glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4 text-left transition-all",
                      stat.onClick ? "hover:border-primary/40 hover:bg-white/[0.04] cursor-pointer" : "cursor-default"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  </button>
                ));
              })()}
            </div>

            {statusFilter && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span>Filtered by status: <span className="text-white font-bold">{statusFilter === 'UNRESOLVED' ? 'Open (not resolved)' : statusFilter}</span></span>
                <button onClick={() => setStatusFilter(null)} className="text-primary hover:underline font-bold">Clear</button>
              </div>
            )}

            {/* Table */}
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {activeTab === 'requests' ? 'User Requests' : 'User Complaints'}
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('username')}>
                        <div className="flex items-center gap-1.5">User <SortIcon field="username" /></div>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subject</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('priority')}>
                        <div className="flex items-center gap-1.5">Priority <SortIcon field="priority" /></div>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center gap-1.5">Date <SortIcon field="created_at" /></div>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading data...</td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">No data found.</td>
                      </tr>
                    ) : filteredData.map((item: any) => (
                      <tr key={item.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedItem(item)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold text-xs">
                              {item.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{item.username}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-white font-medium truncate max-w-[200px]">{item.subject}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", priorityColors[item.priority] || priorityColors.MEDIUM)}>
                            {item.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", statusColors[item.status] || statusColors.OPEN)}>
                            {item.status || 'OPEN'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      {selectedItem && (activeTab === 'requests' || activeTab === 'complaints') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {activeTab === 'requests' ? 'Request Details' : 'Complaint Details'}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-primary font-bold text-lg">
                    {selectedItem.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{selectedItem.username}</h4>
                    <p className="text-xs text-muted-foreground">User ID: {selectedItem.user_id}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", priorityColors[selectedItem.priority] || priorityColors.MEDIUM)}>
                    {selectedItem.priority || 'MEDIUM'} Priority
                  </span>
                  <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", statusColors[selectedItem.status] || statusColors.OPEN)}>
                    {selectedItem.status || 'OPEN'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Subject</p>
                  <p className="text-sm text-white font-bold">{selectedItem.subject}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Message</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.message}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Internal Response</h5>
                <textarea
                  rows={4}
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response to the user..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selectedItem.id, type: activeTab as any, status: 'CLOSED' })}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Close
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selectedItem.id, type: activeTab as any, status: 'RESOLVED' })}
                  disabled={updateStatusMutation.isPending || !responseMessage}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
                  {updateStatusMutation.isPending ? 'Processing...' : 'Send Response & Resolve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}