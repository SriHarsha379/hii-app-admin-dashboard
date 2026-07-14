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
  Link as LinkIcon,
  Trash2,
  Edit2,
  Eye,
  AlertTriangle,
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
  Cell,
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

import { API_BASE } from '../lib/apiConfig';
const statusColors: any = {
  ACTIVE:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PAST:      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  UPCOMING:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LIVE:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const eventId   = (e: any) => e?._id || e?.id || '';
const statusLabel = (e: any) => {
  if (e.status === 'LIVE' || e.status === 'UPCOMING') return 'ACTIVE';
  if (e.status === 'COMPLETED') return 'PAST';
  return e.status || 'ACTIVE';
};

// TODO: BROKEN - there is no `/upload` route on the real backend (that endpoint
// only existed in an old, unused Mongoose codebase). The real backend's
// eventRoute.js expects multipart form-data directly on create/update
// (`upload.fields([{ name: "venue_image" }, { name: "artist_images" }, ...])`),
// not a separate upload step that returns a URL. This function will always
// fail until image upload is rewired to attach files directly to the
// create/update FormData instead of pre-uploading.
async function uploadFile(file: File, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url ?? data.path ?? data.secure_url;
}

// ─── ImageUploadZone ──────────────────────────────────────────────────────────
function ImageUploadZone({
  label, hint, value, onChange, aspect, token,
}: { label: string; hint: string; value: string; onChange: (url: string) => void; aspect: string; token: string }) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const handleFile = async (file: File) => {
    setError(''); setUploading(true);
    try   { onChange(await uploadFile(file, token)); }
    catch { setError('Upload failed. Try again.'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block">{label}</label>
      <div
        className={cn(aspect, 'w-full rounded-[40px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all group relative overflow-hidden')}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => e.preventDefault()}
      >
        {value && !uploading && (
          <>
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[11px] font-black uppercase text-white tracking-[0.2em]">Change Image</span>
            </div>
          </>
        )}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-[11px] font-black uppercase text-white/60 tracking-[0.2em]">Uploading…</span>
          </div>
        )}
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
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {error && <p className="text-[10px] text-red-400 font-bold ml-2">{error}</p>}
    </div>
  );
}

