import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Mail,
  Bell,
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  BarChart2,
  Trophy,
  Zap,
  MessageCircle,
  FileText,
  User,
  ChevronRight,
  Shield,
  Activity,
  ArrowRight,
  Database,
  Lock,
  Eye,
  Settings,
  UserPlus,
  Layout as LayoutIcon,
  MousePointer2,
  Loader2,
  Check,
  Info,
  Image,
  Star,
  MapPin,
  Building2,
  Phone,
  Globe,
  Fingerprint,
  Instagram,
  Download,
  Heart,
  Share2,
  ChevronLeft,
  ArrowLeft,
  X,
  Share,
  Wallet,
  Edit2,
  Trash2,
  BarChart3,
  Ticket,
  UserCheck,
  Upload,
  Layers,
  Sparkles,
  Camera,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { motion, AnimatePresence } from 'motion/react';
import ClubProfilePreview from '../components/ClubProfilePreview';
import EventProfilePreview from '../components/EventProfilePreview';

import { API_BASE } from '../lib/apiConfig';
const statusColors: any = {
  'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'INACTIVE': 'bg-red-500/10 text-red-400 border-red-500/20',
  'SUSPENDED': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

// ─── Upload helper ────────────────────────────────────────────────────────────
// TODO: BROKEN - there is no `/upload` route on the real backend (that endpoint
// only existed in an old, unused Mongoose codebase). The real backend's
// vendorRoute.js / eventRoute.js expect multipart form-data directly on the
// create/update calls (e.g. `upload.single("business_image")`,
// `upload.fields([{ name: "venue_image" }, ...])`), not a separate upload step
// that returns a URL. This function will always fail until the submit handlers
// below are rewritten to build FormData with the exact field names the backend
// controllers expect (see vendorController.js / eventController.js).
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
  return data.url as string;
}

