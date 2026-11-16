import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, X, Loader2, Info, Zap, Users, Calendar, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiFetch';
import { API_BASE } from '../lib/apiConfig';
import { cn } from '../lib/utils';

type NotifType = 'booking' | 'user' | 'event' | 'club' | 'system' | string;

const ICONS: Record<NotifType, React.ReactNode> = {
  booking:  <Zap       className="w-3.5 h-3.5 text-primary"    />,
  user:     <Users     className="w-3.5 h-3.5 text-blue-400"   />,
  event:    <Calendar  className="w-3.5 h-3.5 text-purple-400" />,
  club:     <Building2 className="w-3.5 h-3.5 text-amber-400"  />,
  system:   <Info      className="w-3.5 h-3.5 text-white/40"   />,
};

function getIcon(type: string) {
  return ICONS[type] || ICONS.system;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationCenter() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiFetch(token, `${API_BASE}/notifications/get_all`);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    refetchInterval: 30000, // poll every 30s
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(token, `${API_BASE}/notifications/mark_read/${id}`, { method: 'POST' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiFetch(token, `${API_BASE}/notifications/mark_all_read`, { method: 'POST' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-primary/40">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{    opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 z-50 glass-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <p className="text-xs font-black text-white uppercase tracking-widest">
                Notifications {unreadCount > 0 && <span className="text-primary">({unreadCount})</span>}
              </p>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    title="Mark all as read"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Bell className="w-6 h-6 text-white/10 mx-auto" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.slice(0, 20).map((n: any) => (
                  <div
                    key={n._id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors cursor-pointer',
                      n.is_read ? 'opacity-60 hover:opacity-100' : 'bg-primary/[0.03] hover:bg-primary/[0.06]'
                    )}
                    onClick={() => { if (!n.is_read) markReadMutation.mutate(n._id); }}
                  >
                    <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-bold truncate', n.is_read ? 'text-white/60' : 'text-white')}>
                        {n.title || n.message || 'Notification'}
                      </p>
                      {n.body && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[9px] text-white/20 mt-1 font-bold uppercase tracking-widest">
                        {n.createdAt ? timeAgo(n.createdAt) : '—'}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