// ─── GalleryUploadZone ────────────────────────────────────────────────────────
function GalleryUploadZone({ urls, onChange, token }: { urls: string[]; onChange: (u: string[]) => void; token: string }) {
  const handleFile = async (index: number, file: File) => {
    try {
      const url  = await uploadFile(file, token);
      const next = [...urls]; next[index] = url; onChange(next);
    } catch {}
  };
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block">Gallery Preview</label>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => {
          const ref = React.createRef<HTMLInputElement>();
          return (
            <div key={i} className="aspect-square rounded-3xl bg-[#09090B] border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden" onClick={() => ref.current?.click()}>
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
              <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(i, f); }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
function DeleteConfirmDialog({ event, onConfirm, onCancel, isDeleting }: { event: any; onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card w-full max-w-md rounded-3xl border border-red-500/20 overflow-hidden shadow-2xl p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Delete Event</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">
          Are you sure you want to delete <span className="text-white font-bold">"{event.title}"</span>? This will permanently remove it from the database.
        </p>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isDeleting ? 'Deleting…' : 'Delete Event'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RowActionsMenu({ event, onEdit, onDelete, onPreview, onAnalytics, showAnalyticsBtn }: {
  event: any; onEdit: () => void; onDelete: () => void;
  onPreview: () => void; onAnalytics: () => void; showAnalyticsBtn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-1 w-44 bg-[#09090B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1"
          >
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onPreview(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-left">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-left">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            {showAnalyticsBtn && (
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); onAnalytics(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-left">
                <BarChart2 className="w-3.5 h-3.5" /> Analytics
              </button>
            )}
            <div className="h-px bg-white/5 my-1" />
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-red-400 hover:bg-red-500/10 transition-all text-left">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Events() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const [viewMode,       setViewMode]       = useState<'grid' | 'table'>('table');
  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('ALL');
  const [filterCity,     setFilterCity]     = useState('ALL');
  const [selectedEvent,  setSelectedEvent]  = useState<any>(null);
  const [isCreatingEvent,setIsCreatingEvent]= useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [showAnalytics,  setShowAnalytics]  = useState<any>(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [submitError,    setSubmitError]    = useState('');
  const [isPreviewing,   setIsPreviewing]   = useState(false);
  const [isFeaturing,    setIsFeaturing]    = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState<any>(null);
  const [isDeleting,     setIsDeleting]     = useState(false);
  const [creationStep,   setCreationStep]   = useState(1);
  const [modalKey,       setModalKey]       = useState(0); // increment to force modal remount

  // Scroll modal body to top whenever step changes
  React.useEffect(() => {
    const el = document.getElementById('modal-scroll-body');
    if (el) el.scrollTop = 0;
  }, [creationStep, isCreatingEvent]);

  const blankForm = {
    title: '', city: '', venue_id: '', vendor_id: '',
    genre: [] as string[], event_type: [] as string[],
    date: '', start_time: '', end_time: '', description: '',
    poster_url: '', landscape_url: '',
    gallery_urls: ['', '', '', ''] as string[],
    ticketing_link: '',
  };
  const [eventFormData, setEventFormData] = useState<any>(blankForm);

  // ── Queries (FIXED: correct paths + response unwrapping) ─────────────────────
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/genre/get_all_genres`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // TODO: no eventTypeRoute.js exists on the backend yet - disabled until a
  // real endpoint is added. Dropdown will show no options until then.
  const { data: eventTypes } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/eventTypes`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: false,
  });

  const { data: vendors } = useQuery({
    queryKey: ['mongo-vendors'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const vendorList   = Array.isArray(vendors) ? vendors : [];
  const getVendorId  = (e: any) => { if (!e) return ''; if (typeof e.vendor_id === 'object') return e.vendor_id?._id || e.vendor_id?.id || ''; return e.vendor_id || e.venue_id || ''; };
  const getVendorName = (id: string) => vendorList.find((v: any) => (v._id || v.id) === id)?.name || '';

  // ── Mutations ──────────────────────────────────────────────────────────────
  // TODO: BROKEN - real backend path is POST /events/create_event and it
  // expects multipart form-data (fields: venue_image, artist_images,
  // gallery_images, event_layout_images), not JSON at POST /events. This
  // mutation needs a rewrite to build FormData before it will actually work.
  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to create event'); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setIsCreatingEvent(false); setEventFormData(blankForm); setCreationStep(1); },
  });

  // TODO: BROKEN - real backend path is PUT /events/update_event/:id and it
  // expects multipart form-data, not JSON at PUT /events/:id. Needs a rewrite
  // to build FormData before it will actually work.
  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const id = data._id || data.id;
      const { _id, id: _removed, ...body } = data;
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to update event'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsCreatingEvent(false); setIsEditingEvent(false);
      setSelectedEvent(null); setEventFormData(blankForm); setCreationStep(1);
    },
  });

  // FIXED: real backend path is DELETE /events/delete_event/:id (this one
  // doesn't require multipart, so it's a straightforward URL fix).
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/events/delete_event/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete event');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDeleteTarget(null);
    },
  });

  // TODO: BROKEN - there is no `/events/feature` route on the real backend.
  // Featuring events is not yet implemented server-side.
  const featureEventMutation = useMutation({
    mutationFn: async (data: { city: string; eventId: string; duration: number }) => {
      const res = await fetch(`${API_BASE}/events/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  // ── Derived stats ──────────────────────────────────────────────────────────
  const eventList        = Array.isArray(events) ? events : [];
  const liveCount        = eventList.filter((e: any) => e.status === 'LIVE' || e.status === 'UPCOMING').length;
  const cancelledCount   = eventList.filter((e: any) => e.status === 'CANCELLED').length;
  const totalAttendance  = eventList.reduce((s: number, e: any) => s + (Number(e.attendance)   || 0), 0);
  const totalTicketsSold = eventList.reduce((s: number, e: any) => s + (Number(e.tickets_sold) || 0), 0);

  const filteredEvents = eventList.filter((e: any) => {
    const matchesSearch  = e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || e.city?.toLowerCase().includes(searchTerm.toLowerCase());
    let   matchesStatus  = true;
    if      (filterStatus === 'ACTIVE')    matchesStatus = e.status === 'LIVE' || e.status === 'UPCOMING';
    else if (filterStatus === 'PAST')      matchesStatus = e.status === 'COMPLETED';
    else if (filterStatus !== 'ALL')       matchesStatus = e.status === filterStatus;
    const matchesCity = filterCity === 'ALL' || e.city === filterCity;
    return matchesSearch && matchesStatus && matchesCity;
  });

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportData = () => {
    const headers = ['Title', 'City', 'Date', 'Status', 'Attendance', 'Genre'];
    const rows = filteredEvents.map((e: any) => [
      `"${e.title || ''}"`, `"${e.city || ''}"`, `"${e.date || ''}"`,
      `"${e.status || ''}"`, `"${e.attendance || 0}"`,
      `"${Array.isArray(e.genre) ? e.genre.join(', ') : (e.genre || '')}"`,
    ]);
    const csv  = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `events-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(''); setIsSubmitting(true);
    try {
      const vendor_id = eventFormData.vendor_id || eventFormData.venue_id;
      const missing: string[] = [];
      if (!eventFormData.title)       missing.push('Event Title');
      if (!vendor_id)                 missing.push('Venue');
      if (!eventFormData.date)        missing.push('Event Date');
      if (!eventFormData.start_time)  missing.push('Start Time');
      if (!eventFormData.end_time)    missing.push('End Time');
      if (!eventFormData.description) missing.push('Description');
      if (!eventFormData.city)        missing.push('City');
      if (missing.length) { setSubmitError(`Please fill in: ${missing.join(', ')}`); return; }

      const payload = {
        title:          eventFormData.title,
        description:    eventFormData.description,
        date:           eventFormData.date,
        start_time:     eventFormData.start_time,
        end_time:       eventFormData.end_time,
        city:           eventFormData.city,
        venue_id:       vendor_id,
        genre:          eventFormData.genre,
        event_type:     eventFormData.event_type,
        poster_url:     eventFormData.poster_url,
        landscape_urls: [eventFormData.landscape_url, ...eventFormData.gallery_urls].filter(Boolean),
        ticketing_link: eventFormData.ticketing_link,
        // pass the stored id so updateEventMutation can build the correct URL
        ...(isEditingEvent && eventFormData.id ? { id: eventFormData.id, _id: eventFormData.id } : {}),
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

  // ── Open Edit ──────────────────────────────────────────────────────────────
  const openEdit = (event: any) => {
    // Build the pre-filled form FIRST before opening the modal
    const filled = {
      id:            eventId(event),
      title:         event.title        || '',
      city:          event.city         || '',
      venue_id:      getVendorId(event),
      vendor_id:     getVendorId(event),
      genre:         Array.isArray(event.genre)      ? event.genre      : (event.genre      ? [event.genre]      : []),
      event_type:    Array.isArray(event.event_type) ? event.event_type : (event.event_type ? [event.event_type] : []),
      date:          event.date         ? event.date.slice(0, 10) : '',
      start_time:    event.start_time   || '',
      end_time:      event.end_time     || '',
      description:   event.description  || '',
      poster_url:    event.poster_url   || '',
      landscape_url: event.landscape_url
        || (Array.isArray(event.landscape_urls) ? event.landscape_urls[0] : '')
        || '',
      gallery_urls:  Array.isArray(event.landscape_urls)
        ? [...event.landscape_urls.slice(1), '', '', '', ''].slice(0, 4)
        : ['', '', '', ''],
      ticketing_link: event.ticketing_link || '',
    };

    // Set form data BEFORE opening modal so it renders with data already in place
    setEventFormData(filled);
    setIsEditingEvent(true);
    setCreationStep(1);
    setSubmitError('');
    setIsPreviewing(false);
    setSelectedEvent(null);
    // Increment key to force the modal div to remount fresh (clears scroll position)
    setModalKey(k => k + 1);
    // Open modal last
    setIsCreatingEvent(true);
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try { await deleteEventMutation.mutateAsync(eventId(deleteTarget)); }
    catch { /* error handled by mutation */ }
    finally { setIsDeleting(false); }
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
          {/* ✅ Export CSV — works with real _id */}
          <button onClick={exportData} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {/* ✅ Featured — only for non-EVENT_ADMIN */}
          {user?.role !== 'EVENT_ADMIN' && (
            <button onClick={() => setIsFeaturing(true)} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <Star className="w-3.5 h-3.5" /> Featured
            </button>
          )}
          {/* ✅ Create Event */}
          <button
            onClick={() => { setEventFormData(blankForm); setIsEditingEvent(false); setIsCreatingEvent(true); setCreationStep(1); setSubmitError(''); setModalKey(k => k + 1); }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        </div>
      </div>

      {/* Stats — all from real data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {[
          { label: 'Total Events',    value: eventList.length,                                                                                                           icon: Calendar,  color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
          { label: 'Live & Upcoming', value: liveCount,                                                                                                                  icon: Zap,       color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Total Attendance',value: totalAttendance.toLocaleString(),                                                                                           icon: Users,     color: 'text-purple-400',  bg: 'bg-purple-400/10'  },
          { label: 'Tickets Sold',    value: totalTicketsSold.toLocaleString(),                                                                                          icon: Ticket,    color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
          { label: 'Cities',          value: [...new Set(eventList.map((e: any) => e.city).filter(Boolean))].length,                                                     icon: MapPin,    color: 'text-pink-400',    bg: 'bg-pink-400/10'    },
          { label: 'Genres',          value: [...new Set(eventList.flatMap((e: any) => Array.isArray(e.genre) ? e.genre : [e.genre]).filter(Boolean))].length,           icon: Activity,  color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
          { label: 'Venues',          value: [...new Set(eventList.map((e: any) => getVendorId(e)).filter(Boolean))].length,                                             icon: Building2, color: 'text-cyan-400',    bg: 'bg-cyan-400/10'    },
          { label: 'Cancelled',       value: cancelledCount,                                                                                                             icon: XCircle,   color: 'text-red-400',     bg: 'bg-red-400/10'     },
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
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search events…" className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20" />
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={() => setViewMode('grid')}  className={cn('p-2 rounded-lg transition-all', viewMode === 'grid'  ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white')}><LayoutIcon className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('table')} className={cn('p-2 rounded-lg transition-all', viewMode === 'table' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white')}><Database className="w-4 h-4" /></button>
            </div>
            <FilterPanel>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                <FilterDropdown value={filterCity} onChange={setFilterCity} options={[{ label: 'All Cities', value: 'ALL' }, ...(cities?.map((c: any) => ({ label: c.name, value: c.name })) || [])]} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                <FilterDropdown value={filterStatus} onChange={setFilterStatus} options={[{ label: 'All Status', value: 'ALL' }, { label: 'Active', value: 'ACTIVE' }, { label: 'Past', value: 'PAST' }, { label: 'Cancelled', value: 'CANCELLED' }]} />
              </div>
            </FilterPanel>
          </div>
        </div>

        {/* Grid view */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">Loading events…</div>
            ) : filteredEvents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">No events found.</div>
            ) : filteredEvents.map((event: any) => (
              <motion.div
                key={eventId(event)} whileHover={{ y: -5 }}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden group cursor-pointer"
                onClick={() => { setSelectedEvent(event); setIsPreviewing(true); }}
              >
                <div className="aspect-video relative overflow-hidden">
                  {event.landscape_urls?.[0] || event.poster_url ? (
                    <img src={event.landscape_urls?.[0] || event.poster_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
                      <span className="text-xs font-bold text-white">{new Date(event.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold text-white">{event.attendance || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[100px]">
                        {Array.isArray(event.genre) ? event.genre[0] : (event.genre || '—')}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase">{event.city || '—'}</span>
                    </div>
                    {/* ✅ Grid action buttons — edit + delete, both wired */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(event)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(event)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Table view */
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
                    <tr
                      key={eventId(event)}
                      className="group hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => { setSelectedEvent(event); setIsPreviewing(true); }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                            {event.poster_url
                              ? <img src={event.poster_url} alt="" className="w-full h-full object-cover" />
                              : <Calendar className="w-4 h-4 text-white/20" />}
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
                        <p className="text-xs font-bold text-white">{new Date(event.date || Date.now()).toLocaleDateString()}</p>
                        <p className="text-[10px] text-muted-foreground">{event.start_time || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border', statusColors[statusLabel(event)] || statusColors.ACTIVE)}>
                          {statusLabel(event)}
                        </span>
                      </td>
                      {/* ✅ Table actions — dropdown with preview / edit / analytics / delete */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActionsMenu
                          event={event}
                          onPreview={() => { setSelectedEvent(event); setIsPreviewing(true); }}
                          onEdit={() => openEdit(event)}
                          onDelete={() => setDeleteTarget(event)}
                          onAnalytics={() => setShowAnalytics(event)}
                          showAnalyticsBtn={user?.role === 'EVENT_ADMIN' || user?.role === 'SUPER_ADMIN'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* back button removed — close X is built into the preview card */}

      {/* ── Event Preview ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEvent && isPreviewing && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110]"
            />

            {/* Main preview card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:pr-[440px] pointer-events-none"
            >
              <div className="w-full max-w-2xl pointer-events-auto flex flex-col gap-0 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.8)]">

                {/* ── Hero image ── */}
                <div className="relative" style={{ aspectRatio: '16/8' }}>
                  {selectedEvent.landscape_urls?.[0] || selectedEvent.poster_url ? (
                    <img
                      src={selectedEvent.landscape_urls?.[0] || selectedEvent.poster_url}
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0d1a 50%, #1a0a10 100%)' }}
                    >
                      <div className="text-center space-y-3 opacity-30">
                        <Calendar className="w-16 h-16 mx-auto text-primary" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">No Image</p>
                      </div>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(9,9,11,0.98) 100%)' }} />

                  {/* Top bar: status + close */}
                  <div className="absolute top-5 left-6 right-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md', statusColors[statusLabel(selectedEvent)] || statusColors.ACTIVE)}>
                        {statusLabel(selectedEvent)}
                      </span>
                      {selectedEvent.city && (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md bg-black/30 text-white/70 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />{selectedEvent.city}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }}
                      className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom overlay: title + description */}
                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    {/* Genre pills */}
                    {Array.isArray(selectedEvent.genre) && selectedEvent.genre.length > 0 && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {selectedEvent.genre.slice(0, 3).map((g: string) => (
                          <span key={g} className="px-2.5 py-1 rounded-lg bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                      {selectedEvent.title}
                    </h2>
                    {selectedEvent.description && (
                      <p className="text-sm text-white/50 mt-2 leading-relaxed line-clamp-2">
                        {selectedEvent.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Info bar ── */}
                <div className="bg-[#0d0d12] border-t border-white/5 px-7 py-5 grid grid-cols-3 gap-4">
                  {[
                    {
                      icon: Calendar,
                      color: '#FF2D9A',
                      label: 'Date',
                      value: selectedEvent.date
                        ? new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        : 'Date not set',
                    },
                    {
                      icon: Clock,
                      color: '#2D9AFF',
                      label: 'Time',
                      value: selectedEvent.start_time
                        ? `${selectedEvent.start_time}${selectedEvent.end_time ? ` – ${selectedEvent.end_time}` : ''}`
                        : 'Time not set',
                    },
                    {
                      icon: Building2,
                      color: '#2DFF9A',
                      label: 'Venue',
                      value: selectedEvent.venue_name || getVendorName(getVendorId(selectedEvent)) || selectedEvent.city || '—',
                    },
                  ].map(({ icon: Icon, color, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</p>
                        <p className="text-xs font-bold text-white truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Attendance + actions ── */}
                <div className="bg-[#0a0a0f] px-7 py-5 flex items-center justify-between gap-4 border-t border-white/5">
                  {/* Attendance chip */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
                      <Users className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">RSVPs</p>
                        <p className="text-base font-black text-white leading-none">{selectedEvent.attendance ?? 0}</p>
                      </div>
                    </div>
                    {selectedEvent.ticketing_link && (
                      <a
                        href={selectedEvent.ticketing_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Ticket className="w-4 h-4" /> Tickets
                      </a>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setShowAnalytics(selectedEvent); }}
                      className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <BarChart2 className="w-3.5 h-3.5" /> Stats
                    </button>
                    <button
                      onClick={() => { setIsPreviewing(false); openEdit(selectedEvent); }}
                      className="px-6 py-2.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Event
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right sidebar preview */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-[#08080c] z-[130] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5 overflow-hidden"
            >
              <EventProfilePreview
                eventData={selectedEvent}
                onClose={() => { setSelectedEvent(null); setIsPreviewing(false); }}
                hideCloseButton
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ✅ Feature Modal */}
      <FeatureEventModal
        isOpen={isFeaturing}
        onClose={() => setIsFeaturing(false)}
        cities={cities || []}
        events={events || []}
        onConfirm={async (data) => { await featureEventMutation.mutateAsync(data); setIsFeaturing(false); }}
        initialEventId={selectedEvent ? eventId(selectedEvent) : undefined}
        initialCity={selectedEvent?.city || 'ALL'}
      />

      {/* ✅ Analytics Modal — real data from event, no hardcoded values */}
      <AnimatePresence>
        {showAnalytics && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight uppercase">{showAnalytics.title}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Event Performance</p>
                </div>
                {/* ✅ Close analytics */}
                <button onClick={() => setShowAnalytics(null)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide space-y-8">
                {/* Real stats from event document */}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Tickets Sold', value: showAnalytics.tickets_sold ?? '—' },
                    { label: 'Attendance',   value: showAnalytics.attendance   ?? 0   },
                    { label: 'Capacity %',   value: showAnalytics.capacity
                        ? `${Math.round((showAnalytics.attendance / showAnalytics.capacity) * 100)}%`
                        : '—' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-xl font-bold text-white">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Genre breakdown from real event.genre[] */}
                {Array.isArray(showAnalytics.genre) && showAnalytics.genre.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {showAnalytics.genre.map((g: string) => (
                        <span key={g} className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">{g}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event type breakdown */}
                {Array.isArray(showAnalytics.event_type) && showAnalytics.event_type.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Event Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {showAnalytics.event_type.map((t: string) => (
                        <span key={t} className="px-3 py-1.5 rounded-xl bg-white/5 text-white/60 border border-white/10 text-[10px] font-black uppercase tracking-widest">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Artists if present */}
                {Array.isArray(showAnalytics.artists) && showAnalytics.artists.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Artists / Lineup</h4>
                    <div className="space-y-3">
                      {showAnalytics.artists.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                            {a.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{a.title} {a.subtitle ? `• ${a.subtitle}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event details summary */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Event Details</h4>
                  {[
                    { label: 'Date',     value: showAnalytics.date        ? new Date(showAnalytics.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                    { label: 'Time',     value: showAnalytics.start_time  ? `${showAnalytics.start_time}${showAnalytics.end_time ? ` – ${showAnalytics.end_time}` : ''}` : '—' },
                    { label: 'City',     value: showAnalytics.city        || '—' },
                    { label: 'Venue',    value: showAnalytics.venue_name  || getVendorName(getVendorId(showAnalytics)) || '—' },
                    { label: 'Ticketing',value: showAnalytics.ticketing_link || 'No link provided' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-[11px]">
                      <span className="text-white/30 uppercase font-black tracking-widest">{label}</span>
                      <span className="text-white/70 font-medium truncate max-w-[200px]">{value}</span>
                    </div>
                  ))}
                </div>

                {showAnalytics.attendance == null && showAnalytics.tickets_sold == null && (
                  <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-400/80 font-medium">Attendance and ticket data will appear here once the event has been updated with tracking information.</p>
                  </div>
                )}
              </div>
              <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
                {/* ✅ Edit from analytics */}
                <button onClick={() => { setShowAnalytics(null); openEdit(showAnalytics); }} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Event
                </button>
                <button onClick={() => setShowAnalytics(null)} className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all text-white/90">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✅ Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmDialog
            event={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {isCreatingEvent && (
        <div key={modalKey} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
              {/* ✅ Close modal */}
              <button onClick={() => { setIsCreatingEvent(false); setIsEditingEvent(false); setSubmitError(''); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8" id="modal-scroll-body">
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
                {/* Step 1 */}
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
                          <FilterDropdown value={eventFormData.city} onChange={(val) => setEventFormData({ ...eventFormData, city: val })} options={cities?.map((c: any) => ({ label: c.name, value: c.name })) || []} placeholder="Select city" buttonClassName="py-4 px-8 rounded-2xl text-sm bg-[#09090B] border-white/5 hover:border-white/10 text-white/60" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Venue</label>
                          <div className="relative">
                            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 z-10" />
                            <FilterDropdown value={eventFormData.vendor_id || eventFormData.venue_id} onChange={(vendorId) => setEventFormData({ ...eventFormData, vendor_id: vendorId, venue_id: vendorId })} options={vendorList.map((v: any) => ({ label: v.name, value: v._id || v.id }))} placeholder="Select venue" buttonClassName="py-4 pl-14 pr-8 rounded-2xl text-sm bg-[#09090B] border-white/5 hover:border-white/10 text-white/60" />
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
                        <RefinedField label="Event Date"  name="date"       type="date" value={eventFormData.date}       onChange={(e: any) => setEventFormData({ ...eventFormData, date:       e.target.value })} icon={<Calendar className="w-4 h-4" />} />
                        <RefinedField label="Start Time"  name="start_time" type="time" value={eventFormData.start_time} onChange={(e: any) => setEventFormData({ ...eventFormData, start_time: e.target.value })} icon={<Clock className="w-4 h-4" />} />
                        <RefinedField label="End Time"    name="end_time"   type="time" value={eventFormData.end_time}   onChange={(e: any) => setEventFormData({ ...eventFormData, end_time:   e.target.value })} icon={<Clock className="w-4 h-4" />} />
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {/* Step 2 */}
                {creationStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                    <FormSection title="Event Media" icon={<Image className="w-4 h-4" />}>
                      <div className="space-y-10">
                        <ImageUploadZone label="Main Banner (Landscape)" hint="Recommended: 1920×820 JPG/PNG" value={eventFormData.landscape_url} onChange={(url) => setEventFormData({ ...eventFormData, landscape_url: url })} aspect="aspect-[21/9]" token={token} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <ImageUploadZone label="Main Poster (Portrait)" hint="Recommended: 1080×1350" value={eventFormData.poster_url} onChange={(url) => setEventFormData({ ...eventFormData, poster_url: url })} aspect="aspect-[4/5]" token={token} />
                          <GalleryUploadZone urls={eventFormData.gallery_urls} onChange={(urls) => setEventFormData({ ...eventFormData, gallery_urls: urls })} token={token} />
                        </div>
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {/* Step 3 */}
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
                          <div className="mt-4 space-y-1 text-[11px] text-white/50">
                            <p><span className="text-white/30">Title:</span> {eventFormData.title || '—'}</p>
                            <p><span className="text-white/30">Venue:</span> {getVendorName(eventFormData.vendor_id) || '—'}</p>
                            <p><span className="text-white/30">City:</span>  {eventFormData.city  || '—'}</p>
                            <p><span className="text-white/30">Date:</span>  {eventFormData.date  || '—'}</p>
                            <p><span className="text-white/30">Genres:</span> {eventFormData.genre?.join(', ') || '—'}</p>
                            <p><span className="text-white/30">Poster:</span>  {eventFormData.poster_url   ? '✓ Uploaded' : '✗ Missing'}</p>
                            <p><span className="text-white/30">Banner:</span>  {eventFormData.landscape_url ? '✓ Uploaded' : '✗ Missing'}</p>
                          </div>
                        </div>
                      </div>
                    </FormSection>
                    {submitError && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 shrink-0" /> {submitError}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-10 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
              <button
                onClick={() => creationStep > 1 ? setCreationStep(creationStep - 1) : (setIsCreatingEvent(false), setIsEditingEvent(false))}
                className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
              >
                <ChevronLeft className="w-4 h-4" />
                {creationStep === 1 ? 'Cancel' : 'Previous'}
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => creationStep < 3 ? setCreationStep(creationStep + 1) : handleSubmit()}
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