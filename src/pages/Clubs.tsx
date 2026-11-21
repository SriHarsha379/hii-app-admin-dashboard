
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, Users, CheckCircle2, Clock, XCircle, Calendar,
  Zap, FileText, ChevronRight, Shield, Activity, ShieldCheck, Eye,
  Loader2, Check, Info, Image, Star, MapPin, Building2, Phone, Globe,
  Fingerprint, Download, ChevronLeft, X, Wallet, Edit2, Trash2,
  BarChart3, Ticket, Upload, Layers, Sparkles, Camera, ArrowUp,
  ArrowDown, ArrowUpDown, Ban, AlertTriangle, TrendingDown, Mail,
  Database, Power, PowerOff, CheckCheck, MoreHorizontal,
} from 'lucide-react';
import { Layout as LayoutIcon } from 'lucide-react';
import { cn, apiErrorMessage } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { SingleSelectDropdown } from '../components/SingleSelectDropdown';
import { LocationPicker } from '../components/LocationPicker';
import { motion, AnimatePresence } from 'motion/react';
import ClubProfilePreview from '../components/ClubProfilePreview';
import EventProfilePreview from '../components/EventProfilePreview';
import { FeatureClubModal } from '../components/FeatureClubModal';
import { API_BASE } from '../lib/apiConfig';

