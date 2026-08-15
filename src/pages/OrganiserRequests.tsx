import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Check,
  X,
  Loader2,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { API_BASE } from '../lib/apiConfig';

// This page answers "where do we review Club and Event Organiser Admin
// requests and activities" — previously there was no such view anywhere:
// vendor signups (from ClubOnboarding.tsx) were auto-approved on the
// backend (`is_verified: default: true`) with no review step at all.
//
// Now new signups land here with `is_verified: false` and can't log in to
// the vendor portal until a Super Admin approves them. Rejecting a request
// soft-deletes the vendor record (consistent with how deletion works
// elsewhere in this app) and records a reason.

export default function OrganiserRequests() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'owner' | 'event_organizer'>('ALL');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: pending, isLoading } = useQuery({
    queryKey: ['organiser-requests'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors?is_verified=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
  });

  // Scoped to whichever organiser is currently expanded — shows what that
  // account has actually done (currently: signup, approve/reject events —
  // full activity coverage across every vendor action is still being
  // rolled out, see CHANGES.md).
  const { data: activity } = useQuery({
    queryKey: ['organiser-activity', expandedId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/activity-logs/get_all?search=${expandedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data?.logs ?? [];
    },
    enabled: Boolean(expandedId),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/vendor/approve_vendor/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to approve');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organiser-requests'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`${API_BASE}/vendor/reject_vendor/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organiser-requests'] });
      setRejectingId(null);
      setRejectReason('');
    },
  });

  const filtered = (Array.isArray(pending) ? pending : []).filter((v: any) =>
    typeFilter === 'ALL' || v.vendor_type === typeFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">Organiser <span className="text-primary neon-text">Requests</span></h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">
            New club & event organiser signups, pending your approval
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['ALL', 'owner', 'event_organizer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                typeFilter === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'
              )}
            >
              {t === 'ALL' ? 'All' : t === 'owner' ? 'Clubs' : 'Event Organisers'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center space-y-3">
          <UserPlus className="w-10 h-10 text-white/10 mx-auto" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">No pending requests</p>
          <p className="text-xs text-white/30">New club or event organiser signups will show up here for approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((v: any) => {
            const isExpanded = expandedId === v._id;
            return (
              <div key={v._id} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {v.vendor_type === 'owner' ? <Building2 className="w-5 h-5 text-purple-400" /> : <Calendar className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white">{v.name}</p>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-widest">Pending</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-white/40 font-medium">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {v.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {v.phone_number}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {v.city?.city_name || 'Not set'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : v._id)}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5" /> Activity
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === v._id ? null : v._id)}
                      className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(v._id)}
                      disabled={approveMutation.isPending}
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {rejectingId === v._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 overflow-hidden"
                    >
                      <div className="p-6 space-y-3 bg-red-500/[0.03]">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Rejecting removes this signup — they'll need to re-register to try again.
                        </div>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason (optional, helps them understand why)"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 placeholder:text-white/20"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all">
                            Cancel
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate({ id: v._id, reason: rejectReason })}
                            disabled={rejectMutation.isPending}
                            className="px-4 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                          >
                            {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 overflow-hidden"
                    >
                      <div className="p-6 space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Activity</p>
                        {!activity || activity.length === 0 ? (
                          <p className="text-xs text-white/30">No logged activity yet for this account.</p>
                        ) : (
                          activity.map((log: any) => (
                            <div key={log._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                              <span className="text-xs text-white/70">{log.details || log.action}</span>
                              <span className="text-[10px] text-white/30">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
