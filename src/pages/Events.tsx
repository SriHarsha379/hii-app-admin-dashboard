import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  MoreHorizontal,
  Zap,
  User,
  ChevronRight,
  ChevronLeft,
  X,
  Shield,
  Activity,
  ArrowRight,
  Database,
  Loader2,
  Check,
  Info,
  Image,
  Star,
  MapPin,
  Building2,
  Ticket,
  Calendar,
  Clock,
  Users,
  XCircle,
  BarChart2,
  CheckCircle2,
  Download,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { motion, AnimatePresence } from 'motion/react';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { FeatureEventModal } from '../components/FeatureEventModal';
import EventProfilePreview from '../components/EventProfilePreview';
import { Layout as LayoutIcon } from 'lucide-react';

const statusColors: any = {
  'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'PAST': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  'CANCELLED': 'bg-red-500/10 text-red-400 border-red-500/20',
};

// ─── Upload a single file, returns the URL string ────────────────────────────
async function uploadFile(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  // Adjust the key to match whatever your backend returns, e.g. data.url / data.path
  return data.url ?? data.path ?? data.secure_url;
}

// ─── ImageUploadZone ─────────────────────────────────────────────────────────
function ImageUploadZone({
  label,
  hint,
  value,
  onChange,
  aspect,
  token,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  aspect: string;
  token: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const url = await uploadFile(file, token);
      onChange(url);
    } catch (e) {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block">{label}</label>
      <div
        className={cn(
          aspect,
          'w-full rounded-[40px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all group relative overflow-hidden'
        )}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Preview */}
        {value && !uploading && (
          <>
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[11px] font-black uppercase text-white tracking-[0.2em]">Change Image</span>
            </div>
          </>
        )}

        {/* Uploading spinner */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-[11px] font-black uppercase text-white/60 tracking-[0.2em]">Uploading…</span>
          </div>
        )}

        {/* Placeholder */}
        {!value && !uploading && (
          <>
            <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-all relative z-10 shadow-2xl">
              <Upload className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-2 text-center relative z-10">
              <span className="text-[11px] font-black uppercase text-white/40 tracking-[0.2em] block">Upload Image</span>
              <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{hint}</span>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && <p className="text-[10px] text-red-400 font-bold ml-2">{error}</p>}
    </div>
  );
}

