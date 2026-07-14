import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Download,
  Clock,
  Activity,
  Plus,
  Edit3,
  Trash2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

import { API_BASE } from '../lib/apiConfig';
const actionColors: any = {
  'CREATE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'UPDATE': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'DELETE': 'bg-red-500/10 text-red-400 border-red-500/20',
  'LOGIN': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'LOGOUT': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const actionIcons: any = {
  'CREATE': Plus,
  'UPDATE': Edit3,
  'DELETE': Trash2,
  'LOGIN': ShieldCheck,
  'LOGOUT': ShieldAlert,
};

export default function ActivityLogs() {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/activity-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const filteredData = (Array.isArray(logs) ? logs : [])?.filter((item: any) => {
    return item.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.resource?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-white tracking-tight uppercase underline decoration-primary/30 underline-offset-8">Activity Logs</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">System History</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..." 
                  className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Logs
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Admin Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resource</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading logs...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">No logs found.</td>
                  </tr>
                ) : filteredData.map((log: any) => {
                  const ActionIcon = actionIcons[log.action] || Activity;
                  return (
                    <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold text-xs">
                            {log.admin_name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{log.admin_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border", actionColors[log.action] || actionColors.UPDATE)}>
                            <ActionIcon className="w-3 h-3" />
                          </div>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", actionColors[log.action]?.split(' ')[1] || 'text-white')}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md border border-white/10">
                          {log.resource}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-muted-foreground max-w-xs truncate">{log.details}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
