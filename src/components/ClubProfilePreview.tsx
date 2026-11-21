
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import EventProfilePreview from './EventProfilePreview';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/apiConfig';
import {
  Heart, MapPin, Calendar as CalendarIcon, Clock, X,
  ChevronLeft as ChevronLeftIcon, Users, Activity,
  CalendarDays, ChevronRight as ChevronRightIcon,
  Building2, Star, Phone, Globe, Shield,
} from 'lucide-react';

interface ClubProfilePreviewProps {
  club: any; onClose?: () => void; onEdit?: () => void; hideCloseButton?: boolean;
}

export default function ClubProfilePreview({ club, onClose, onEdit, hideCloseButton }: ClubProfilePreviewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab]         = useState<'info' | 'events' | 'gallery'>('info');

  const UPLOADS_BASE = API_BASE.replace(/\/api\/v1\/admin\/?$/, '/uploads');
  const imgUrl = (f: any) => !f ? '' : (/^https?:\/\//i.test(f) ? f : UPLOADS_BASE + '/' + f);

  const data = React.useMemo(() => {
    const b = club || {};
    const cityName = typeof b.city === 'object' && b.city ? (b.city.city_name || '') : (b.city || '');
    return {
      name:        b.venue_name || b.name || 'Unnamed Club',
      coverImg:    imgUrl(b.venue_image || b.business_image || b.portrait_url || b.poster_url || ''),
      tags:        Array.isArray(b.category_ids) ? b.category_ids.map((c: any) => c?.category_name || c).filter(Boolean) : [],
      openDays:    Array.isArray(b.open_days) ? b.open_days : [],
      startTime:   b.start_time || '',
      endTime:     b.end_time   || '',
      city:        cityName,
      address:     b.address || '',
      followers:   String(b.likes || 0),
      capacity:    b.capacity  || 'Not set',
      about:       b.about || b.description || 'No description available.',
      gallery:     (Array.isArray(b.gallery_images) ? b.gallery_images : (Array.isArray(b.landscape_urls) ? b.landscape_urls : [])).filter(Boolean).map(imgUrl),
      phone:       b.phone || b.phone_number || b.contact_number || '',
      landline:    b.landline || b.landline_number || '',
      email:       b.email || '',
      website:     b.website || '',
      isVerified:  !!b.is_verified,
      isActive:    b.is_active !== false,
    };
  }, [club]);

  const { token } = useAuth();
  const vendorId = (club && typeof club.vendor_id === 'object' && club.vendor_id)
    ? (club.vendor_id._id || club.vendor_id.id)
    : (club && (club.vendor_id || club._id || club.id)) || '';

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['club-upcoming-events', vendorId],
    enabled: Boolean(token && vendorId),
    queryFn: async () => {
      const res = await fetch(API_BASE + '/events/list', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) return [];
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      const vid  = (e: any) => (e && typeof e.vendor_id === 'object' && e.vendor_id) ? (e.vendor_id._id || e.vendor_id.id) : (e && e.vendor_id);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return list
        .filter((e: any) => !e.is_deleted && String(vid(e)) === String(vendorId))
        .filter((e: any) => { const d = new Date(e.end_date || e.start_date); return !isNaN(d.getTime()) && d >= today; })
        .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    },
  });

  const hours = data.startTime && data.endTime ? `${data.startTime} – ${data.endTime}` : (data.startTime || 'Hours not set');
  const daysLabel = data.openDays.length ? data.openDays.join(', ') : 'Days not set';

  return (
    <div className="flex flex-col h-full bg-[#08080c] text-white relative select-none font-sans overflow-hidden">

      {/* Top bar */}
      {!hideCloseButton && (
        <div className="absolute top-0 inset-x-0 h-20 z-50 flex items-center justify-between px-5 pointer-events-none">
          <button onClick={onClose} className="w-11 h-11 bg-black/50 backdrop-blur-xl rounded-2xl flex items-center justify-center pointer-events-auto border border-white/10 hover:bg-black/70 transition-all active:scale-95">
            <ChevronLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 pointer-events-auto">
            {onEdit && (
              <button onClick={onEdit} className="h-11 px-5 bg-primary rounded-2xl flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 text-white text-[10px] font-black uppercase tracking-widest">
                Edit
              </button>
            )}
            <button onClick={onClose} className="w-11 h-11 bg-black/50 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 hover:bg-black/70 transition-all active:scale-95">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* Hero */}
        <div className="relative h-[380px] shrink-0 overflow-hidden">
          {data.coverImg ? (
            <img src={data.coverImg} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a0a2e] via-[#0d0d1a] to-[#1a0a10] flex items-center justify-center">
              <Building2 className="w-20 h-20 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/60 to-transparent" />

          {/* Status badges */}
          <div className="absolute top-6 right-5 flex flex-col gap-2 items-end">
            {data.isVerified && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}
            <span className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', data.isActive ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400')}>
              {data.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            {data.tags.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {data.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-[0.2em] border border-white/10">{tag}</span>
                ))}
              </div>
            )}
            <h1 className="text-3xl font-black tracking-tight text-white leading-tight">{data.name}</h1>
            {data.city && (
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 mt-2 uppercase tracking-widest">
                <MapPin className="w-3.5 h-3.5 text-primary" />{data.city}
              </p>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 border-b border-white/5">
          {[
            { label: 'Followers', value: data.followers, icon: Heart },
            { label: 'Capacity',  value: data.capacity,  icon: Users },
            { label: 'Events',    value: String(upcomingEvents.length || 0), icon: CalendarIcon },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-5 gap-1 border-r border-white/5 last:border-r-0">
              <s.icon className="w-4 h-4 text-primary" />
              <p className="text-base font-black text-white">{s.value}</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-4 pt-2">
          {(['info', 'events', 'gallery'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px',
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-white/30 hover:text-white/60')}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 space-y-5">

              {/* Hours & Days */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-blue-400" /></div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Open Hours</p>
                    <p className="text-sm font-black text-white">{hours}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{daysLabel}</p>
                  </div>
                </div>
                {data.address && (
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-purple-400" /></div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Address</p>
                      <p className="text-sm font-black text-white leading-snug">{data.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact */}
              {(data.phone || data.email || data.website) && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Contact</p>
                  {data.phone   && <div className="flex items-center gap-3 text-sm text-white/70"><Phone  className="w-4 h-4 text-white/30 shrink-0" />{data.phone} <span className="text-[10px] text-white/30 uppercase tracking-widest">Mobile</span></div>}
      {data.landline && <div className="flex items-center gap-3 text-sm text-white/70"><Phone  className="w-4 h-4 text-white/30 shrink-0" />{data.landline} <span className="text-[10px] text-white/30 uppercase tracking-widest">Landline</span></div>}
                  {data.email   && <div className="flex items-center gap-3 text-sm text-white/70"><Activity className="w-4 h-4 text-white/30 shrink-0" />{data.email}</div>}
                  {data.website && <div className="flex items-center gap-3 text-sm text-white/70"><Globe  className="w-4 h-4 text-white/30 shrink-0" />{data.website}</div>}
                </div>
              )}

              {/* About */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">About</p>
                <p className="text-[13px] text-white/50 leading-relaxed font-medium">{data.about}</p>
              </div>
            </motion.div>
          )}

          {/* Tab: Events */}
          {activeTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <CalendarIcon className="w-10 h-10 text-white/10 mx-auto" />
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">No upcoming events</p>
                </div>
              ) : upcomingEvents.map((event: any, i: number) => (
                <div key={event._id || i} onClick={() => setSelectedEvent(event)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer group">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                    {event.venue_image || event.poster_url ? (
                      <img src={event.venue_image || event.poster_url} alt="" className="w-full h-full object-cover" />
                    ) : <CalendarDays className="w-5 h-5 text-white/20 m-auto mt-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate group-hover:text-primary transition-colors">{event.venue_name || event.title}</p>
                    <p className="text-[10px] text-white/30 font-bold uppercase mt-0.5">
                      {event.start_date ? new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors shrink-0" />
                </div>
              ))}
            </motion.div>
          )}

          {/* Tab: Gallery */}
          {activeTab === 'gallery' && (
            <motion.div key="gallery" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 pb-12">
              {data.gallery.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Building2 className="w-10 h-10 text-white/10 mx-auto" />
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">No gallery images</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {data.gallery.map((img: string, i: number) => (
                    <div key={i} className={cn('rounded-2xl overflow-hidden bg-white/5 border border-white/10', i === 0 ? 'col-span-2 aspect-video' : 'aspect-square')}>
                      <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Event drawer */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEvent(null)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-2xl overflow-hidden border-l border-white/5">
              <EventProfilePreview eventData={selectedEvent} onClose={() => setSelectedEvent(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
