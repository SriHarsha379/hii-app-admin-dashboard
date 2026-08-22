import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, Calendar, Search, Loader2, CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_BASE } from '../lib/apiConfig';

// Real Bookings page for Club Admin — was entirely missing. The backend for
// this already existed in full (list/stats/status-update/delete), it just
// wasn't reachable from any admin-role token (vendorauth-only route, same
// gap already fixed for Events/Venues) and had no frontend page or nav
// link at all. This is genuine, existing Booking data — ticket purchases
// and venue bookings that have actually happened — not the Phase 2
// "Reservations with 10% token payment" concept, which has no backend yet.
const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const paymentColors: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function Bookings() {
  const { token, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();

  const { data: clubs } = useQuery({
    queryKey: ['clubs-bookings'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });
  const myVendor = Array.isArray(clubs) ? clubs.find((c: any) => c.name === user?.organisation) : null;

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', myVendor?._id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/booking/get_all_booking?vendor_id=${myVendor._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    enabled: Boolean(myVendor?._id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${API_BASE}/booking/update_booking_status/${id}?vendor_id=${myVendor?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update booking');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', myVendor?._id] }),
  });

  const list = Array.isArray(bookings) ? bookings : [];
  const filtered = list.filter((b: any) => {
    const name = `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.trim();
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase())
      || b.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
      || (b.event_id?.venue_name || b.venue_id?.venue_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const confirmedCount = list.filter((b: any) => b.status === 'confirmed').length;
  const totalRevenue = list.reduce((sum: number, b: any) => sum + (b.total || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Bookings</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Ticket purchases &amp; venue bookings for your venue</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</p>
          <p className="text-2xl font-black text-white mt-1">{list.length}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confirmed</p>
          <p className="text-2xl font-black text-white mt-1">{confirmedCount}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-black text-white mt-1">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, transaction ID, or event..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          {['ALL', 'confirmed', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                statusFilter === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'
              )}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Ticket className="w-8 h-8 text-white/10 mx-auto" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {list.length === 0 ? 'No bookings yet' : 'No bookings match this search/filter'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Guest</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Event / Venue</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payment</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b: any) => (
                <tr key={b._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{b.user?.first_name} {b.user?.last_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{b.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white/70">{b.event_id?.venue_name || b.venue_id?.venue_name || '—'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{b.booking_type}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-white">₹{(b.total || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border capitalize', paymentColors[b.payment_status] || paymentColors.pending)}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border capitalize', statusColors[b.status] || statusColors.confirmed)}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {b.status === 'confirmed' && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: b._id, status: 'completed' })}
                          disabled={updateStatusMutation.isPending}
                          title="Mark as completed"
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: b._id, status: 'cancelled' })}
                          disabled={updateStatusMutation.isPending}
                          title="Cancel booking"
                          className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}