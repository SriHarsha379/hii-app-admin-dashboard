import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Mail, 
  Shield, 
  MapPin, 
  Calendar, 
  Zap, 
  Building2, 
  Trophy, 
  ChevronRight,
  TrendingUp,
  Clock,
  Activity,
  Star
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GlowCard } from './ui/spotlight-card';
import EventProfilePreview from './EventProfilePreview';
import ClubProfilePreview from './ClubProfilePreview';

export default function NormalAdminProfile() {
  const { user, token } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedClub, setSelectedClub] = useState<any>(null);

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const res = await fetch('/api/clubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: polls } = useQuery({
    queryKey: ['polls'],
    queryFn: async () => {
      const res = await fetch('/api/polls', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: contests } = useQuery({
    queryKey: ['contests'],
    queryFn: async () => {
      const res = await fetch('/api/contests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const recentEvents = (Array.isArray(events) ? events : []).slice(0, 3);
  const accessibleClubs = (Array.isArray(clubs) ? clubs : []).slice(0, 4);
  const recentItems = [
    ...(Array.isArray(polls) ? polls.map(p => ({ ...p, type: 'POLL' })) : []),
    ...(Array.isArray(contests) ? contests.map(c => ({ ...c, type: 'CONTEST' })) : [])
  ].slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Profile Header */}
      <GlowCard customSize className="p-8 border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <User className="w-64 h-64" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-all duration-500 shadow-2xl">
              <img 
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-primary text-white shadow-lg border border-white/20">
              <Shield className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">{user?.name || 'Admin User'}</h1>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  {user?.role?.replace('_', ' ')}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest border-l border-white/10 pl-4">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {user?.email}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest border-l border-white/10 pl-4">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Global Access
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Events Managed</span>
                <span className="text-xl font-bold text-white">124</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Active Contests</span>
                <span className="text-xl font-bold text-white">8</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Total Reach</span>
                <span className="text-xl font-bold text-white">2.4k</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div className="text-center">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Performance</p>
              <p className="text-xl font-black text-white">+12.4%</p>
            </div>
          </div>
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Events & Clubs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                Latest Events
              </h2>
              <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group">
                View All <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentEvents.length > 0 ? recentEvents.map((event: any, index: number) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="group relative bg-[#121218] rounded-[24px] border border-white/5 overflow-hidden hover:border-primary/50 transition-all shadow-xl cursor-pointer"
                >
                  <div className="aspect-[16/9] relative">
                    <img 
                      src={event.landscape_url || event.poster_url || `https://picsum.photos/seed/${event.id}/800/450`} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121218] via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md",
                        event.status === 'LIVE' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-primary/20 text-primary border-primary/20"
                      )}>
                        {event.status || 'UPCOMING'}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate">{event.title}</h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-bold uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        {event.city} • {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">424 Active</span>
                      </div>
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full border border-[#121218] overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.id}${i}`} alt="" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center glass-card rounded-3xl border border-dashed border-white/10">
                  <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No recent events found</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Clubs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Building2 className="w-4 h-4 text-primary" />
                Accessible Clubs
              </h2>
              <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group">
                View All <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {accessibleClubs.map((club: any, index: number) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                  key={club.id}
                  onClick={() => setSelectedClub(club)}
                  className="group relative aspect-square bg-[#121218] rounded-[32px] border border-white/5 overflow-hidden hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-4 text-center p-4 cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors shadow-2xl overflow-hidden">
                    <img 
                      src={club.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${club.name}`} 
                      className="w-full h-full object-cover" 
                      alt=""
                    />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[100px]">{club.name}</h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-1">{club.city}</p>
                  </div>
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Polls & Stats */}
        <div className="space-y-8">
          {/* Recent Polls & Contests */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 px-2">
              <Trophy className="w-4 h-4 text-primary" />
              Polls & Contests
            </h2>
            
            <div className="space-y-4">
              {recentItems.length > 0 ? recentItems.map((item: any, index: number) => (
                <div key={item.id} className="glass-card p-5 rounded-3xl border border-white/5 hover:border-primary/30 transition-all space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Zap className="w-16 h-16 text-primary" />
                  </div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em]",
                        item.type === 'POLL' ? "text-primary" : "text-amber-400"
                      )}>{item.type}</span>
                      <h3 className="text-sm font-bold text-white mt-1 leading-tight">{item.title}</h3>
                    </div>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase tracking-widest">
                        {item.type === 'POLL' ? 'Responses' : 'Participants'}
                      </span>
                      <span className="text-white">{item.votes || item.participants || 0}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[65%]" />
                    </div>
                  </div>
                </div>
              )) : (
                 <div className="py-12 text-center glass-card rounded-3xl border border-dashed border-white/10">
                  <Zap className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No active items</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Chart */}
          <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary fill-primary" />
              Quick Analytics
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Engagement Rate', value: '42.4%', color: 'text-primary' },
                { label: 'New Followers', value: '+1.2k', color: 'text-emerald-400' },
                { label: 'Ticket Conversions', value: '8.4%', color: 'text-blue-400' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                  <span className={cn("text-xs font-black", stat.color)}>{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Admin Insight</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  "Your engagement is peaking during evening hours. Best time to blast new event notifications."
                </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Previews */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <EventProfilePreview 
                eventData={selectedEvent} 
                onClose={() => setSelectedEvent(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedClub && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClub(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <ClubProfilePreview 
                club={selectedClub} 
                onClose={() => setSelectedClub(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