const UPLOADS_BASE = API_BASE.replace(/\/api\/v1\/admin\/?$/, '/uploads');
const assetUrl = (filename?: string | null) => {
  if (!filename) return '';
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${UPLOADS_BASE}/${filename}`;
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  INACTIVE:  'bg-red-500/10 text-red-400 border-red-500/20',
  SUSPENDED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

// ── Reject-reason modal ───────────────────────────────────────────────────────

// ── Reject modal ─────────────────────────────────────────────────────────────
function RejectModal({ open, clubName, onConfirm, onCancel, isPending }: {
  open: boolean; clubName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = React.useState('');
  const presets = ['Incomplete information', 'Duplicate listing', 'Policy violation', 'Invalid documents'];
  React.useEffect(() => { if (!open) setReason(''); }, [open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="w-full max-w-md bg-[#0d0d12] rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-7 pt-7 pb-5 border-b border-white/[0.05]">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Reject Vendor</h3>
              <p className="text-[11px] text-white/40 font-medium mt-1 leading-snug">
                This will mark <span className="text-white/70 font-bold">{clubName}</span> as rejected and notify them by email.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5">
          {/* Quick presets */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Quick Reason</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setReason(p)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    reason === p
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : 'bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Custom Reason <span className="normal-case font-medium text-white/20">(optional)</span></label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe why this vendor is being rejected..."
              className="w-full bg-[#0c0c10] border border-white/[0.07] rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-red-500/30 resize-none font-medium placeholder:text-white/15 transition-all hover:border-white/15"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] text-xs font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            Cancel
          </button>
          <button
            disabled={isPending}
            onClick={() => onConfirm(reason)}
            className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Ban className="w-4 h-4" />}
            Reject Vendor
          </button>
        </div>
      </motion.div>
    </div>
  );
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
  const [isFeaturingClub, setIsFeaturingClub] = useState(false);
  const [isViewingFeaturedClubs, setIsViewingFeaturedClubs] = useState(false);
  const [isEditingVenue, setIsEditingVenue] = useState(false);
  const [isViewingVenue, setIsViewingVenue] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; clubId: string; clubName: string }>({ open: false, clubId: '', clubName: '' });
  const [venueStep, setVenueStep] = useState(1);
  const [venueFormData, setVenueFormData] = useState<any>({
    name: '', type: [], email: '', capacity: '', contactName: '',
    phone: '', description: '', city: '', address: '', vendor_id: '',
    landscape_urls: [''], portrait_url: '',
    table_reservation_fee: '', bill_discount_percentage: '', tax_percentage: '',
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
    address: '', latitude: '', longitude: '',
    poster_url: '', landscape_urls: [''], ticketing_link: '',
  });
  const [posterFile, setPosterFile]       = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [bannerFile, setBannerFile]       = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const posterInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // ── File handlers ──────────────────────────────────────────────────────
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setPosterFile(file); setPosterPreview(URL.createObjectURL(file));
  };
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBannerFile(file); setBannerPreview(URL.createObjectURL(file));
  };
  const handleVenueLandscapeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]; if (!file) return;
    const nf = [...venueLandscapeFiles]; const np = [...venueLandscapePreviews];
    nf[index] = file; np[index] = URL.createObjectURL(file);
    setVenueLandscapeFiles(nf); setVenueLandscapePreviews(np);
  };
  const handleVenuePortraitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setVenuePortraitFile(file); setVenuePortraitPreview(URL.createObjectURL(file));
  };
  const addVenueLandscapeSlot = () => {
    setVenueLandscapeFiles(f => [...f, null]);
    setVenueLandscapePreviews(p => [...p, '']);
    setVenueFormData((d: any) => ({ ...d, landscape_urls: [...d.landscape_urls, ''] }));
  };
  const removeVenueLandscapeSlot = (index: number) => {
    setVenueLandscapeFiles(f => f.filter((_, i) => i !== index));
    setVenueLandscapePreviews(p => p.filter((_, i) => i !== index));
    setVenueFormData((d: any) => ({ ...d, landscape_urls: d.landscape_urls.filter((_: any, i: number) => i !== index) }));
  };

  // ── Form resets ────────────────────────────────────────────────────────
  const resetEventForm = () => {
    setEventFormData({ title: '', city: '', venue_id: '', genre: [], event_type: [], date: '', start_time: '', end_time: '', description: '', poster_url: '', landscape_urls: [''], ticketing_link: '' });
    setPosterFile(null); setPosterPreview(''); setBannerFile(null); setBannerPreview('');
    setCreationStep(1); setIsEditingEvent(false);
  };
  const resetVenueForm = () => {
    setVenueFormData({ name: '', type: [], email: '', capacity: '', contactName: '', phone: '', description: '', city: '', address: '', vendor_id: '', landscape_urls: [''], portrait_url: '', table_reservation_fee: '', bill_discount_percentage: '', tax_percentage: '' });
    setVenueLandscapeFiles([null]); setVenueLandscapePreviews(['']);
    setVenuePortraitFile(null); setVenuePortraitPreview('');
    setWorkingHours(prev => prev.map(h => ({ ...h, active: false })));
    setVenueStep(1); setIsEditingVenue(false);
  };

  const openEditVenue = (club: any) => {
    setVenueFormData({
      name: club.name || '', type: Array.isArray(club.category_ids) ? club.category_ids.map((c: any) => c?._id || c) : [],
      email: club.email || '', capacity: club.capacity || '', contactName: club.contactName || '',
      phone: club.phone || club.phone_number || '', description: club.about || club.description || '',
      city: typeof club.city_id === 'object' ? club.city_id?._id || '' : club.city_id || '',
      address: club.address || '',
      vendor_id: typeof club.vendor_id === 'object' ? club.vendor_id?._id || '' : club.vendor_id || '',
      landscape_urls: Array.isArray(club.gallery_images) ? club.gallery_images : [''],
      portrait_url: club.venue_image ? assetUrl(club.venue_image) : (club.portrait_url || ''),
      table_reservation_fee: club.table_reservation_fee != null ? String(club.table_reservation_fee) : '',
      bill_discount_percentage: club.bill_discount_percentage != null ? String(club.bill_discount_percentage) : '',
      tax_percentage: club.tax_percentage != null ? String(club.tax_percentage) : '',
    });
    setVenueLandscapeFiles((Array.isArray(club.gallery_images) ? club.gallery_images : ['']).map(() => null));
    setVenueLandscapePreviews(Array.isArray(club.gallery_images) && club.gallery_images.length ? club.gallery_images.map((g: string) => assetUrl(g)) : ['']);
    setVenuePortraitFile(null);
    setVenuePortraitPreview(club.venue_image ? assetUrl(club.venue_image) : (club.portrait_url || ''));
    if (Array.isArray(club.open_days) && club.open_days.length) {
      const timeStr = `${club.start_time || '10:00 PM'} - ${club.end_time || '04:00 AM'}`;
      setWorkingHours(prev => prev.map(h => ({ ...h, active: club.open_days.includes(h.day), time: club.open_days.includes(h.day) ? timeStr : h.time })));
    }
    setSelectedClub(club); setIsEditingVenue(true); setVenueStep(1); setIsViewingVenue(false); setIsCreatingClub(true);
  };

  const handleEditEvent = (event: any) => {
    setEventFormData({
      title: event.title || '', city: event.city || clubData?.city || '',
      venue_id: event.venue_id || clubData?.id || '',
      genre: Array.isArray(event.genre) ? event.genre : (event.category ? [event.category] : []),
      event_type: Array.isArray(event.event_type) ? event.event_type : [],
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      start_time: event.start_time || '22:00', end_time: event.end_time || '04:00',
      description: event.description || '', poster_url: event.poster_url || event.imageUrl || '',
      landscape_urls: event.landscape_urls || [event.imageUrl || ''], ticketing_link: event.ticketing_link || '',
    });
    setPosterPreview(event.poster_url || event.imageUrl || '');
    setBannerPreview((event.landscape_urls?.[0]) || event.imageUrl || '');
    setPosterFile(null); setBannerFile(null);
    setIsEditingEvent(true); setIsCreatingEvent(true); setCreationStep(1); setSelectedEvent(null);
  };

  // ── Submit handlers ────────────────────────────────────────────────────
  const handleSubmitEvent = async () => {
    try {
      setIsSubmitting(true);
      const vendorId = clubData?._id || clubData?.id;
      if (!vendorId) throw new Error('No club found for your account');
      const cityId = eventFormData.city || (typeof clubData?.city === 'object' ? clubData?.city?._id : clubData?.city);
      if (!cityId) throw new Error('Select a city');
      if (!eventFormData.title) throw new Error('Enter an event title');
      if (!eventFormData.date) throw new Error('Set an event date');
      if (!eventFormData.address) throw new Error('Enter an address');
      if (!eventFormData.latitude || !eventFormData.longitude) throw new Error('Enter latitude and longitude');
      if (!isEditingEvent && !posterFile) throw new Error('Upload a poster image');
      const body = new FormData();
      body.append('venue_name', eventFormData.title);
      body.append('city_id', cityId);
      body.append('category_ids', JSON.stringify(eventFormData.event_type || []));
      body.append('start_time', eventFormData.start_time || '');
      body.append('end_time', eventFormData.end_time || '');
      body.append('address', eventFormData.address);
      body.append('start_date', eventFormData.date);
      body.append('is_multi_day', 'false');
      body.append('about', eventFormData.description || '');
      body.append('latitude', eventFormData.latitude);
      body.append('longitude', eventFormData.longitude);
      if (!isEditingEvent) body.append('vendor_id', vendorId);
      if (posterFile) body.append('venue_image', posterFile);
      if (bannerFile) body.append('event_layout_images', bannerFile);
      const url    = isEditingEvent ? `${API_BASE}/events/update_event/${selectedEvent?._id || selectedEvent?.id}` : `${API_BASE}/events/create_event`;
      const method = isEditingEvent ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(apiErrorMessage(json, 'Failed to save event'));
      queryClient.invalidateQueries({ queryKey: ['events-admin'] });
      setIsCreatingEvent(false); resetEventForm();
    } catch (err: any) {
      alert(err.message || 'Failed to save event.');
    } finally { setIsSubmitting(false); }
  };

  const handleSubmitVenue = async () => {
    try {
      setIsSubmitting(true);
      const activeDays = workingHours.filter(h => h.active);
      if (activeDays.length === 0) throw new Error('Select at least one open day');
      const [start_time, end_time] = activeDays[0].time.split(' - ').map((s: string) => s.trim());
      const vendorId = selectedClub ? (selectedClub.vendor_id || selectedClub._id) : venueFormData.vendor_id;
      if (!vendorId) throw new Error('Select a vendor/organiser for this venue');
      if (!venueFormData.city) throw new Error('Select a city');
      if (!venueFormData.address) throw new Error('Pick a location on the map');
      if (venueFormData.phone && !/^\d{10}$/.test(venueFormData.phone)) throw new Error('Enter a valid 10-digit phone number');
      if (!venueFormData.type || venueFormData.type.length === 0) throw new Error('Select a category');
      if (!venuePortraitFile && !venueFormData.portrait_url) throw new Error('Upload a venue image');
      const body = new FormData();
      body.append('venue_name', venueFormData.name);
      body.append('city_id', venueFormData.city);
      (Array.isArray(venueFormData.type) ? venueFormData.type : [venueFormData.type]).filter(Boolean).forEach((id: string) => body.append('category_ids', id));
      body.append('open_days', JSON.stringify(activeDays.map(h => h.day)));
      body.append('start_time', start_time || '');
      body.append('end_time', end_time || '');
      body.append('address', venueFormData.address || '');
      body.append('latitude', venueFormData.latitude || '');
      body.append('longitude', venueFormData.longitude || '');
      body.append('about', venueFormData.description || '');
      body.append('table_reservation_fee', venueFormData.table_reservation_fee || '0');
      body.append('bill_discount_percentage', String(Math.max(0, Math.min(100, Number(venueFormData.bill_discount_percentage) || 0))));
      body.append('tax_percentage', venueFormData.tax_percentage || '0');
      if (!isEditingVenue) body.append('vendor_id', vendorId);
      if (venuePortraitFile) body.append('venue_image', venuePortraitFile);
      venueLandscapeFiles.forEach(f => { if (f) body.append('gallery_images', f); });
      const url    = isEditingVenue && selectedClub ? `${API_BASE}/venue/update_venue/${selectedClub._id}` : `${API_BASE}/venue/create_venue`;
      const method = isEditingVenue && selectedClub ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(apiErrorMessage(json, 'Failed to save venue'));
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setIsCreatingClub(false); resetVenueForm();
    } catch (err: any) {
      alert(err.message || 'Failed to save venue.');
    } finally { setIsSubmitting(false); }
  };

  // ── All queries ────────────────────────────────────────────────────────
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); return json.data ?? [];
    },
  });

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (!focusId || !Array.isArray(clubs)) return;
    const match = (clubs as any[]).find((x: any) => String(x._id || x.id) === focusId);
    if (match) { setSelectedClub(withVenueData(match)); setIsViewingVenue(true); }
  }, [searchParams, clubs]);

  const { data: venues } = useQuery({
    queryKey: ['venues-for-clubs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/venue/get_all_venues`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); return json.data ?? [];
    },
  });

  const { data: featuredVenues, isLoading: featuredVenuesLoading } = useQuery({
    queryKey: ['featured-venues'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/venue/featured`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); return Array.isArray(json.data) ? json.data : [];
    },
    enabled: isViewingFeaturedClubs,
  });

  const { data: events } = useQuery({
    queryKey: ['events-admin'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json(); return Array.isArray(data.data) ? data.data : [];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); return json.data ?? [];
    },
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/genre/get_all_genres`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); return json.data ?? [];
    },
  });

  const { data: eventTypes } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/category/get_category`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); const list = Array.isArray(json.data) ? json.data : [];
      return list.filter((c: any) => c.category_type === 1);
    },
  });

  const { data: venueTypes } = useQuery({
    queryKey: ['venueTypes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/category/get_category`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); const list = Array.isArray(json.data) ? json.data : [];
      return list.filter((c: any) => c.category_type === 2);
    },
  });

  const { data: vendorsForVenue } = useQuery({
    queryKey: ['mongo-vendors'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); return json.data ?? [];
    },
  });

  const vendorListForVenue = Array.isArray(vendorsForVenue) ? vendorsForVenue : [];
  const isClubAdmin = user?.role === 'CLUB_ADMIN';
  const ownVendorForVenue = isClubAdmin ? vendorListForVenue.find((v: any) => v.name === user?.organisation) : null;

  // ── Mutations ──────────────────────────────────────────────────────────
  const featureVenueMutation = useMutation({
    mutationFn: async (data: { city: string; clubId: string; duration: number }) => {
      const res = await fetch(`${API_BASE}/venue/feature/${data.clubId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ duration: data.duration, city: data.city }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(apiErrorMessage(json, 'Failed to feature club'));
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['venues-for-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['featured-venues'] });
    },
  });

  const unfeatureVenueMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/venue/unfeature/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to unfeature club'); return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['venues-for-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['featured-venues'] });
    },
  });

  // NEW: Approve vendor
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/vendor/approve_vendor/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Failed to approve');
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubs'] }),
  });

  // NEW: Reject vendor
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`${API_BASE}/vendor/reject_vendor/${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Failed to reject');
      return json;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clubs'] }); setRejectModal({ open: false, clubId: '', clubName: '' }); },
  });

  // NEW: Activate vendor
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/vendor/activate_vendor/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Failed to activate');
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubs'] }),
  });

  // NEW: Deactivate vendor
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/vendor/deactivate_vendor/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Failed to deactivate');
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubs'] }),
  });

  // NEW: Delete venue
  const deleteVenueMutation = useMutation({
    mutationFn: async (venueId: string) => {
      const res = await fetch(`${API_BASE}/venue/delete_venue/${venueId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Failed to delete venue');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['venues-for-clubs'] });
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────
  const getVenueForVendor = (vendorId: string) => {
    if (!Array.isArray(venues)) return null;
    return venues.find((v: any) => {
      const vid = typeof v.vendor_id === 'object' ? v.vendor_id?._id : v.vendor_id;
      return vid === vendorId;
    }) || null;
  };
  const withVenueData = (club: any) => {
    if (!club) return club;
    const venue = getVenueForVendor(club._id || club.id);
    return venue ? { ...club, ...venue, _id: club._id, vendor_id: club._id, venue_id: venue._id } : club;
  };

  const clubData = Array.isArray(clubs) ? clubs.find((c: any) => c.name === user?.organisation) : null;

  const clubEvents = Array.isArray(events)
    ? events.filter((e: any) => e.club_id === clubData?.id || e.club_id === clubData?._id || e.venue === clubData?.name)
    : [];
  const filteredClubEvents = clubEvents.filter((e: any) => {
    const now = new Date(); const eventDate = new Date(e.date);
    if (activeEventsTab === 'Upcoming') return eventDate >= now;
    if (activeEventsTab === 'Past')     return eventDate < now;
    if (activeEventsTab === 'Active')   return e.status === 'ACTIVE';
    return true;
  });

  const cityName = (c: any) => typeof c.city === 'object' ? c.city?.city_name : c.city;

  const filteredClubs = (Array.isArray(clubs) ? clubs : []).filter((c: any) => {
    const cn = cityName(c);
    const matchesSearch  = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || cn?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus  = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesCity    = filterCity   === 'ALL' || cn === filterCity;
    return matchesSearch && matchesStatus && matchesCity;
  }).sort((a: any, b: any) => {
    let av = a[sortField]; let bv = b[sortField];
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortOrder === 'asc' ? -1 : 1;
    if (av > bv) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };
  const SortIcon = ({ field }: { field: string }) =>
    sortField === field
      ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)
      : <ArrowUpDown className="w-3 h-3 opacity-50" />;

  const toggleDay = (index: number) => {
    const nh = [...workingHours]; const isActive = !nh[index].active;
    nh[index].active = isActive; if (isActive) nh[index].time = lastUsedTime;
    setWorkingHours(nh);
  };
  const updateDayTime = (index: number, time: string) => {
    const nh = [...workingHours]; nh[index].time = time; setLastUsedTime(time); setWorkingHours(nh);
  };

  // NEW: Real CSV export
  const exportData = () => {
    if (!filteredClubs.length) return;
    const headers = ['Name', 'City', 'Address', 'Status', 'Verified', 'Active', 'Email', 'Phone', 'Created At'];
    const rows = filteredClubs.map((c: any) => [
      c.name || '', cityName(c) || '', c.address || '',
      c.status || '', c.is_verified ? 'Yes' : 'No', c.is_active ? 'Yes' : 'No',
      c.email || '', c.phone_number || '',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `clubs-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const featurableClubs = filteredClubs.map((c: any) => {
    const venue = getVenueForVendor(c._id || c.id); if (!venue) return null;
    return { _id: venue._id, venue_name: venue.venue_name || c.name, city: c.city, venue_image: venue.venue_image };
  }).filter(Boolean);

  // ── CLUB_ADMIN view (unchanged logic, kept intact) ─────────────────────
  if (user?.role === 'CLUB_ADMIN') {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
              Venue <span className="text-primary neon-text">Management</span>
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
              <Calendar className="w-3 h-3" /> Manage and monitor your venues
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/club-profile')} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <Eye className="w-4 h-4" /> View Profile
            </button>
            <button
              onClick={() => { resetEventForm(); setEventFormData((d: any) => ({ ...d, venue_id: clubData?.id || clubData?._id || '', city: clubData?.city || '' })); setIsCreatingEvent(true); }}
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
          ].map(stat => (
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
              {(['Upcoming', 'Active', 'Past'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveEventsTab(tab)}
                  className={cn('px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest', activeEventsTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white')}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2">
            <div className="grid gap-2">
              {filteredClubEvents.length > 0 ? filteredClubEvents.map((event: any) => (
                <div key={event._id || event.id} onClick={() => { setSelectedEvent(event); setIsPreviewing(true); }}
                  className="p-4 rounded-2xl hover:bg-white/[0.03] transition-all flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center">
                      {event.poster_url || event.imageUrl ? <img src={event.poster_url || event.imageUrl} alt="" className="w-full h-full object-cover" /> : <Image className="w-5 h-5 text-white/20" />}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase"><Calendar className="w-3 h-3 text-primary" />{new Date(event.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase"><Users className="w-3 h-3 text-secondary" />{event.attendees || 0} RSVPs</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase border border-primary/20">{event.category}</span>
                        <span className={cn('px-2 py-0.5 rounded text-[8px] font-black uppercase border', STATUS_COLORS[event.status] || 'bg-white/5 border-white/10 text-white/50')}>{event.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeEventsTab === 'Past' ? (
                      <>
                        <button onClick={e => { e.stopPropagation(); setSelectedEvent({ ...event, showAnalytics: true }); }} className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center gap-2"><BarChart3 className="w-3 h-3" /> Analytics</button>
                        <button onClick={e => { e.stopPropagation(); setSelectedEvent(event); setIsPreviewing(true); }} className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all border border-white/5"><Eye className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={e => { e.stopPropagation(); handleEditEvent(event); }} className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={async e => { e.stopPropagation(); if (!confirm('Delete this event?')) return; await fetch(`${API_BASE}/events/delete_event/${event._id || event.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['events-admin'] }); }} className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto"><Calendar className="w-8 h-8 text-muted-foreground opacity-20" /></div>
                  <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">No {activeEventsTab.toLowerCase()} events found</p>
                  <button onClick={() => { resetEventForm(); setEventFormData((d: any) => ({ ...d, venue_id: clubData?.id || clubData?._id || '', city: clubData?.city || '' })); setIsCreatingEvent(true); }} className="text-primary font-black text-xs hover:underline uppercase tracking-widest">Create an event now</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Event create/edit modal for CLUB_ADMIN omitted for brevity — identical to Super Admin version below */}
        <AnimatePresence>
          {selectedEvent && !isCreatingEvent && isPreviewing && !selectedEvent.showAnalytics && (
            <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }}
              className="fixed top-8 left-8 z-[200] w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 hover:border-primary/50 transition-all group active:scale-95 shadow-2xl">
              <ChevronLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── SUPER ADMIN / NORMAL ADMIN view ─────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Reject modal */}
      <RejectModal
        open={rejectModal.open}
        clubName={rejectModal.clubName}
        isPending={rejectMutation.isPending}
        onCancel={() => setRejectModal({ open: false, clubId: '', clubName: '' })}
        onConfirm={(reason) => rejectMutation.mutate({ id: rejectModal.clubId, reason })}
      />

      {/* ── Header ── */}
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
          <button onClick={() => setIsViewingFeaturedClubs(true)} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Star className="w-3.5 h-3.5" /> Featured
          </button>
          <button
            onClick={() => { setSelectedClub(null); resetVenueForm(); setVenueFormData((prev: any) => ({ ...prev, vendor_id: ownVendorForVenue?._id || '' })); setIsCreatingClub(true); }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Club
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {(() => {
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          return [
            { label: 'Total Clubs',      value: filteredClubs.length,                                                                                         icon: Building2,   color: 'text-blue-400',    bg: 'bg-blue-400/10' },
            { label: 'Active Clubs',     value: filteredClubs.filter((c: any) => c.is_active).length,                                                         icon: Activity,    color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Inactive',         value: filteredClubs.filter((c: any) => !c.is_active).length,                                                        icon: XCircle,     color: 'text-zinc-400',    bg: 'bg-zinc-400/10' },
            { label: 'Verified',         value: filteredClubs.filter((c: any) => c.is_verified).length,                                                       icon: ShieldCheck, color: 'text-purple-400',  bg: 'bg-purple-400/10' },
            { label: 'Pending Approval', value: filteredClubs.filter((c: any) => !c.is_verified).length,                                                      icon: Clock,       color: 'text-amber-400',   bg: 'bg-amber-400/10' },
            { label: 'Cities',           value: new Set(filteredClubs.map(cityName).filter(Boolean)).size,                                                     icon: MapPin,      color: 'text-pink-400',    bg: 'bg-pink-400/10' },
            { label: 'New (30 Days)',    value: filteredClubs.filter((c: any) => c.createdAt && new Date(c.createdAt).getTime() >= thirtyDaysAgo).length,      icon: Users,       color: 'text-cyan-400',    bg: 'bg-cyan-400/10' },
          ];
        })().map(stat => (
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

      {/* ── Toolbar ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Club List</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search clubs..."
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white')}><LayoutIcon className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('table')} className={cn('p-2 rounded-lg transition-all', viewMode === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white')}><Database className="w-4 h-4" /></button>
            </div>
            <FilterPanel>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                <FilterDropdown value={filterCity} onChange={setFilterCity} options={[{ label: 'All Cities', value: 'ALL' }, ...(Array.isArray(cities) ? cities : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((c: any) => ({ label: c.city_name, value: c.city_name }))]} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                <FilterDropdown value={filterStatus} onChange={setFilterStatus} options={[{ label: 'All Status', value: 'ALL' }, { label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }, { label: 'Pending', value: 'PENDING' }, { label: 'Banned', value: 'BANNED' }]} />
              </div>
            </FilterPanel>
          </div>
        </div>

        {/* ── TABLE VIEW ── */}
        {viewMode === 'table' ? (
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">Club / Category <SortIcon field="name" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('city')}>
                      <div className="flex items-center gap-1.5">Location <SortIcon field="city" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stats</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Verification</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading clubs...</td></tr>
                  ) : filteredClubs.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">No clubs found.</td></tr>
                  ) : filteredClubs.map((club: any) => {
                    const venue = getVenueForVendor(club._id || club.id);
                    const venueId = venue?._id;
                    const isActive = club.is_active;
                    const isVerified = club.is_verified;
                    return (
                      <tr key={club._id || club.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => { setSelectedClub(withVenueData(club)); setIsViewingVenue(true); }}>
                        {/* Club name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                              {venue?.venue_image
                                ? <img src={assetUrl(venue.venue_image)} alt="" className="w-full h-full object-cover" />
                                : <Building2 className="w-4 h-4 text-white/20" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{club.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{club.vendor_type === 'event_organizer' ? 'Event Organiser' : 'Club Owner'}</p>
                            </div>
                          </div>
                        </td>
                        {/* Location */}
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-white">{cityName(club) || '—'}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{club.address || venue?.address || 'Address not set'}</p>
                        </td>
                        {/* Stats */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Rating</p><p className="text-xs font-bold text-white">—</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Followers</p><p className="text-xs font-bold text-white">—</p></div>
                          </div>
                        </td>
                        {/* Verification */}
                        <td className="px-6 py-4">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={cn('text-[10px] px-2.5 py-1 rounded-full font-black uppercase border', isActive ? STATUS_COLORS.ACTIVE : STATUS_COLORS.INACTIVE)}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {/* Edit */}
                            <button
                              title="Edit venue"
                              onClick={() => openEditVenue(withVenueData(club))}
                              className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {/* Approve / already verified */}
                            {!isVerified && (
                              <button
                                title="Approve vendor"
                                disabled={approveMutation.isPending}
                                onClick={() => { if (!confirm(`Approve "${club.name}"?`)) return; approveMutation.mutate(club._id || club.id); }}
                                className="p-2 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-40"
                              >
                                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                              </button>
                            )}
                            {/* Reject */}
                            {!isVerified && (
                              <button
                                title="Reject vendor"
                                onClick={() => setRejectModal({ open: true, clubId: club._id || club.id, clubName: club.name })}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            {/* Activate / Deactivate */}
                            {isActive ? (
                              <button
                                title="Deactivate vendor"
                                disabled={deactivateMutation.isPending}
                                onClick={() => { if (!confirm(`Deactivate "${club.name}"?`)) return; deactivateMutation.mutate(club._id || club.id); }}
                                className="p-2 rounded-lg hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 transition-colors disabled:opacity-40"
                              >
                                {deactivateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" />}
                              </button>
                            ) : (
                              <button
                                title="Activate vendor"
                                disabled={activateMutation.isPending}
                                onClick={() => { if (!confirm(`Activate "${club.name}"?`)) return; activateMutation.mutate(club._id || club.id); }}
                                className="p-2 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-40"
                              >
                                {activateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                              </button>
                            )}
                            {/* Delete venue */}
                            {venueId && (
                              <button
                                title="Delete venue"
                                disabled={deleteVenueMutation.isPending}
                                onClick={() => { if (!confirm(`Delete venue for "${club.name}"? This cannot be undone.`)) return; deleteVenueMutation.mutate(venueId); }}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                              >
                                {deleteVenueMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── GRID VIEW ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">Loading clubs...</div>
            ) : filteredClubs.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">No clubs found.</div>
            ) : filteredClubs.map((club: any) => {
              const venue = getVenueForVendor(club._id || club.id);
              const venueId = venue?._id;
              return (
                <motion.div key={club._id || club.id} whileHover={{ y: -4 }}
                  className="glass-card rounded-2xl border border-white/10 overflow-hidden group cursor-pointer"
                  onClick={() => { setSelectedClub(withVenueData(club)); setIsViewingVenue(true); }}>
                  <div className="aspect-video relative overflow-hidden">
                    {venue?.venue_image ? (
                      <img src={assetUrl(venue.venue_image)} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center"><Building2 className="w-12 h-12 text-white/15" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border backdrop-blur-md', club.is_active ? STATUS_COLORS.ACTIVE : STATUS_COLORS.INACTIVE)}>
                        {club.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">{club.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" /> {venue?.address || cityName(club) || 'Location not set'}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {club.is_verified
                          ? <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase"><ShieldCheck className="w-3 h-3" /> Verified</span>
                          : <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase"><Clock className="w-3 h-3" /> Pending</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button title="Edit" onClick={() => openEditVenue(withVenueData(club))} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                        {!club.is_verified && (
                          <>
                            <button title="Approve" disabled={approveMutation.isPending} onClick={() => { if (!confirm(`Approve "${club.name}"?`)) return; approveMutation.mutate(club._id || club.id); }} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-all disabled:opacity-40"><CheckCheck className="w-4 h-4" /></button>
                            <button title="Reject" onClick={() => setRejectModal({ open: true, clubId: club._id || club.id, clubName: club.name })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"><Ban className="w-4 h-4" /></button>
                          </>
                        )}
                        {club.is_active
                          ? <button title="Deactivate" disabled={deactivateMutation.isPending} onClick={() => { if (!confirm(`Deactivate "${club.name}"?`)) return; deactivateMutation.mutate(club._id || club.id); }} className="p-1.5 rounded-lg hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 transition-all disabled:opacity-40"><PowerOff className="w-4 h-4" /></button>
                          : <button title="Activate" disabled={activateMutation.isPending} onClick={() => { if (!confirm(`Activate "${club.name}"?`)) return; activateMutation.mutate(club._id || club.id); }} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-all disabled:opacity-40"><Power className="w-4 h-4" /></button>}
                        {venueId && <button title="Delete venue" disabled={deleteVenueMutation.isPending} onClick={() => { if (!confirm(`Delete venue for "${club.name}"?`)) return; deleteVenueMutation.mutate(venueId); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Venue detail panel ── */}
      <AnimatePresence>
        {isViewingVenue && selectedClub && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsViewingVenue(false)} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110]" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:pr-[440px] pointer-events-none">
              <div className="w-full max-w-2xl pointer-events-auto flex flex-col gap-0 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.8)]">
                <div className="relative" style={{ aspectRatio: '16/8' }}>
                  {selectedClub.venue_image || selectedClub.business_image ? (
                    <img src={assetUrl(selectedClub.venue_image || selectedClub.business_image)} alt={selectedClub.venue_name || selectedClub.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1a0a2e,#0d0d1a 50%,#1a0a10)' }}>
                      <div className="text-center space-y-3 opacity-30"><Building2 className="w-16 h-16 mx-auto text-primary" /><p className="text-xs font-black uppercase tracking-widest text-white">No Image</p></div>
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.3) 40%,rgba(9,9,11,0.98) 100%)' }} />
                  <div className="absolute top-5 left-6 right-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md', selectedClub.is_active ? STATUS_COLORS.ACTIVE : STATUS_COLORS.INACTIVE)}>
                        {selectedClub.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {cityName(selectedClub) && (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md bg-black/30 text-white/70 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />{cityName(selectedClub)}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setIsViewingVenue(false)} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-all"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">{selectedClub.venue_name || selectedClub.name}</h2>
                    {(selectedClub.about || selectedClub.description) && <p className="text-sm text-white/50 mt-2 leading-relaxed line-clamp-2">{selectedClub.about || selectedClub.description}</p>}
                  </div>
                </div>
                <div className="bg-[#0d0d12] border-t border-white/5 px-7 py-5 grid grid-cols-3 gap-4">
                  {[
                    { icon: Clock, color: '#2D9AFF', label: 'Open Hours', value: selectedClub.start_time ? `${selectedClub.start_time}${selectedClub.end_time ? ` – ${selectedClub.end_time}` : ''}` : 'Not set' },
                    { icon: Calendar, color: '#FF2D9A', label: 'Open Days', value: Array.isArray(selectedClub.open_days) && selectedClub.open_days.length ? `${selectedClub.open_days.length} days/week` : 'Not set' },
                    { icon: MapPin, color: '#2DFF9A', label: 'Address', value: selectedClub.address || 'Not set' },
                  ].map(({ icon: Icon, color, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}><Icon className="w-4 h-4" style={{ color }} /></div>
                      <div className="min-w-0"><p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</p><p className="text-xs font-bold text-white truncate">{value}</p></div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0a0a0f] px-7 py-5 flex items-center justify-between gap-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
                      <ShieldCheck className={cn('w-4 h-4', selectedClub.is_verified ? 'text-emerald-400' : 'text-amber-400')} />
                      <div><p className="text-[9px] text-white/30 font-black uppercase tracking-widest">Verification</p><p className="text-base font-black text-white leading-none">{selectedClub.is_verified ? 'Verified' : 'Pending'}</p></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Approve from detail panel */}
                    {!selectedClub.is_verified && (
                      <>
                        <button
                          disabled={approveMutation.isPending}
                          onClick={() => { if (!confirm(`Approve "${selectedClub.name}"?`)) return; approveMutation.mutate(selectedClub._id || selectedClub.id); setIsViewingVenue(false); }}
                          className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2 disabled:opacity-40"
                        >
                          {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />} Approve
                        </button>
                        <button
                          onClick={() => { setIsViewingVenue(false); setRejectModal({ open: true, clubId: selectedClub._id || selectedClub.id, clubName: selectedClub.name }); }}
                          className="px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                        >
                          <Ban className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    <button onClick={() => { setIsViewingVenue(false); openEditVenue(selectedClub); }}
                      className="px-6 py-2.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                      <Edit2 className="w-3.5 h-3.5" /> Edit Venue
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-[#08080c] z-[130] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5 overflow-hidden">
              <ClubProfilePreview club={selectedClub} onClose={() => setIsViewingVenue(false)} hideCloseButton />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Club modal ── */}
      <AnimatePresence>
        {isCreatingClub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-2xl rounded-3xl border border-white/[0.08] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.7)] flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between bg-[#0a0a0f]">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      {selectedClub ? 'Edit Club' : 'Add New Club'}
                    </h3>
                    <p className="text-[10px] text-white/30 font-medium mt-0.5">Step {venueStep} of 3</p>
                  </div>
                </div>
                <button onClick={() => { setIsCreatingClub(false); resetVenueForm(); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-hide">
                <div className="mb-10">
                  {/* Step labels */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    {['Details', 'Visuals', 'Logistics'].map((label, i) => {
                      const step = i + 1;
                      return (
                        <span key={label} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${venueStep >= step ? 'text-primary' : 'text-white/20'}`}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                  {/* Progress track */}
                  <div className="relative h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(255,45,154,0.4)]"
                      style={{ width: `${((venueStep - 1) / 2) * 100}%` }}
                    />
                  </div>
                  {/* Step dots */}
                  <div className="flex items-center justify-between mt-3 px-0">
                    {[1, 2, 3].map(step => (
                      <div key={step} className="flex flex-col items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all duration-300 ${
                          venueStep > step
                            ? 'bg-primary border-primary text-white shadow-[0_0_12px_rgba(255,45,154,0.3)]'
                            : venueStep === step
                              ? 'bg-primary/10 border-primary text-primary scale-110'
                              : 'bg-white/[0.03] border-white/10 text-white/20'
                        }`}>
                          {venueStep > step ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : step}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8">
                  <AnimatePresence mode="wait">
                    {venueStep === 1 && (
                      <motion.div key="vs1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <FormSection title="Basic Information" icon={<Fingerprint className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="col-span-1 md:col-span-2">
                              <RefinedField label="Club Name" name="name" value={venueFormData.name} onChange={(e: any) => setVenueFormData({ ...venueFormData, name: e.target.value })} placeholder="e.g. The Quantum Vault" icon={<Building2 className="w-4 h-4" />} />
                            </div>
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Vendor / Organiser</label>
                              {isClubAdmin ? (
                                <div className="flex items-center gap-3 w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-5 text-sm text-white/60">
                                  <span className="truncate">{ownVendorForVenue?.name || user?.organisation || 'Your organisation'}</span>
                                  <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-white/20 shrink-0">Locked to your account</span>
                                </div>
                              ) : (
                                <SingleSelectDropdown options={(vendorListForVenue || []).map((v: any) => ({ label: v.name, value: v._id || v.id }))} value={venueFormData.vendor_id} onChange={(val: string) => setVenueFormData({ ...venueFormData, vendor_id: val })} placeholder="Select vendor..." />
                              )}
                            </div>
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Category</label>
                              <MultiSelectDropdown options={venueTypes?.slice().sort((a: any, b: any) => (a.category_name || '').localeCompare(b.category_name || '')).map((t: any) => ({ label: t.category_name, value: t._id })) || []} value={Array.isArray(venueFormData.type) ? venueFormData.type : (venueFormData.type ? [venueFormData.type] : [])} onChange={(v: any) => setVenueFormData({ ...venueFormData, type: v })} placeholder="Select categories" />
                            </div>
                            <RefinedField label="Contact Email" name="email" type="email" value={venueFormData.email} onChange={(e: any) => setVenueFormData({ ...venueFormData, email: e.target.value })} placeholder="ops@venue.com" icon={<Mail className="w-4 h-4" />} />
                            <RefinedField label="Capacity" name="capacity" type="number" value={venueFormData.capacity} onChange={(e: any) => setVenueFormData({ ...venueFormData, capacity: e.target.value })} placeholder="3500" icon={<Users className="w-4 h-4" />} />
                            <RefinedField label="Contact Number" name="phone" value={venueFormData.phone} onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit mobile number" icon={<Phone className="w-4 h-4" />} />
                          </div>
                        </FormSection>
                        <FormSection title="Reservation Options" icon={<Ticket className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <RefinedField label="Cover Charge (₹)" name="table_reservation_fee" type="number" value={venueFormData.table_reservation_fee} onChange={(e: any) => setVenueFormData({ ...venueFormData, table_reservation_fee: e.target.value })} placeholder="0" icon={<Wallet className="w-4 h-4" />} />
                            <RefinedField label="Bill Discount (%)" name="bill_discount_percentage" type="number" value={venueFormData.bill_discount_percentage} onChange={(e: any) => { const v = e.target.value === '' ? '' : String(Math.max(0, Math.min(100, Number(e.target.value)))); setVenueFormData({ ...venueFormData, bill_discount_percentage: v }); }} placeholder="0" icon={<TrendingDown className="w-4 h-4" />} />
                            <RefinedField label="Tax (%)" name="tax_percentage" type="number" value={venueFormData.tax_percentage} onChange={(e: any) => setVenueFormData({ ...venueFormData, tax_percentage: e.target.value })} placeholder="0" icon={<BarChart3 className="w-4 h-4" />} />
                          </div>
                        </FormSection>
                        <FormSection title="Club Description" icon={<FileText className="w-4 h-4" />}>
                          <div className="space-y-4 group/field">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">About Club</label>
                            <textarea rows={4} value={venueFormData.description} onChange={e => setVenueFormData({ ...venueFormData, description: e.target.value })} placeholder="Describe the aesthetic and soundscape..." className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10" />
                          </div>
                        </FormSection>
                      </motion.div>
                    )}
                    {venueStep === 2 && (
                      <motion.div key="vs2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                        <FormSection title="Location Details" icon={<MapPin className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">City</label>
                              <SingleSelectDropdown options={(Array.isArray(cities) ? cities : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((city: any) => ({ label: city.city_name, value: city._id }))} value={venueFormData.city} onChange={(val: string) => setVenueFormData({ ...venueFormData, city: val })} placeholder="Select City..." />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                              <LocationPicker value={{ address: venueFormData.address, latitude: venueFormData.latitude, longitude: venueFormData.longitude }} onChange={loc => setVenueFormData({ ...venueFormData, address: loc.address, latitude: loc.latitude, longitude: loc.longitude })} placeholder="Search address or place..." />
                            </div>
                          </div>
                        </FormSection>
                        <FormSection title="Club Media" icon={<Layers className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 gap-12">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Cover Images</label>
                                <button type="button" onClick={addVenueLandscapeSlot} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white transition-all"><Plus className="w-4 h-4" /> Add Image</button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {venueLandscapePreviews.map((preview, index) => (
                                  <label key={index} className="group relative aspect-video rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl transition-all hover:border-primary/40 cursor-pointer block">
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleVenueLandscapeChange(e, index)} />
                                    {preview ? (
                                      <><img src={preview} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change</span></div></>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 group-hover:text-primary transition-colors"><Upload className="w-10 h-10" /><span className="text-[9px] font-black uppercase tracking-widest">Slot {index + 1}</span></div>
                                    )}
                                    <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); removeVenueLandscapeSlot(index); }} className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-5 h-5" /></button>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-6">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Profile Photo</label>
                              <label className="aspect-[9/16] max-w-[240px] mx-auto rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl group relative cursor-pointer hover:border-blue-400/40 transition-all block">
                                <input ref={venuePortraitRef} type="file" accept="image/*" className="hidden" onChange={handleVenuePortraitChange} />
                                {venuePortraitPreview ? (
                                  <><img src={venuePortraitPreview} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change</span></div></>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 group-hover:text-blue-400 transition-colors"><Upload className="w-10 h-10 group-hover:scale-110 transition-all" /><span className="text-[9px] font-black uppercase tracking-widest">Select Photo</span></div>
                                )}
                              </label>
                            </div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}
                    {venueStep === 3 && (
                      <motion.div key="vs3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <FormSection title="Opening Hours" icon={<Clock className="w-4 h-4" />}>
                          <div className="space-y-6">
                            {workingHours.map((item, index) => (
                              <div key={item.day} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 group p-4 rounded-[28px] hover:bg-white/[0.02] transition-all">
                                <button type="button" onClick={() => toggleDay(index)} className={cn('min-w-[140px] px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all border', item.active ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(255,45,154,0.3)] scale-105' : 'bg-[#09090B] border-white/5 text-white/20 hover:text-white/60')}>{item.day}</button>
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
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20"><Info className="w-6 h-6" /></div>
                            <div className="space-y-2"><h4 className="text-xs font-black text-white uppercase tracking-widest">Note</h4><p className="text-[13px] text-white/40 leading-relaxed font-medium">Activating a day will automatically use the same hours as the previously selected day.</p></div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="p-10 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>{venueStep > 1 && <button onClick={() => setVenueStep(v => v - 1)} className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 active:scale-95"><ChevronLeft className="w-4 h-4" /> Back</button>}</div>
                <div className="flex items-center gap-4">
                  <button onClick={() => { setIsCreatingClub(false); resetVenueForm(); }} className="px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all">Cancel</button>
                  {venueStep < 3 ? (
                    <button onClick={() => { if (venueStep === 1) { if (!venueFormData.name) { alert('Enter a club name'); return; } if (!selectedClub && !venueFormData.vendor_id) { alert('Select a vendor'); return; } if (!venueFormData.type?.length) { alert('Select a category'); return; } } if (venueStep === 2 && !venueFormData.city) { alert('Select a city'); return; } setVenueStep(v => v + 1); }} className="px-14 py-5 rounded-[24px] bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group">Next Step <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>
                  ) : (
                    <button disabled={isSubmitting} onClick={handleSubmitVenue} className="px-16 py-5 rounded-[24px] bg-gradient-to-br from-primary to-purple-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3">
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : selectedClub ? 'Save Changes' : 'Add Club'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Featured clubs list ── */}
      <AnimatePresence>
        {isViewingFeaturedClubs && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card w-full max-w-2xl max-h-[80vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><Star className="w-5 h-5" /></div>
                  <div><h3 className="text-base font-black text-white uppercase tracking-tight">Featured Clubs</h3><p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{Array.isArray(featuredVenues) ? featuredVenues.length : 0} currently featured</p></div>
                </div>
                <button onClick={() => setIsViewingFeaturedClubs(false)} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {featuredVenuesLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : !featuredVenues?.length ? (
                  <div className="py-12 text-center space-y-2"><Star className="w-8 h-8 text-white/10 mx-auto" /><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No clubs currently featured</p></div>
                ) : featuredVenues.map((v: any) => {
                  const daysLeft = v.featured_until ? Math.max(0, Math.ceil((new Date(v.featured_until).getTime() - Date.now()) / 86400000)) : null;
                  return (
                    <div key={v._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{v.venue_name}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          <span>{v.featured_city || 'All Cities'}</span><span>·</span><span>{daysLeft != null ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'No expiry'}</span>
                        </div>
                      </div>
                      <button onClick={() => unfeatureVenueMutation.mutate(v._id)} disabled={unfeatureVenueMutation.isPending} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all shrink-0 disabled:opacity-50">Unfeature</button>
                    </div>
                  );
                })}
              </div>
              <div className="p-6 border-t border-white/5 shrink-0">
                <button onClick={() => { setIsViewingFeaturedClubs(false); setIsFeaturingClub(true); }} className="w-full py-3.5 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2"><Star className="w-4 h-4" /> Feature a Club</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FeatureClubModal
        isOpen={isFeaturingClub}
        onClose={() => setIsFeaturingClub(false)}
        cities={cities || []}
        clubs={featurableClubs || []}
        onConfirm={async (data) => { await featureVenueMutation.mutateAsync(data); setIsFeaturingClub(false); }}
      />
    </div>
  );
}