// ─── GalleryUploadZone ───────────────────────────────────────────────────────
function GalleryUploadZone({
  urls,
  onChange,
  token,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  token: string;
}) {
  const slots = [0, 1, 2, 3];

  const handleFile = async (index: number, file: File) => {
    try {
      const url = await uploadFile(file, token);
      const next = [...urls];
      next[index] = url;
      onChange(next);
    } catch {}
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block">Gallery Preview</label>
      <div className="grid grid-cols-2 gap-4">
        {slots.map((i) => {
          const inputRef = React.createRef<HTMLInputElement>();
          return (
            <div
              key={i}
              className="aspect-square rounded-3xl bg-[#09090B] border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden"
              onClick={() => inputRef.current?.click()}
            >
              {urls[i] ? (
                <>
                  <img src={urls[i]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <Plus className="w-6 h-6 text-white/10 group-hover:text-primary transition-colors" />
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(i, file);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Events() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCity, setFilterCity] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const blankForm = {
    title: '',
    city: '',
    venue_id: '',
    vendor_id: '',
    genre: [] as string[],
    event_type: [] as string[],
    date: '',
    start_time: '',
    end_time: '',
    description: '',
    poster_url: '',
    landscape_url: '',
    gallery_urls: ['', '', '', ''] as string[],
    ticketing_link: '',
  };

  const [eventFormData, setEventFormData] = useState<any>(blankForm);
  const [creationStep, setCreationStep] = useState(1);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFeaturing, setIsFeaturing] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch('/api/mongo/cities', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch('/api/genres', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const { data: eventTypes } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const res = await fetch('/api/eventTypes', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ['mongo-vendors'],
    queryFn: async () => {
      const res = await fetch('/api/mongo/vendors', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const vendorList = Array.isArray(vendors) ? vendors : [];
  const getVendorId = (event: any) => {
    if (!event) return '';
    if (typeof event.vendor_id === 'object') return event.vendor_id?._id || event.vendor_id?.id || '';
    return event.vendor_id || event.venue_id || '';
  };
  const getVendorName = (vendorId: string) => vendorList.find((vendor: any) => (vendor._id || vendor.id) === vendorId)?.name || '';

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create event');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsCreatingEvent(false);
      setEventFormData(blankForm);
      setCreationStep(1);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/events/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update event');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsCreatingEvent(false);
      setIsEditingEvent(false);
      setSelectedEvent(null);
      setEventFormData(blankForm);
      setCreationStep(1);
    },
  });

  const featureEventMutation = useMutation({
    mutationFn: async (data: { city: string; eventId: string; duration: number }) => {
      const res = await fetch('/api/events/feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  // ── Derived stats (no separate /api/stats call) ────────────────────────────
  const eventList = Array.isArray(events) ? events : [];
  const liveCount = eventList.filter((e: any) => e.status === 'LIVE' || e.status === 'UPCOMING').length;
  const cancelledCount = eventList.filter((e: any) => e.status === 'CANCELLED').length;
  const totalAttendance = eventList.reduce((sum: number, e: any) => sum + (Number(e.attendance) || 0), 0);
  const totalTicketsSold = eventList.reduce((sum: number, e: any) => sum + (Number(e.tickets_sold) || 0), 0);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredEvents = eventList.filter((e: any) => {
    const matchesSearch =
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.city?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (filterStatus === 'ACTIVE') matchesStatus = e.status === 'LIVE' || e.status === 'UPCOMING';
    else if (filterStatus === 'PAST') matchesStatus = e.status === 'COMPLETED';
    else if (filterStatus !== 'ALL') matchesStatus = e.status === filterStatus;
    const matchesCity = filterCity === 'ALL' || e.city === filterCity;
    return matchesSearch && matchesStatus && matchesCity;
  });

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportData = () => {
    const headers = ['Title', 'City', 'Date', 'Status', 'Attendance', 'Genre'];
    const rows = filteredEvents.map((e: any) => [
      `"${e.title || ''}"`,
      `"${e.city || ''}"`,
      `"${e.date || ''}"`,
      `"${e.status || ''}"`,
      `"${e.attendance || 0}"`,
      `"${Array.isArray(e.genre) ? e.genre.join(', ') : (e.genre || '')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const vendor_id = eventFormData.vendor_id || eventFormData.venue_id;

      // Validate required fields before sending
      const missingFields = [];
      if (!eventFormData.title && !eventFormData.venue_name) missingFields.push('Event Title');
      if (!vendor_id) missingFields.push('Venue');
      if (!eventFormData.date && !eventFormData.start_date) missingFields.push('Event Date');
      if (!eventFormData.start_time) missingFields.push('Start Time');
      if (!eventFormData.end_time) missingFields.push('End Time');
      if (!eventFormData.description && !eventFormData.about) missingFields.push('Event Description');
      if (!eventFormData.city && !eventFormData.address) missingFields.push('City/Address');
      if (missingFields.length > 0) {
        setSubmitError(`Please fill in: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      const dateStr = eventFormData.date || eventFormData.start_date || new Date().toISOString().split('T')[0];

      // Map frontend fields → MongoDB schema fields
      const payload = {
        vendor_id,
        venue_name:   eventFormData.title || eventFormData.venue_name || '',
        about:        eventFormData.description || eventFormData.about || '',
        address:      eventFormData.city || eventFormData.address || '',
        start_date:   dateStr,
        end_date:     dateStr,
        start_time:   eventFormData.start_time || '20:00',
        end_time:     eventFormData.end_time || '23:59',
        venue_image:  eventFormData.poster_url || eventFormData.venue_image || 'default.png',
        gallery_images: [eventFormData.landscape_url, ...eventFormData.gallery_urls].filter(Boolean),
        category_ids: [],
        artists:      [],
        is_multi_day: false,
        is_active:    true,
        is_deleted:   false,
        ...(isEditingEvent && eventFormData.id ? { id: eventFormData.id } : {}),
      };

      if (isEditingEvent && eventFormData.id) {
        await updateEventMutation.mutateAsync(payload);
      } else {
        await createEventMutation.mutateAsync(payload);
      }
    } catch (e: any) {
      setSubmitError(e.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Open edit ──────────────────────────────────────────────────────────────
  const openEdit = (event: any) => {
    setEventFormData({
      id: event.id,
      title: event.title || '',
      city: event.city || '',
      venue_id: getVendorId(event),
      vendor_id: getVendorId(event),
      genre: Array.isArray(event.genre) ? event.genre : (event.genre ? [event.genre] : []),
      event_type: Array.isArray(event.event_type) ? event.event_type : (event.event_type ? [event.event_type] : []),
      date: event.date ? event.date.slice(0, 10) : '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      description: event.description || '',
      poster_url: event.poster_url || '',
      landscape_url: event.landscape_url || (Array.isArray(event.landscape_urls) ? event.landscape_urls[0] : '') || '',
      gallery_urls: Array.isArray(event.landscape_urls) ? [...event.landscape_urls.slice(1), '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      ticketing_link: event.ticketing_link || '',
    });
    setIsEditingEvent(true);
    setIsCreatingEvent(true);
    setCreationStep(1);
  };

  const statusLabel = (event: any) => {
    if (event.status === 'LIVE' || event.status === 'UPCOMING') return 'ACTIVE';
    if (event.status === 'COMPLETED') return 'PAST';
    return event.status || 'ACTIVE';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
            Event <span className="text-primary neon-text">Management</span>
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <Calendar className="w-3 h-3" />
            Manage and organize all your upcoming and past events
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportData}
            className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {user?.role !== 'EVENT_ADMIN' && (
            <button
              onClick={() => setIsFeaturing(true)}
              className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Star className="w-3.5 h-3.5" />
              Featured
            </button>
          )}
          <button
            onClick={() => {
              setEventFormData(blankForm);
              setIsEditingEvent(false);
              setIsCreatingEvent(true);
              setCreationStep(1);
              setSubmitError('');
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      </div>

      {/* Stats — derived from real events data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {[
          { label: 'Total Events', value: eventList.length, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Live & Upcoming', value: liveCount, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Total Attendance', value: totalAttendance.toLocaleString(), icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Tickets Sold', value: totalTicketsSold.toLocaleString(), icon: Ticket, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Cities', value: [...new Set(eventList.map((e: any) => e.city).filter(Boolean))].length, icon: MapPin, color: 'text-pink-400', bg: 'bg-pink-400/10' },
          { label: 'Genres', value: [...new Set(eventList.flatMap((e: any) => Array.isArray(e.genre) ? e.genre : [e.genre]).filter(Boolean))].length, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Venues', value: [...new Set(eventList.map((e: any) => getVendorId(e)).filter(Boolean))].length, icon: Building2, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
          { label: 'Cancelled', value: cancelledCount, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-[2rem] border border-white/10 flex flex-col gap-3 hover:border-white/20 transition-all group">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Event List */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Event List</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white')}>
                <LayoutIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('table')} className={cn('p-2 rounded-lg transition-all', viewMode === 'table' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white')}>
                <Database className="w-4 h-4" />
              </button>
            </div>
            <FilterPanel>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                <FilterDropdown value={filterCity} onChange={setFilterCity} options={[{ label: 'All Cities', value: 'ALL' }, ...(cities?.map((city: any) => ({ label: city.name, value: city.name })) || [])]} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                <FilterDropdown value={filterStatus} onChange={setFilterStatus} options={[{ label: 'All Status', value: 'ALL' }, { label: 'Active', value: 'ACTIVE' }, { label: 'Past', value: 'PAST' }, { label: 'Cancelled', value: 'CANCELLED' }]} />
              </div>
            </FilterPanel>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">Loading events…</div>
            ) : filteredEvents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">No events found.</div>
            ) : filteredEvents.map((event: any) => (
              <motion.div key={event.id} whileHover={{ y: -5 }} className="glass-card rounded-2xl border border-white/10 overflow-hidden group cursor-pointer" onClick={() => { setSelectedEvent(event); setIsPreviewing(true); }}>
                <div className="aspect-video relative overflow-hidden">
                  {event.landscape_url || event.poster_url ? (
                    <img src={event.landscape_url || event.poster_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center"><Calendar className="w-12 h-12 text-white/15" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border backdrop-blur-md', statusColors[statusLabel(event)] || statusColors.ACTIVE)}>
                      {statusLabel(event)}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">{event.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                      <Building2 className="w-3 h-3" />
                      {event.vendor_id?.name || getVendorName(getVendorId(event)) || event.city || '—'}
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-bold text-white">{new Date(event.date || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold text-white">{event.attendance || '0'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[100px]">
                        {Array.isArray(event.genre) ? event.genre[0] : (event.genre || '—')}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase">{event.city || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(event); }} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all" title="Edit">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Event Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Venue / City</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date & Time</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading events…</td></tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">No events found.</td></tr>
                  ) : filteredEvents.map((event: any) => (
                    <tr key={event.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setSelectedEvent(event); setIsPreviewing(true); }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                            {event.poster_url ? <img src={event.poster_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Calendar className="w-4 h-4 text-white/20" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{event.title}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {Array.isArray(event.genre) ? event.genre.join(', ') : (event.genre || '—')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{event.vendor_id?.name || getVendorName(getVendorId(event)) || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{event.city || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{new Date(event.date || new Date()).toLocaleDateString()}</p>
                        <p className="text-[10px] text-muted-foreground">{event.start_time || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border', statusColors[statusLabel(event)] || statusColors.ACTIVE)}>
                          {statusLabel(event)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user?.role === 'EVENT_ADMIN' && (
                            <button onClick={(e) => { e.stopPropagation(); setShowAnalytics(event); }} className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                              <BarChart2 className="w-4 h-4" />
                              Stats
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); openEdit(event); }} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" title="Edit event">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Back button for preview */}
      <AnimatePresence>
        {selectedEvent && isPreviewing && (
          <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }} className="fixed top-8 left-8 z-[200] w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 hover:border-primary/50 transition-all group active:scale-95 shadow-2xl">
            <ChevronLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Event Preview */}
      <AnimatePresence>
        {selectedEvent && isPreviewing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110]" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:pr-[420px] pointer-events-none">
              <div className="w-full max-w-2xl bg-[#09090B] border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] pointer-events-auto">
                <div className="relative aspect-video">
                  {selectedEvent.landscape_url || selectedEvent.poster_url ? (
                    <img src={selectedEvent.landscape_url || selectedEvent.poster_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center"><Calendar className="w-12 h-12 text-white/15" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-10 right-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">{selectedEvent.status || 'Active'}</span>
                      <span className="text-[10px] text-white/40 font-black uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{selectedEvent.city}</span>
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">{selectedEvent.title}</h2>
                    <p className="text-sm text-white/60 font-medium">{selectedEvent.description?.substring(0, 120)}{selectedEvent.description?.length > 120 ? '…' : ''}</p>
                  </div>
                </div>
                <div className="p-10 grid grid-cols-2 gap-6">
                  <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-primary/20 transition-all">
                    <div>
                      <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Event Status</p>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-2xl font-black text-white uppercase tracking-tight">{statusLabel(selectedEvent)}</p>
                      </div>
                    </div>
                    <button onClick={() => openEdit(selectedEvent)} className="w-full mt-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                      Edit Event
                    </button>
                  </div>
                  <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Attendance</p>
                          <p className="text-6xl font-black text-white mt-4">{selectedEvent.attendance || 0}</p>
                        </div>
                        <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:scale-110 transition-transform">
                          <Users className="w-8 h-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[130] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5 overflow-hidden">
              <EventProfilePreview eventData={selectedEvent} onClose={() => { setSelectedEvent(null); setIsPreviewing(false); }} hideCloseButton />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FeatureEventModal isOpen={isFeaturing} onClose={() => setIsFeaturing(false)} cities={cities || []} events={events || []} onConfirm={async (data) => { await featureEventMutation.mutateAsync(data); }} initialEventId={selectedEvent?.id} initialCity={selectedEvent?.city || 'ALL'} />

      {/* Analytics Modal — Recharts fixed with explicit pixel heights */}
      <AnimatePresence>
        {showAnalytics && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight uppercase">{showAnalytics.title}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Event Performance Metrics</p>
                </div>
                <button onClick={() => setShowAnalytics(null)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {[{ label: 'Ticket Sales', value: showAnalytics.tickets_sold || 482, delta: '+12%' }, { label: 'Attendance', value: showAnalytics.attendance || 0, delta: '' }, { label: 'Capacity', value: showAnalytics.capacity ? `${Math.round((showAnalytics.attendance / showAnalytics.capacity) * 100)}%` : '—', delta: '' }].map((s) => (
                    <div key={s.label} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-xl font-bold text-white">{s.value} {s.delta && <span className="text-[10px] text-emerald-400 font-bold ml-1">{s.delta}</span>}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Ticket Sales Velocity</h4>
                    {/* FIX: explicit px height on wrapper, not % */}
                    <div style={{ width: '100%', height: 192 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[{ name: 'Mon', sales: 40 }, { name: 'Tue', sales: 65 }, { name: 'Wed', sales: 85 }, { name: 'Thu', sales: 120 }, { name: 'Fri', sales: 150 }, { name: 'Sat', sales: 180 }, { name: 'Sun', sales: 210 }]}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF2D9A" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#FF2D9A" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#FF2D9A', fontSize: '10px', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="sales" stroke="#FF2D9A" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Demographics</h4>
                      {/* FIX: explicit px height */}
                      <div style={{ width: '100%', height: 160 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[{ age: '18-24', count: 400 }, { age: '25-30', count: 320 }, { age: '31-35', count: 150 }, { age: '36+', count: 80 }]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {[0, 1, 2, 3].map((index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#FF2D9A' : 'rgba(255,255,255,0.1)'} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Traffic Sources</h4>
                      <div className="space-y-3">
                        {[{ label: 'Referral Sales', value: '35%', color: 'bg-emerald-500' }, { label: 'Direct Traffic', value: '45%', color: 'bg-blue-500' }, { label: 'Social Media', value: '20%', color: 'bg-purple-500' }].map((source) => (
                          <div key={source.label} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-white/60">{source.label}</span>
                              <span className="text-white">{source.value}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full', source.color)} style={{ width: source.value }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-end">
                <button onClick={() => setShowAnalytics(null)} className="px-8 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all text-white/90">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Modal */}
      {isCreatingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-3xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight leading-none uppercase">{isEditingEvent ? 'Edit Event' : 'Create New Event'}</h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Step {creationStep} of 3</p>
                </div>
              </div>
              <button onClick={() => { setIsCreatingEvent(false); setSubmitError(''); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pb-48">
              {/* Stepper */}
              <div className="flex items-center justify-between relative px-20">
                <div className="absolute left-20 right-20 top-6 h-1 bg-white/5 z-0 rounded-full" />
                <div className="absolute left-20 top-6 h-1 bg-gradient-to-r from-primary to-purple-600 z-0 transition-all duration-700 rounded-full shadow-[0_0_15px_rgba(255,45,154,0.3)]" style={{ width: `calc(${((creationStep - 1) / 2) * 100}%)` }} />
                {[1, 2, 3].map((step) => (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-[20px] flex items-center justify-center text-sm font-black border-2 transition-all duration-500', creationStep >= step ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(255,45,154,0.4)] scale-110' : 'bg-[#0A0A0F] border-white/10 text-white/20')}>
                      {creationStep > step ? <Check className="w-6 h-6" /> : step}
                    </div>
                    <span className={cn('text-[10px] uppercase font-black tracking-widest absolute -bottom-8 w-32 text-center transition-all duration-300', creationStep >= step ? 'text-primary neon-text' : 'text-white/20')}>
                      {step === 1 ? 'Details' : step === 2 ? 'Images' : 'Tickets'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-16">
                {/* Step 1 — Details */}
                {creationStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <FormSection title="Event Details" icon={<User className="w-4 h-4" />}>
                      <div className="space-y-8">
                        <RefinedField label="Event Title" name="title" value={eventFormData.title} onChange={(e: any) => setEventFormData({ ...eventFormData, title: e.target.value })} placeholder="Enter event title" icon={<Zap className="w-4 h-4" />} />
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Event Description</label>
                          <textarea rows={4} value={eventFormData.description} onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })} placeholder="Describe the aesthetic and soundscape…" className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none placeholder:text-white/10" />
                        </div>
                      </div>
                    </FormSection>
                    <FormSection title="Location & Genres" icon={<MapPin className="w-4 h-4" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">City</label>
                          <FilterDropdown value={eventFormData.city} onChange={(val) => setEventFormData({ ...eventFormData, city: val })} options={cities?.map((city: any) => ({ label: city.name, value: city.name })) || []} placeholder="Select city" buttonClassName="py-4 px-8 rounded-2xl text-sm bg-[#09090B] border-white/5 hover:border-white/10 text-white/60" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Venue</label>
                          <div className="relative">
                            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                            <FilterDropdown
                              value={eventFormData.vendor_id || eventFormData.venue_id}
                              onChange={(vendorId) => setEventFormData({ ...eventFormData, vendor_id: vendorId, venue_id: vendorId })}
                              options={vendorList.map((vendor: any) => ({ label: vendor.name, value: vendor._id || vendor.id }))}
                              placeholder="Select venue"
                              buttonClassName="py-4 pl-14 pr-8 rounded-2xl text-sm bg-[#09090B] border-white/5 hover:border-white/10 text-white/60"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Genres</label>
                          <MultiSelectDropdown options={genres?.map((g: any) => ({ label: g.name, value: g.name })) || []} value={eventFormData.genre} onChange={(val) => setEventFormData({ ...eventFormData, genre: val })} placeholder="Select genres" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Categories</label>
                          <MultiSelectDropdown options={eventTypes?.map((t: any) => ({ label: t.name, value: t.name })) || []} value={eventFormData.event_type} onChange={(val) => setEventFormData({ ...eventFormData, event_type: val })} placeholder="Select categories" />
                        </div>
                      </div>
                    </FormSection>
                    <FormSection title="Schedule" icon={<Clock className="w-4 h-4" />}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <RefinedField label="Event Date" name="date" type="date" value={eventFormData.date} onChange={(e: any) => setEventFormData({ ...eventFormData, date: e.target.value })} icon={<Calendar className="w-4 h-4" />} />
                        <RefinedField label="Start Time" name="start_time" type="time" value={eventFormData.start_time} onChange={(e: any) => setEventFormData({ ...eventFormData, start_time: e.target.value })} icon={<Clock className="w-4 h-4" />} />
                        <RefinedField label="End Time" name="end_time" type="time" value={eventFormData.end_time} onChange={(e: any) => setEventFormData({ ...eventFormData, end_time: e.target.value })} icon={<Clock className="w-4 h-4" />} />
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {/* Step 2 — Images (fully wired) */}
                {creationStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                    <FormSection title="Event Media" icon={<Image className="w-4 h-4" />}>
                      <div className="space-y-10">
                        <ImageUploadZone
                          label="Main Banner (Landscape)"
                          hint="Recommended: 1920×820 JPG/PNG"
                          value={eventFormData.landscape_url}
                          onChange={(url) => setEventFormData({ ...eventFormData, landscape_url: url })}
                          aspect="aspect-[21/9]"
                          token={token}
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <ImageUploadZone
                            label="Main Poster (Portrait)"
                            hint="Recommended: 1080×1350"
                            value={eventFormData.poster_url}
                            onChange={(url) => setEventFormData({ ...eventFormData, poster_url: url })}
                            aspect="aspect-[4/5]"
                            token={token}
                          />
                          <GalleryUploadZone
                            urls={eventFormData.gallery_urls}
                            onChange={(urls) => setEventFormData({ ...eventFormData, gallery_urls: urls })}
                            token={token}
                          />
                        </div>
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {/* Step 3 — Tickets */}
                {creationStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <FormSection title="Tickets & Access" icon={<Shield className="w-4 h-4" />}>
                      <div className="space-y-8">
                        <RefinedField label="Ticket Link" name="ticketing_link" value={eventFormData.ticketing_link} onChange={(e: any) => setEventFormData({ ...eventFormData, ticketing_link: e.target.value })} placeholder="https://insider.in/events/your-event" icon={<LinkIcon className="w-4 h-4" />} />
                        <div className="p-10 rounded-[40px] bg-primary/[0.03] border border-primary/20 space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-black text-white tracking-tight uppercase">Smart Ticketing</h4>
                              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Native Checkout</p>
                            </div>
                            <div className="px-5 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest">Coming Soon</div>
                          </div>
                          <p className="text-white/40 text-xs font-medium leading-relaxed max-w-lg">Enable native checkout to allow users to purchase tickets directly in-app.</p>
                        </div>
                      </div>
                    </FormSection>
                    <FormSection title="Final Verification" icon={<CheckCircle2 className="w-4 h-4" />}>
                      <div className="flex items-start gap-4 p-8 rounded-[32px] bg-white/[0.02] border border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          <Info className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Review your listing details carefully.</p>
                          <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mt-1">Once published, some details may require moderator approval to change.</p>
                          {/* Summary */}
                          <div className="mt-4 space-y-1 text-[11px] text-white/50">
                            <p><span className="text-white/30">Title:</span> {eventFormData.title || '—'}</p>
                            <p><span className="text-white/30">City:</span> {eventFormData.city || '—'}</p>
                            <p><span className="text-white/30">Date:</span> {eventFormData.date || '—'}</p>
                            <p><span className="text-white/30">Poster:</span> {eventFormData.poster_url ? '✓ Uploaded' : '✗ Missing'}</p>
                            <p><span className="text-white/30">Banner:</span> {eventFormData.landscape_url ? '✓ Uploaded' : '✗ Missing'}</p>
                          </div>
                        </div>
                      </div>
                    </FormSection>
                    {submitError && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">{submitError}</div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer nav */}
            <div className="p-10 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
              <button
                onClick={() => creationStep > 1 ? setCreationStep(creationStep - 1) : setIsCreatingEvent(false)}
                className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
              >
                <ChevronLeft className="w-4 h-4" />
                {creationStep === 1 ? 'Cancel' : 'Previous'}
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => {
                  if (creationStep < 3) {
                    setCreationStep(creationStep + 1);
                  } else {
                    handleSubmit();
                  }
                }}
                className="px-12 py-5 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,45,154,0.3)] hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : creationStep === 3 ? (
                  <>{isEditingEvent ? 'Save Changes' : 'Publish Event'}<ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>Next Step <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
