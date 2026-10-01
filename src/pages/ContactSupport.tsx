import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../lib/apiConfig';

// Club admins and event organisers contact Hii support here (their requests
// appear in the admin's Support & Requests under "Clubs" / "Event organisers").
const STATUS_LABEL: Record<string, string> = {
  Pending: 'Pending', Inprogress: 'In progress', Resolve: 'Resolved', Closed: 'Closed',
};

export default function ContactSupport() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['support-categories'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/support-requests/categories`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      const lists = json.data || {};
      return (Object.values(lists)[0] as string[]) || [];
    },
  });

  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ['my-support-requests'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/support-requests/my_requests`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/support-requests/my_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: category || categories[0] || 'Other', description }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Could not send your request');
      return json;
    },
    onSuccess: () => {
      setDescription('');
      setNotice({ ok: true, text: "Request sent. We'll get back to you soon." });
      queryClient.invalidateQueries({ queryKey: ['my-support-requests'] });
    },
    onError: (e: any) => setNotice({ ok: false, text: String(e?.message || e) }),
  });

  const canSend = description.trim().length > 0 && !send.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Contact Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Need help, or want your club or event featured? Send us a request.</p>
      </div>

      <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map((c: string) => {
              const active = (category || categories[0]) === c;
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${active ? 'bg-primary text-white border-primary' : 'border-border/50 text-muted-foreground hover:text-white'}`}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your message</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={2000}
            placeholder="Tell us what you need..."
            className="w-full mt-2 bg-background border border-border/50 rounded-xl p-3 text-sm text-white outline-none focus:border-primary" />
        </div>
        {notice && <p className={`text-sm font-medium ${notice.ok ? 'text-emerald-400' : 'text-red-400'}`}>{notice.text}</p>}
        <button type="button" disabled={!canSend} onClick={() => { setNotice(null); send.mutate(); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-40">
          <Send className="w-4 h-4" /> {send.isPending ? 'Sending...' : 'Send request'}
        </button>
      </div>

      <div className="bg-card border border-border/40 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Your requests</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : myRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <div className="space-y-3">
            {myRequests.map((r: any) => (
              <div key={r._id} className="border border-border/30 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{r.category || 'Other'}</span>
                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                    {r.status === 'Resolve' || r.status === 'Closed' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                </div>
                <p className="text-sm text-white mt-2 whitespace-pre-wrap">{r.description}</p>
                {r.admin_reply && (
                  <div className="mt-3 border-l-2 border-primary pl-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reply from Hii</p>
                    <p className="text-sm text-white/90 mt-1 whitespace-pre-wrap">{r.admin_reply}</p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