export default function Clubs() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { setIsClubProfileOpen } = useOutletContext<{ setIsClubProfileOpen: (open: boolean) => void }>();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCity, setFilterCity] = useState('ALL');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [isViewingVenue, setIsViewingVenue] = useState(false);

  const [venueStep, setVenueStep] = useState(1);
  const [venueFormData, setVenueFormData] = useState<any>({
    name: '', type: '', email: '', capacity: '', contactName: '',
    phone: '', description: '', city: '', address: '',
    landscape_urls: [''], portrait_url: '',
  });
  const [workingHours, setWorkingHours] = useState<any[]>([
    { day: 'Monday',    time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Tuesday',   time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Wednesday', time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Thursday',  time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Friday',    time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Saturday',  time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Sunday',    time: '10:00 PM - 04:00 AM', active: false },
  ]);
  const [lastUsedTime, setLastUsedTime] = useState('10:00 PM - 04:00 AM');

  const [venueLandscapePreviews, setVenueLandscapePreviews] = useState<string[]>(['']);
  const [venueLandscapeFiles, setVenueLandscapeFiles]       = useState<(File | null)[]>([null]);
  const [venuePortraitPreview, setVenuePortraitPreview]     = useState('');
  const [venuePortraitFile, setVenuePortraitFile]           = useState<File | null>(null);
  const venuePortraitRef = useRef<HTMLInputElement>(null);

  const [activeEventsTab, setActiveEventsTab] = useState<'Upcoming' | 'Past' | 'Active'>('Upcoming');
  const [selectedEvent, setSelectedEvent]     = useState<any>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent]   = useState(false);
  const [isPreviewing, setIsPreviewing]       = useState(false);
  const [creationStep, setCreationStep]       = useState(1);
  const [isSubmitting, setIsSubmitting]       = useState(false);

  const [eventFormData, setEventFormData] = useState<any>({
    title: '', city: '', venue_id: '', genre: [], event_type: [],
    date: '', start_time: '', end_time: '', description: '',
    poster_url: '', landscape_urls: [''], ticketing_link: '',
  });

  const [posterFile, setPosterFile]           = useState<File | null>(null);
  const [posterPreview, setPosterPreview]     = useState('');
  const [bannerFile, setBannerFile]           = useState<File | null>(null);
  const [bannerPreview, setBannerPreview]     = useState('');
  const posterInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleVenueLandscapeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFiles    = [...venueLandscapeFiles];
    const newPreviews = [...venueLandscapePreviews];
    newFiles[index]    = file;
    newPreviews[index] = URL.createObjectURL(file);
    setVenueLandscapeFiles(newFiles);
    setVenueLandscapePreviews(newPreviews);
  };

  const handleVenuePortraitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVenuePortraitFile(file);
    setVenuePortraitPreview(URL.createObjectURL(file));
  };

  const addVenueLandscapeSlot = () => {
    setVenueLandscapeFiles(f    => [...f, null]);
    setVenueLandscapePreviews(p => [...p, '']);
    setVenueFormData((d: any)  => ({ ...d, landscape_urls: [...d.landscape_urls, ''] }));
  };

  const removeVenueLandscapeSlot = (index: number) => {
    setVenueLandscapeFiles(f    => f.filter((_, i) => i !== index));
    setVenueLandscapePreviews(p => p.filter((_, i) => i !== index));
    setVenueFormData((d: any)  => ({
      ...d,
      landscape_urls: d.landscape_urls.filter((_: any, i: number) => i !== index),
    }));
  };

  const resetEventForm = () => {
    setEventFormData({
      title: '', city: '', venue_id: '', genre: [], event_type: [],
      date: '', start_time: '', end_time: '', description: '',
      poster_url: '', landscape_urls: [''], ticketing_link: '',
    });
    setPosterFile(null); setPosterPreview('');
    setBannerFile(null); setBannerPreview('');
    setCreationStep(1);
    setIsEditingEvent(false);
  };

  const resetVenueForm = () => {
    setVenueFormData({
      name: '', type: '', email: '', capacity: '', contactName: '',
      phone: '', description: '', city: '', address: '',
      landscape_urls: [''], portrait_url: '',
    });
    setVenueLandscapeFiles([null]); setVenueLandscapePreviews(['']);
    setVenuePortraitFile(null); setVenuePortraitPreview('');
    setVenueStep(1);
  };

  const handleEditEvent = (event: any) => {
    setEventFormData({
      title:          event.title || '',
      city:           event.city  || clubData?.city || '',
      venue_id:       event.venue_id || clubData?.id || '',
      genre:          Array.isArray(event.genre) ? event.genre : (event.category ? [event.category] : []),
      event_type:     Array.isArray(event.event_type) ? event.event_type : [],
      date:           event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      start_time:     event.start_time || '22:00',
      end_time:       event.end_time   || '04:00',
      description:    event.description || '',
      poster_url:     event.poster_url  || event.imageUrl || '',
      landscape_urls: event.landscape_urls || [event.imageUrl || ''],
      ticketing_link: event.ticketing_link || '',
    });
    setPosterPreview(event.poster_url || event.imageUrl || '');
    setBannerPreview((event.landscape_urls?.[0]) || event.imageUrl || '');
    setPosterFile(null); setBannerFile(null);
    setIsEditingEvent(true);
    setIsCreatingEvent(true);
    setCreationStep(1);
    setSelectedEvent(null);
  };

  // TODO: BROKEN - see uploadFile() note above and eventRoute.js. The real
  // backend expects POST /events/create_event (multipart, fields: venue_image,
  // artist_images, gallery_images, event_layout_images) and
  // PUT /events/update_event/:id, not POST/PUT /events or /events/:id with a
  // JSON body of pre-uploaded URLs. This handler needs a rewrite to build
  // FormData directly from posterFile/bannerFile before it will work.
  const handleSubmitEvent = async () => {
    try {
      setIsSubmitting(true);
      let poster_url     = eventFormData.poster_url;
      let landscape_urls = [...eventFormData.landscape_urls];

      if (posterFile) {
        poster_url = await uploadFile(posterFile, token!);
      }
      if (bannerFile) {
        landscape_urls[0] = await uploadFile(bannerFile, token!);
      }

      const payload = {
        ...eventFormData,
        poster_url,
        landscape_urls,
        venue_id: eventFormData.venue_id || clubData?.id,
        city:     eventFormData.city     || clubData?.city,
      };

      // TODO: real paths are `${API_BASE}/events/create_event` (POST) and
      // `${API_BASE}/events/update_event/${selectedEvent?.id}` (PUT), and they
      // expect multipart form-data, not JSON.
      const url    = isEditingEvent ? `${API_BASE}/events/${selectedEvent?.id}` : `${API_BASE}/events`;
      const method = isEditingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save event');

      queryClient.invalidateQueries({ queryKey: ['events-admin'] });
      setIsCreatingEvent(false);
      resetEventForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: BROKEN - see uploadFile() note above and vendorRoute.js. The real
  // backend expects POST /vendor/add_vendor (multipart, field: business_image)
  // and PUT /vendor/update_vendor/:id, not POST/PUT /mongo/vendors with a JSON
  // body of pre-uploaded URLs. This handler needs a rewrite to build FormData
  // directly from venuePortraitFile/venueLandscapeFiles before it will work.
  const handleSubmitVenue = async () => {
    try {
      setIsSubmitting(true);

      const landscape_urls = await Promise.all(
        venueLandscapeFiles.map(async (file, i) => {
          if (file) return uploadFile(file, token!);
          return venueFormData.landscape_urls[i] || '';
        })
      );

      let portrait_url = venueFormData.portrait_url;
      if (venuePortraitFile) {
        portrait_url = await uploadFile(venuePortraitFile, token!);
      }

      const payload = {
        ...venueFormData,
        landscape_urls,
        portrait_url,
        working_hours: workingHours.filter(h => h.active),
      };

      // TODO: real paths are `${API_BASE}/vendor/add_vendor` (POST) and
      // `${API_BASE}/vendor/update_vendor/${selectedClub._id}` (PUT), and they
      // expect multipart form-data, not JSON.
      const url    = selectedClub ? `${API_BASE}/mongo/vendors/${selectedClub._id}` : `${API_BASE}/mongo/vendors`;
      const method = selectedClub ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save venue');

      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setIsCreatingClub(false);
      resetVenueForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save venue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── queries (FIXED: correct paths + response unwrapping) ─────────────────────
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const clubData = Array.isArray(clubs) ? clubs.find((c: any) => c.name === user?.organisation) : null;

  const { data: events } = useQuery({
    queryKey: ['events-admin'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/city/get_all_cities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/genre/get_all_genres`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // TODO: no eventTypeRoute.js exists on the backend yet - disabled until a
  // real endpoint is added. Dropdown will show no options until then.
  const { data: eventTypes } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/eventTypes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: false,
  });

  // TODO: no venueTypeRoute.js exists on the backend yet - disabled until a
  // real endpoint is added. Dropdown will show no options until then.
  const { data: venueTypes } = useQuery({
    queryKey: ['venueTypes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/venueTypes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: false,
  });

  const clubEvents = Array.isArray(events)
    ? events.filter((e: any) => e.club_id === clubData?.id || e.club_id === clubData?._id || e.venue === clubData?.name)
    : [];

  const filteredClubEvents = clubEvents.filter((e: any) => {
    const now       = new Date();
    const eventDate = new Date(e.date);
    if (activeEventsTab === 'Upcoming') return eventDate >= now;
    if (activeEventsTab === 'Past')     return eventDate < now;
    if (activeEventsTab === 'Active')   return e.status === 'ACTIVE';
    return true;
  });

  const filteredClubs = (Array.isArray(clubs) ? clubs : []).filter((c: any) => {
    const matchesSearch  = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus  = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesCity    = filterCity   === 'ALL' || c.city === filterCity;
    return matchesSearch && matchesStatus && matchesCity;
  }).sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field
      ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)
      : <ArrowUpDown className="w-3 h-3 opacity-50" />;

  const toggleDay = (index: number) => {
    const newHours  = [...workingHours];
    const isActive  = !newHours[index].active;
    newHours[index].active = isActive;
    if (isActive) newHours[index].time = lastUsedTime;
    setWorkingHours(newHours);
  };

  const updateDayTime = (index: number, time: string) => {
    const newHours         = [...workingHours];
    newHours[index].time   = time;
    setLastUsedTime(time);
    setWorkingHours(newHours);
  };

  const exportData = () => console.log('Exporting data...', filteredClubs);

  if (user?.role === 'CLUB_ADMIN') {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
              Venue <span className="text-primary neon-text">Management</span>
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
              <Calendar className="w-3 h-3" />
              Manage and monitor your venues
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/club-profile')}
              className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" /> View Profile
            </button>
            <button
              onClick={() => {
                resetEventForm();
                setEventFormData((d: any) => ({ ...d, venue_id: clubData?.id || clubData?._id || '', city: clubData?.city || '' }));
                setIsCreatingEvent(true);
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Upcoming Events', value: clubEvents.filter((e: any) => new Date(e.date) >= new Date()).length, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Follower Growth', value: '+15.2%', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Profile Views',   value: '1.2k',  icon: Eye,   color: 'text-purple-400', bg: 'bg-purple-400/10' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-[32px] border border-white/5 overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-widest uppercase">Event Management</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Manage all your events</p>
            </div>
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
              {(['Upcoming', 'Active', 'Past'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveEventsTab(tab)}
                  className={cn(
                    'px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest',
                    activeEventsTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2">
            <div className="grid gap-2">
              {filteredClubEvents.length > 0 ? filteredClubEvents.map((event: any) => (
                <div
                  key={event._id || event.id}
                  onClick={() => { setSelectedEvent(event); setIsPreviewing(true); }}
                  className="p-4 rounded-2xl hover:bg-white/[0.03] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center">
                      {event.poster_url || event.imageUrl ? (
                        <img src={event.poster_url || event.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                          <Calendar className="w-3 h-3 text-primary" />
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                          <Users className="w-3 h-3 text-secondary" />
                          {event.attendees || 0} RSVPs
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase border border-primary/20">{event.category}</span>
                        <span className={cn('px-2 py-0.5 rounded text-[8px] font-black uppercase border', statusColors[event.status] || 'bg-white/5 border-white/10 text-white/50')}>{event.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeEventsTab === 'Past' ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent({ ...event, showAnalytics: true }); }}
                          className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                        >
                          <BarChart3 className="w-3 h-3" /> Analytics
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); setIsPreviewing(true); }}
                          className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all border border-white/5"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                          className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Delete this event?')) return;
                            await fetch(`${API_BASE}/events/delete_event/${event._id || event.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            queryClient.invalidateQueries({ queryKey: ['events-admin'] });
                          }}
                          className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest leading-none">
                    No {activeEventsTab.toLowerCase()} events found
                  </p>
                  <button
                    onClick={() => {
                      resetEventForm();
                      setEventFormData((d: any) => ({ ...d, venue_id: clubData?.id || clubData?._id || '', city: clubData?.city || '' }));
                      setIsCreatingEvent(true);
                    }}
                    className="text-primary font-black text-xs hover:underline uppercase tracking-widest leading-none"
                  >
                    Create an event now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isCreatingEvent && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card w-full max-w-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        {isEditingEvent ? 'Edit' : 'Create'} <span className="text-primary neon-text">Event</span>
                      </h3>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Step {creationStep} of 3</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsCreatingEvent(false); resetEventForm(); }}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 lg:p-12 scrollbar-hide">
                  <div className="flex items-center justify-between mb-16 relative px-4">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0" />
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700 shadow-[0_0_15px_rgba(255,45,154,0.5)]"
                      style={{ width: `${((creationStep - 1) / 2) * 100}%` }}
                    />
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                        <div className={cn(
                          'w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black border-2 transition-all duration-500',
                          creationStep >= step
                            ? 'bg-primary border-primary text-white shadow-[0_0_30px_rgba(255,45,154,0.3)] scale-110'
                            : 'bg-[#09090B] border-white/5 text-white/20',
                        )}>
                          {creationStep > step ? <Check className="w-6 h-6 stroke-[3px]" /> : step}
                        </div>
                        <span className={cn(
                          'text-[10px] uppercase font-black tracking-[0.2em] absolute -bottom-10 w-32 text-center transition-colors duration-500',
                          creationStep >= step ? 'text-primary' : 'text-white/20',
                        )}>
                          {step === 1 ? 'Details' : step === 2 ? 'Visuals' : 'Tickets'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <AnimatePresence mode="wait">
                      {creationStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                          <FormSection title="Event Details" icon={<Sparkles className="w-4 h-4" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="col-span-1 md:col-span-2">
                                <RefinedField
                                  label="Event Name" name="title" value={eventFormData.title}
                                  onChange={(e: any) => setEventFormData({ ...eventFormData, title: e.target.value })}
                                  placeholder="e.g. Midnight Eclipse" icon={<Zap className="w-4 h-4" />}
                                />
                              </div>
                              <div className="space-y-4 group/field">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Music Genre</label>
                                <MultiSelectDropdown
                                  options={genres?.map((g: any) => ({ label: g.name, value: g.name })) || []}
                                  value={eventFormData.genre}
                                  onChange={(v) => setEventFormData({ ...eventFormData, genre: v })}
                                  placeholder="Select genres"
                                />
                              </div>
                              <div className="space-y-4 group/field">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Event Type</label>
                                <MultiSelectDropdown
                                  options={eventTypes?.map((t: any) => ({ label: t.name, value: t.name })) || []}
                                  value={eventFormData.event_type}
                                  onChange={(v) => setEventFormData({ ...eventFormData, event_type: v })}
                                  placeholder="Select event types"
                                />
                              </div>
                              <RefinedField
                                label="Event Date" name="date" type="date" value={eventFormData.date}
                                onChange={(e: any) => setEventFormData({ ...eventFormData, date: e.target.value })}
                                icon={<Calendar className="w-4 h-4" />}
                              />
                              <RefinedField
                                label="Start Time" name="start_time" type="time" value={eventFormData.start_time}
                                onChange={(e: any) => setEventFormData({ ...eventFormData, start_time: e.target.value })}
                                icon={<Clock className="w-4 h-4" />}
                              />
                            </div>
                          </FormSection>
                          <FormSection title="Description" icon={<FileText className="w-4 h-4" />}>
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">About the Event</label>
                              <textarea
                                rows={5} value={eventFormData.description}
                                onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                                className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10"
                                placeholder="Describe the atmosphere..."
                              />
                            </div>
                          </FormSection>
                        </motion.div>
                      )}

                      {creationStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                          <FormSection title="Event Images" icon={<Camera className="w-4 h-4" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Event Poster (4:5)</label>
                                <label className="aspect-[4/5] rounded-[32px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.04] hover:border-primary/40 cursor-pointer group shadow-inner overflow-hidden relative block">
                                  <input
                                    ref={posterInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePosterChange}
                                  />
                                  {posterPreview ? (
                                    <>
                                      <img src={posterPreview} alt="Poster" className="absolute inset-0 w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change Photo</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:scale-110 group-hover:rotate-6 transition-all">
                                        <Upload className="w-7 h-7" />
                                      </div>
                                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-primary transition-colors">Upload Poster</span>
                                    </>
                                  )}
                                </label>
                              </div>

                              <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Header Image (16:9)</label>
                                <label className="aspect-video rounded-[32px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.04] hover:border-blue-400/40 cursor-pointer group shadow-inner overflow-hidden relative block">
                                  <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleBannerChange}
                                  />
                                  {bannerPreview ? (
                                    <>
                                      <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change Photo</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-blue-400 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                                        <Upload className="w-7 h-7" />
                                      </div>
                                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-blue-400 transition-colors">Upload Banner</span>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          </FormSection>
                        </motion.div>
                      )}

                      {creationStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                          <FormSection title="Tickets" icon={<Shield className="w-4 h-4" />}>
                            <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 space-y-8 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent pointer-events-none" />
                              <div className="flex items-center justify-between relative z-10">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Ticket Link</h4>
                                <button
                                  type="button"
                                  onClick={() => setEventFormData({ ...eventFormData, ticketing_link: '' })}
                                  className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors"
                                >
                                  Skip for now
                                </button>
                              </div>
                              <div className="space-y-6 relative z-10">
                                <RefinedField
                                  label="Ticket URL" name="ticketing_link" value={eventFormData.ticketing_link}
                                  onChange={(e: any) => setEventFormData({ ...eventFormData, ticketing_link: e.target.value })}
                                  placeholder="https://ticket-link.com/..."
                                  icon={<Globe className="w-4 h-4" />}
                                />
                              </div>
                            </div>
                          </FormSection>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="p-10 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <button
                    onClick={() => setCreationStep((p) => Math.max(1, p - 1))}
                    disabled={creationStep === 1}
                    className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 disabled:opacity-30 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={() => {
                      if (creationStep < 3) {
                        setCreationStep((p) => p + 1);
                      } else {
                        handleSubmitEvent();
                      }
                    }}
                    className="px-14 py-5 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : creationStep === 3 ? (
                      isEditingEvent ? 'Save Changes' : 'Create Event'
                    ) : (
                      <>Next <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedEvent && !isCreatingEvent && isPreviewing && !selectedEvent.showAnalytics && (
            <motion.button
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }}
              className="fixed top-8 left-8 z-[200] w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 hover:border-primary/50 transition-all group active:scale-95 shadow-2xl"
            >
              <ChevronLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedEvent && !isCreatingEvent && isPreviewing && !selectedEvent.showAnalytics && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }}
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110]"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:pr-[420px] pointer-events-none"
              >
                <motion.div className="w-full max-w-4xl bg-[#0F0F12] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col pointer-events-auto">
                  <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Event Details</h3>
                  </div>
                  <div className="p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-8 text-left">
                        <div className="aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                          <img src={selectedEvent.imageUrl || `https://picsum.photos/seed/${selectedEvent.id}/800/600`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-4">
                          <h2 className="text-4xl font-black text-white tracking-tight leading-none">{selectedEvent.title}</h2>
                          <div className="flex gap-3">
                            <span className="px-4 py-1.5 rounded-full bg-[#FF2D9A]/10 text-[#FF2D9A] text-[10px] font-black uppercase border border-[#FF2D9A]/20 tracking-widest whitespace-nowrap">{selectedEvent.category || 'Techno'}</span>
                            <span className="px-4 py-1.5 rounded-full bg-white/5 text-white/50 text-[10px] font-black uppercase border border-white/10 tracking-widest whitespace-nowrap">{selectedEvent.city || clubData?.city || 'Mumbai'}</span>
                          </div>
                          <p className="text-sm text-white/40 leading-relaxed font-medium">{selectedEvent.description || 'Get ready for a night of bass heavy beats and neon lights.'}</p>
                        </div>
                        <div className="flex gap-4 pt-4">
                          {activeEventsTab === 'Past' ? (
                            <button onClick={() => setSelectedEvent({ ...selectedEvent, showAnalytics: true })} className="flex-1 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-all text-xs flex items-center justify-center gap-2">
                              <BarChart3 className="w-4 h-4" /> View Analytics
                            </button>
                          ) : (
                            <button onClick={() => handleEditEvent(selectedEvent)} className="flex-1 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-all text-xs">
                              Edit Event
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'Date', icon: Calendar, color: '#FF2D9A', value: new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                          { label: 'Time', icon: Clock, color: '#2D9AFF', value: `${selectedEvent.start_time || 'TBA'}${selectedEvent.end_time ? ` – ${selectedEvent.end_time}` : ''}` },
                          { label: 'Venue', icon: MapPin, color: '#2DFF9A', value: selectedEvent.venue || clubData?.name || 'TBA' },
                        ].map(({ label, icon: Icon, color, value }) => (
                          <div key={label} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${color}1A` }}>
                              <Icon className="w-7 h-7" style={{ color }} />
                            </div>
                            <div>
                              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">{label}</p>
                              <p className="text-lg font-bold text-white leading-none truncate max-w-[200px]">{value}</p>
                            </div>
                          </div>
                        ))}
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#2D0A1A] to-[#1A0A2D] border border-white/5 mt-6 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF2D9A]/10 blur-[80px] -mr-16 -mt-16" />
                          <div className="flex items-center justify-between relative z-10">
                            <div className="space-y-4">
                              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Attendance</p>
                              <span className="text-4xl font-black text-white leading-none">{selectedEvent.attendees || 0}</span>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                              <Users className="w-8 h-8" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[130] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5 overflow-hidden"
              >
                <EventProfilePreview eventData={selectedEvent} onClose={() => { setSelectedEvent(null); setIsPreviewing(false); }} hideCloseButton />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
            Clubs & <span className="text-primary neon-text">Venues</span>
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <Building2 className="w-3 h-3" /> Manage all club partners across cities
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Export Data
          </button>
          <button
            onClick={() => { setSelectedClub(null); resetVenueForm(); setIsCreatingClub(true); }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Club
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {[
          { label: 'Total Clubs',    value: Array.isArray(clubs) ? clubs.length : 0, icon: Building2, color: 'text-blue-400',    bg: 'bg-blue-400/10' },
          { label: 'Active Clubs',   value: (Array.isArray(clubs) ? clubs : []).filter((c: any) => c.status === 'ACTIVE').length, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Avg Rating',     value: '4.8/5',  icon: Star,     color: 'text-amber-400',  bg: 'bg-amber-400/10' },
          { label: 'New Users',      value: '+1.2k',  icon: Users,    color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Total Followers',value: '24.5k',  icon: Database, color: 'text-cyan-400',   bg: 'bg-cyan-400/10' },
          { label: 'Club Staff',     value: '480',    icon: Shield,   color: 'text-zinc-400',   bg: 'bg-zinc-400/10' },
          { label: 'Total Revenue',  value: '$128k',  icon: Wallet,   color: 'text-pink-400',   bg: 'bg-pink-400/10' },
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

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Club List</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search clubs..."
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
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
            {viewMode === 'grid' && (
              <FilterDropdown
                value={sortField}
                onChange={handleSort}
                options={[
                  { label: 'Sort: Name', value: 'name' },
                  { label: 'Sort: City', value: 'city' },
                  { label: 'Sort: Status', value: 'status' },
                ]}
              />
            )}
            <FilterPanel>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                <FilterDropdown value={filterCity} onChange={setFilterCity} options={[
                  { label: 'All Cities', value: 'ALL' },
                  // Was a hardcoded 4-city list (Mumbai/Delhi/Bangalore/Goa)
                  // instead of the real cities already fetched above — venues
                  // in any other active city couldn't be filtered at all.
                  ...((Array.isArray(cities) ? cities : []).map((c: any) => ({ label: c.city_name, value: c.city_name }))),
                ]} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                <FilterDropdown value={filterStatus} onChange={setFilterStatus} options={[
                  { label: 'All Status', value: 'ALL' },
                  { label: 'Active',     value: 'ACTIVE' },
                  { label: 'Inactive',   value: 'INACTIVE' },
                  { label: 'Pending',    value: 'PENDING' },
                  { label: 'Banned',     value: 'BANNED' },
                ]} />
              </div>
            </FilterPanel>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">Loading clubs...</div>
            ) : filteredClubs.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">No clubs found.</div>
            ) : filteredClubs.map((club: any) => (
              <motion.div
                key={club._id || club.id} whileHover={{ y: -5 }}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden group cursor-pointer"
                onClick={() => { setSelectedClub(club); setIsViewingVenue(true); }}
              >
                <div className="aspect-video relative overflow-hidden">
                  {club.landscape_urls?.[0] ? (
                    <img src={club.landscape_urls[0]} alt={club.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-white/15" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border backdrop-blur-md', statusColors[club.status] || statusColors.ACTIVE)}>
                      {club.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">{club.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" /> {club.address || (typeof club.city === 'object' ? club.city?.city_name : club.city) || 'Location not set'}
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="text-xs font-bold">—</span>
                      <span className="text-[10px] text-muted-foreground font-medium">No ratings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs font-bold text-white">—</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase">{club.type || club.venue_type || 'Type not set'}</span>
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
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
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">Club / Category <SortIcon field="name" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('city')}>
                      <div className="flex items-center gap-1.5">Location <SortIcon field="city" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stats</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading clubs...</td></tr>
                  ) : filteredClubs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">No clubs found.</td></tr>
                  ) : filteredClubs.map((club: any) => (
                    <tr key={club._id || club.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setSelectedClub(club); setIsViewingVenue(true); }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                            {club.portrait_url
                              ? <img src={club.portrait_url} alt="" className="w-full h-full object-cover" />
                              : <Building2 className="w-4 h-4 text-white/20" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{club.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{club.type || club.venue_type || 'Type not set'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{(typeof club.city === 'object' ? club.city?.city_name : club.city) || '—'}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{club.address || 'Address not set'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Rating</p>
                            <p className="text-xs font-bold text-white">—</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Followers</p>
                            <p className="text-xs font-bold text-white">—</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border', statusColors[club.status] || statusColors.ACTIVE)}>
                          {club.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isViewingVenue && selectedClub && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsViewingVenue(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 h-full w-full max-w-[420px] bg-black z-[111] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5"
            >
              <ClubProfilePreview onClose={() => setIsViewingVenue(false)} club={selectedClub} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreatingClub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {selectedClub ? 'Edit' : 'Add New'} <span className="text-primary neon-text">Club</span>
                    </h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Step {venueStep}/3</p>
                  </div>
                </div>
                <button onClick={() => { setIsCreatingClub(false); resetVenueForm(); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 lg:p-12 scrollbar-hide">
                <div className="flex items-center justify-between mb-16 relative px-4">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700 shadow-[0_0_15px_rgba(255,45,154,0.5)]" style={{ width: `${((venueStep - 1) / 2) * 100}%` }} />
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black border-2 transition-all duration-500', venueStep >= step ? 'bg-primary border-primary text-white shadow-[0_0_30px_rgba(255,45,154,0.3)] scale-110' : 'bg-[#09090B] border-white/5 text-white/20')}>
                        {venueStep > step ? <Check className="w-6 h-6 stroke-[3px]" /> : step}
                      </div>
                      <span className={cn('text-[10px] uppercase font-black tracking-[0.2em] absolute -bottom-10 w-32 text-center transition-colors duration-500', venueStep >= step ? 'text-primary' : 'text-white/20')}>
                        {step === 1 ? 'Details' : step === 2 ? 'Visuals' : 'Logistics'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <AnimatePresence mode="wait">
                    {venueStep === 1 && (
                      <motion.div key="venueStep1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <FormSection title="Basic Information" icon={<Fingerprint className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="col-span-1 md:col-span-2">
                              <RefinedField label="Club Name" name="name" value={venueFormData.name} onChange={(e: any) => setVenueFormData({ ...venueFormData, name: e.target.value })} placeholder="e.g. The Quantum Vault" icon={<Building2 className="w-4 h-4" />} />
                            </div>
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Category</label>
                              <select value={venueFormData.type} onChange={(e) => setVenueFormData({ ...venueFormData, type: e.target.value })} className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium">
                                <option value="">Select Category...</option>
                                {venueTypes?.map((type: any) => <option key={type._id || type.id} value={type.name}>{type.name}</option>)}
                              </select>
                            </div>
                            <RefinedField label="Contact Email" name="email" type="email" value={venueFormData.email} onChange={(e: any) => setVenueFormData({ ...venueFormData, email: e.target.value })} placeholder="ops@venue.com" icon={<Mail className="w-4 h-4" />} />
                            <RefinedField label="Capacity" name="capacity" type="number" value={venueFormData.capacity} onChange={(e: any) => setVenueFormData({ ...venueFormData, capacity: e.target.value })} placeholder="3500" icon={<Users className="w-4 h-4" />} />
                            <RefinedField label="Contact Number" name="phone" value={venueFormData.phone} onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value })} placeholder="+91 00000 00000" icon={<Phone className="w-4 h-4" />} />
                          </div>
                        </FormSection>
                        <FormSection title="Club Description" icon={<FileText className="w-4 h-4" />}>
                          <div className="space-y-4 group/field">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">About Club</label>
                            <textarea rows={4} value={venueFormData.description} onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })} placeholder="Describe the aesthetic and soundscape..." className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10" />
                          </div>
                        </FormSection>
                      </motion.div>
                    )}

                    {venueStep === 2 && (
                      <motion.div key="venueStep2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                        <FormSection title="Location Details" icon={<MapPin className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">City</label>
                              <select value={venueFormData.city} onChange={(e) => setVenueFormData({ ...venueFormData, city: e.target.value })} className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium">
                                <option value="">Select City...</option>
                                {(Array.isArray(cities) ? cities : []).map((city: any) => <option key={city._id || city.id} value={city.city_name}>{city.city_name}</option>)}
                              </select>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                              <RefinedField label="Full Address" name="address" value={venueFormData.address} onChange={(e: any) => setVenueFormData({ ...venueFormData, address: e.target.value })} placeholder="The Underground, District 7..." icon={<MapPin className="w-4 h-4" />} />
                            </div>
                          </div>
                        </FormSection>

                        <FormSection title="Club Media" icon={<Layers className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 gap-12">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Cover Images</label>
                                <button type="button" onClick={addVenueLandscapeSlot} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white transition-all">
                                  <Plus className="w-4 h-4" /> Add Image
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {venueLandscapePreviews.map((preview, index) => (
                                  <label key={index} className="group relative aspect-video rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl transition-all hover:border-primary/40 cursor-pointer block">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVenueLandscapeChange(e, index)} />
                                    {preview ? (
                                      <>
                                        <img src={preview} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change</span>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 group-hover:text-primary transition-colors">
                                        <Upload className="w-10 h-10" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Slot {index + 1}</span>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeVenueLandscapeSlot(index); }}
                                      className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-6">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Profile Photo</label>
                              <label className="aspect-[9/16] max-w-[240px] mx-auto rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl group relative cursor-pointer hover:border-blue-400/40 transition-all block">
                                <input ref={venuePortraitRef} type="file" accept="image/*" className="hidden" onChange={handleVenuePortraitChange} />
                                {venuePortraitPreview ? (
                                  <>
                                    <img src={venuePortraitPreview} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 group-hover:text-blue-400 transition-colors">
                                    <Upload className="w-10 h-10 group-hover:scale-110 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Select Photo</span>
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}

                    {venueStep === 3 && (
                      <motion.div key="venueStep3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <FormSection title="Opening Hours" icon={<Clock className="w-4 h-4" />}>
                          <div className="space-y-6">
                            {workingHours.map((item, index) => (
                              <div key={item.day} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 group p-4 rounded-[28px] hover:bg-white/[0.02] transition-all">
                                <button type="button" onClick={() => toggleDay(index)} className={cn('min-w-[140px] px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all border', item.active ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(255,45,154,0.3)] scale-105 active:scale-95' : 'bg-[#09090B] border-white/5 text-white/20 hover:text-white/60')}>
                                  {item.day}
                                </button>
                                <AnimatePresence>
                                  {item.active && (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 w-full">
                                      <RefinedField label="Open Hours" name={`hours-${index}`} value={item.time} onChange={(e: any) => updateDayTime(index, e.target.value)} placeholder="22:00 - 04:00" icon={<Clock className="w-4 h-4" />} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                          <div className="mt-8 p-10 rounded-[40px] bg-blue-500/5 border border-blue-500/10 flex items-start gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                              <Info className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest">Note</h4>
                              <p className="text-[13px] text-white/40 leading-relaxed font-medium">Activating a day will automatically use the same hours as the previously selected day.</p>
                            </div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-10 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  {venueStep > 1 && (
                    <button onClick={() => setVenueStep((v) => v - 1)} className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 active:scale-95">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => { setIsCreatingClub(false); resetVenueForm(); }} className="px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all">
                    Cancel
                  </button>
                  {venueStep < 3 ? (
                    <button onClick={() => setVenueStep((v) => v + 1)} className="px-14 py-5 rounded-[24px] bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group">
                      Next Step <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      disabled={isSubmitting}
                      onClick={handleSubmitVenue}
                      className="px-16 py-5 rounded-[24px] bg-gradient-to-br from-primary to-purple-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : selectedClub ? 'Save Changes' : 'Add Club'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
