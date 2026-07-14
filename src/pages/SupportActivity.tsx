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
  Download
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, type, status }: { id: string, type: 'requests' | 'complaints', status: string }) => {
      const res = await fetch(`${API_BASE}/${type}/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setSelectedItem(null);
      setResponseMessage('');
    }
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const currentData = activeTab === 'requests' ? requests : complaints;
  const isLoading = activeTab === 'requests' ? requestsLoading : complaintsLoading;

  const filteredData = (Array.isArray(currentData) ? currentData : [])?.filter((item: any) => {
    return item.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.message?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Support & Requests</h2>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
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
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Open Requests', value: requests?.length || '0', icon: MessageSquarePlus, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { label: 'Pending Complaints', value: complaints?.length || '0', icon: Flag, color: 'text-red-400', bg: 'bg-red-400/10' },
                { label: 'Avg. Response Time', value: '2.4h', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { label: 'Resolution Rate', value: '94%', icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

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
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">User</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subject</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Priority</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
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
