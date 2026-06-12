import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import EventProfilePreview from './EventProfilePreview';
import { 
  Heart, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  X,
  ChevronLeft as ChevronLeftIcon,
  Users,
  Activity,
  CalendarDays,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

interface ClubProfilePreviewProps {
  club: any;
  onClose?: () => void;
}

export default function ClubProfilePreview({ club, onClose }: ClubProfilePreviewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const data = React.useMemo(() => {
    const base = club || {};
    return {
      name: base.name || 'Unnamed club',
      portrait_url: base.portrait_url || base.poster_url || '',
      tags: Array.isArray(base.tags) ? base.tags : [],
      date: base.date || 'Schedule not set',
      time: base.time || 'Hours not set',
      location: base.city || base.location || 'Location not set',
      venue: base.venue || base.name || 'Venue not set',
      followers: String(base.likes || 0),
      capacity: base.capacity || 'Not set',
      about: base.about || base.description || 'No description available.',
      gallery: Array.isArray(base.gallery) ? base.gallery : (Array.isArray(base.landscape_urls) ? base.landscape_urls.filter(Boolean) : []),
      pastEvents: Array.isArray(base.pastEvents) ? base.pastEvents : (Array.isArray(base.lineup) ? base.lineup : [])
    };
  }, [club]);

  return (
    <div className="flex flex-col h-full bg-black text-white relative select-none font-sans overflow-hidden">
      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 h-20 z-50 flex items-center justify-between px-6 pointer-events-none">
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center pointer-events-auto border border-white/5 hover:bg-black/60 transition-all active:scale-95 group"
        >
          <ChevronLeftIcon className="w-6 h-6 text-white group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center pointer-events-auto border border-white/5 hover:bg-black/60 transition-all active:scale-95"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Cover Image Section */}
        <div className="relative h-[480px] shrink-0 overflow-hidden">
          {data.portrait_url ? (
            <img src={data.portrait_url} alt={data.name} className="w-full h-full object-cover scale-105" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-white/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Featured Badge */}
          <div className="absolute bottom-12 left-6 right-6 flex items-end justify-between">
            <div className="space-y-4">
              <div className="flex gap-2">
                {data.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-[0.2em] border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white leading-[1.1] max-w-[280px]">
                {data.name}
              </h1>
            </div>
            
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="w-14 h-14 rounded-full bg-[#FF2D9A]/20 backdrop-blur-xl border border-[#FF2D9A]/30 flex items-center justify-center shadow-xl group cursor-pointer active:scale-90 transition-transform">
                <Heart className="w-6 h-6 text-[#FF2D9A] fill-[#FF2D9A]" />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{data.followers}</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="px-6 py-8 space-y-10">
          
          {/* Vital Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Timing</p>
                <p className="text-[11px] font-black text-white truncate">{data.date}</p>
                <p className="text-[9px] font-bold text-white/50">{data.time}</p>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Location</p>
                <p className="text-[11px] font-black text-white truncate">{data.venue}</p>
                <p className="text-[9px] font-bold text-white/50 truncate">{data.location}</p>
              </div>
            </div>
          </div>

          {/* Immersive Details Bar */}
          <div className="flex items-center justify-between py-4 px-6 rounded-[2rem] bg-gradient-to-r from-[#FF2D9A]/10 to-transparent border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-[9px] font-black text-white uppercase tracking-widest">Status: Open</p>
                <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.15em]">Verified Club</p>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-white/20" />
              <div>
                <p className="text-[9px] font-black text-white uppercase tracking-widest">{data.capacity}</p>
                <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.15em]">Capacity</p>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-[#FF2D9A] uppercase tracking-[0.3em]">Gallery</h3>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <Activity className="w-3 h-3 text-white/40" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Experience</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.gallery.map((img: string, i: number) => (
                <div key={i} className={cn(
                  "rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-lg",
                  (i === 0 || i === 3) ? "aspect-square" : "aspect-[4/5]"
                )}>
                  <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-[#FF2D9A] uppercase tracking-[0.3em]">About</h3>
            <p className="text-[13px] text-white/50 leading-relaxed font-medium">
              "{data.about}"
            </p>
          </div>

          {/* Past Events Section */}
          <div className="space-y-5 pb-12">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-[#FF2D9A] uppercase tracking-[0.3em]">Past Events</h3>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <CalendarDays className="w-3 h-3 text-white/40" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">History</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {data.pastEvents.map((event: any, i: number) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedEvent(event)}
                  className="flex items-center justify-between p-3 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                      {event.image ? (
                        <img src={event.image} alt={event.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <CalendarDays className="w-5 h-5 text-white/20 m-auto mt-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-tight">{event.name}</p>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">{event.role}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-white/10 group-hover:text-primary transition-colors mr-2" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Event Details Drawer Overlay */}
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
    </div>
  );
}
