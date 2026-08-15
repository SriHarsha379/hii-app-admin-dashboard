import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { FormSection, RefinedField } from '../components/RefinedForm';
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
  CreditCard,
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
  Instagram,
  Ticket,
  Music,
  X,
  ChevronLeft,
  Upload,
  RefreshCw,
  Edit,
  Pause,
  Play,
  Trash2,
  Mic2,
  PartyPopper,
  Sparkles,
  Smartphone,
  Share2,
  Megaphone,
  Target,
  Layers,
  Download,
  Video,
  Link as LinkIcon,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { motion, AnimatePresence } from 'motion/react';
import { FeatureEventModal } from '../components/FeatureEventModal';

import { API_BASE } from '../lib/apiConfig';

// Backend serves uploaded files (ad images/videos) from a static `/uploads`
// route alongside the API, not under API_BASE itself. No root server file
// was available to confirm the exact mount path, so this is the standard
// convention for this codebase's `middleware/upload.js` (files land in a
// project-root `/uploads` folder) — verify against the real deployment and
// adjust here if it differs.
const UPLOADS_BASE = API_BASE.replace(/\/app\/server\/api\/v1\/admin\/?$/, '') + '/uploads';
const adAssetUrl = (filename?: string | null) => (filename ? `${UPLOADS_BASE}/${filename}` : '');

const channels = [
  { id: 'push', label: 'Push Notification', icon: Bell, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

export default function AdsBroadcast() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ads');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['push']);
  const [isSending, setIsSending] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    audience: 'All Active Users (12.4k)',
    city: 'ALL',
    subject: '',
    content: ''
  });
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [adStep, setAdStep] = useState(1);
  const [adFormData, setAdFormData] = useState({
    name: '',
    city: 'all',
    audience: 'all',
    startDate: '',
    endDate: '',
    untilPaused: false,
    imageUrl: '',
    videoUrl: '',
    linkUrl: ''
  });
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [adVideoFile, setAdVideoFile] = useState<File | null>(null);
  const [adSubmitError, setAdSubmitError] = useState('');
  const [filterAdStatus, setFilterAdStatus] = useState('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState('ALL');

  const [isFeaturingEvent, setIsFeaturingEvent] = useState(false);
  const [featureEventData, setFeatureEventData] = useState({
    eventId: '',
    duration: '7'
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      // NOTE: was hitting `${API_BASE}/cities` (bare alias root, no handler → 404),
      // which is why the featured-events / broadcast city dropdowns were empty.
      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    }
  });

  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ads/get_all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      // Was returning the raw { success, message, data } object instead of
      // unwrapping it, so the ads table/exports were always empty.
      return json.data ?? [];
    }
  });

  // The "Create Campaign" wizard previously had no submit handler at all —
  // the image picker was a non-interactive div and the final button just
  // closed the modal. This wires it to the real backend, which only
  // persists: ad_image (required), ad_video (optional), expiry_date
  // (required), link_url (optional). Campaign name / city / audience
  // targeting aren't stored anywhere on the backend yet — see the note in
  // the Targeting section of the form.
  const createAdMutation = useMutation({
    mutationFn: async () => {
      if (!adImageFile) throw new Error('An ad image is required.');

      const expiryDate = adFormData.untilPaused
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // far-future "until paused"
        : adFormData.endDate;
      if (!expiryDate) throw new Error('Set an end date, or turn on "Run Until Paused".');

      if (adFormData.linkUrl && !/^https?:\/\/.+/i.test(adFormData.linkUrl)) {
        throw new Error('Destination link must start with http:// or https://');
      }

      const body = new FormData();
      body.append('ad_image', adImageFile);
      if (adVideoFile) body.append('ad_video', adVideoFile);
      body.append('expiry_date', expiryDate);
      if (adFormData.linkUrl) body.append('link_url', adFormData.linkUrl);

      const res = await fetch(`${API_BASE}/ads/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message?.[0] || json?.message || 'Failed to create ad');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      setIsCreatingAd(false);
      setAdStep(1);
      setAdFormData({ name: '', city: 'all', audience: 'all', startDate: '', endDate: '', untilPaused: false, imageUrl: '', videoUrl: '', linkUrl: '' });
      setAdImageFile(null);
      setAdVideoFile(null);
      setAdSubmitError('');
    },
    onError: (err: any) => setAdSubmitError(err.message || 'Failed to create ad'),
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/ads/delete/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete ad');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      setOpenMenuId(null);
    },
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const featureEventMutation = useMutation({
    mutationFn: async (data: { city: string; eventId: string; duration: number }) => {
      const res = await fetch(`${API_BASE}/events/feature`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (broadcast: any) => {
      const res = await fetch(`${API_BASE}/broadcasts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(broadcast)
      });
      return res.json();
    },
    onSuccess: () => {
      setIsSending(false);
      // Show success toast
    }
  });

  const filteredAds = (Array.isArray(ads) ? ads : []).filter((ad: any) => {
    const isExpired = ad.expiry_date ? new Date(ad.expiry_date).getTime() < Date.now() : false;
    const status = isExpired ? 'EXPIRED' : 'ACTIVE';
    return filterAdStatus === 'ALL' || status === filterAdStatus;
  });

  const featuredEventsList = Array.isArray(events) ? events.slice(0, 5) : [];
  const filteredFeaturedEvents = featuredEventsList.filter((event: any) => {
    return filterCity === 'ALL' || event.city === filterCity;
  });

  // Export was reading fields (title, city, ctr, progress) that don't exist
  // anywhere on the real Ads model, so every exported row came out blank.
  // Now exports the real fields, respects the status filter above, and
  // offers a CSV or JSON download format.
  const exportData = (format: 'csv' | 'json' = 'csv') => {
    const rows = filteredAds.map((ad: any) => {
      const isExpired = ad.expiry_date ? new Date(ad.expiry_date).getTime() < Date.now() : false;
      return {
        id: ad._id || ad.id,
        status: isExpired ? 'EXPIRED' : 'ACTIVE',
        image_url: adAssetUrl(ad.ad_image),
        video_url: ad.ad_video ? adAssetUrl(ad.ad_video) : '',
        link_url: ad.link_url || '',
        expiry_date: ad.expiry_date ? new Date(ad.expiry_date).toLocaleDateString() : '',
        created_at: ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : '',
      };
    });

    let blob: Blob;
    let filename: string;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      filename = `ads-${new Date().toISOString().slice(0, 10)}.json`;
    } else {
      const headers = ['ID', 'Status', 'Image URL', 'Video URL', 'Link URL', 'Expiry Date', 'Created'];
      const csvRows = rows.map((r) => [r.id, r.status, r.image_url, r.video_url, r.link_url, r.expiry_date, r.created_at].map((v) => `"${v}"`));
      const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
      blob = new Blob([csv], { type: 'text/csv' });
      filename = `ads-${new Date().toISOString().slice(0, 10)}.csv`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-white tracking-tight uppercase">Ad Campaigns & <span className="text-primary neon-text">Broadcasts</span></h2>
        <div className="flex items-center gap-3">
          <div className="relative group/export">
            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all">
              <button onClick={() => exportData('csv')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 transition-colors">Download as CSV</button>
              <button onClick={() => exportData('json')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 transition-colors">Download as JSON</button>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab('ads')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider",
                activeTab === 'ads' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Ads
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider",
                activeTab === 'featured' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Featured Events
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider",
                activeTab === 'broadcast' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Direct Broadcast
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'ads' ? (
          <motion.div
            key="ads"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Ads Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Ads', value: Array.isArray(ads) ? ads.length : '0', icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { label: 'Active Ads', value: (Array.isArray(ads) ? ads : []).filter((a: any) => !a.expiry_date || new Date(a.expiry_date).getTime() >= Date.now()).length || '0', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { label: 'With Video', value: (Array.isArray(ads) ? ads : []).filter((a: any) => a.ad_video).length || '0', icon: Video, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                { label: 'With Link', value: (Array.isArray(ads) ? ads : []).filter((a: any) => a.link_url).length || '0', icon: LinkIcon, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ads Table */}
            <div className="glass-card rounded-2xl border border-white/10">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Ad Campaigns</h3>
                <div className="flex items-center gap-4">
                  <FilterPanel>
                    <div className="space-y-1">
                      {/* Ads have no city-targeting field on the backend yet
                          (see the note in the Create Campaign > Targeting
                          section), so a city filter here would never match
                          anything real. Filtering by status uses actual
                          stored data instead. */}
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Filter Status</label>
                      <FilterDropdown
                        value={filterAdStatus}
                        onChange={setFilterAdStatus}
                        options={[
                          { label: 'All', value: 'ALL' },
                          { label: 'Active', value: 'ACTIVE' },
                          { label: 'Expired', value: 'EXPIRED' },
                        ]}
                      />
                    </div>
                  </FilterPanel>
                  <button
                    onClick={() => setIsCreatingAd(true)}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Ad
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-b-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Creative</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Destination Link</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Expires</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">Loading campaigns...</td>
                      </tr>
                    ) : filteredAds.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">No ads yet. Create one to get started.</td>
                      </tr>
                    ) : filteredAds.map((ad: any) => {
                      const adId = ad._id || ad.id;
                      const isExpired = ad.expiry_date ? new Date(ad.expiry_date).getTime() < Date.now() : false;
                      return (
                      <tr key={adId} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center relative">
                              {ad.ad_image ? (
                                <img src={adAssetUrl(ad.ad_image)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Image className="w-5 h-5 text-white/20" />
                              )}
                              {ad.ad_video && (
                                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center" title="Has video">
                                  <Video className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className={cn(
                                "text-[10px] uppercase font-bold tracking-wider",
                                isExpired ? "text-amber-400" : "text-emerald-400"
                              )}>{isExpired ? 'Expired' : 'Active'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {ad.link_url ? (
                            <a href={ad.link_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary font-bold flex items-center gap-1 hover:underline max-w-[220px] truncate">
                              <LinkIcon className="w-3 h-3 shrink-0" /> <span className="truncate">{ad.link_url}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No link set</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] text-white font-medium">{ad.expiry_date ? new Date(ad.expiry_date).toLocaleDateString() : '—'}</span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === adId ? null : adId)}
                            className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {openMenuId === adId && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-8 top-10 w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 glass text-left"
                              >
                                <div className="p-1">
                                  <button
                                    onClick={() => deleteAdMutation.mutate(adId)}
                                    disabled={deleteAdMutation.isPending}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Ad
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'featured' ? (
          <motion.div
            key="featured"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-2xl border border-white/10">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Featured Events</h3>
                <div className="flex items-center gap-4">
                  <FilterPanel>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                      <FilterDropdown
                        value={filterCity}
                        onChange={setFilterCity}
                        options={[
                          { label: 'All Cities', value: 'ALL' },
                          ...((Array.isArray(cities) ? cities : []).map((c: any) => ({ label: c.city_name, value: c.city_name }))),
                        ]}
                      />
                    </div>
                  </FilterPanel>
                  <button
                    onClick={() => setIsFeaturingEvent(true)}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Feature Event
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-b-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Event</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredFeaturedEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-xs text-muted-foreground">No featured events found.</td>
                      </tr>
                    ) : filteredFeaturedEvents.map((event: any) => (
                      <tr key={event.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                              <img src={`https://picsum.photos/seed/event${event.id}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{event.title}</p>
                              <p className={cn(
                                "text-[10px] uppercase font-bold tracking-wider",
                                event.status === 'ACTIVE' ? "text-emerald-400" : "text-amber-400"
                              )}>{event.status}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{event.date}</td>
                        <td className="px-6 py-4 text-sm text-white">{event.city}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="broadcast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {/* Broadcast Form */}
            <div className="lg:col-span-2 space-y-10">
              <div className="glass-card p-12 rounded-[40px] border border-white/5 space-y-12 relative overflow-hidden group/broadcast">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                      <Send className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">New <span className="text-primary neon-text">Broadcast</span></h3>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setSelectedChannels(prev =>
                            prev.includes(channel.id)
                              ? prev.filter(id => id !== channel.id)
                              : [...prev, channel.id]
                          );
                        }}
                        className={cn(
                          "p-6 rounded-[32px] border transition-all flex flex-col items-center gap-4 group/channel relative overflow-hidden",
                          selectedChannels.includes(channel.id)
                            ? "bg-primary/10 border-primary/40 shadow-[0_10px_30px_rgba(255,45,154,0.1)]"
                            : "bg-[#09090B] border-white/5 hover:bg-white/5 hover:border-white/10"
                        )}
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover/channel:scale-110 group-hover/channel:rotate-6", channel.bg)}>
                          <channel.icon className={cn("w-6 h-6", channel.color)} />
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em]",
                          selectedChannels.includes(channel.id) ? "text-primary" : "text-white/30"
                        )}>
                          {channel.label}
                        </span>
                        {selectedChannels.includes(channel.id) && (
                          <motion.div
                            layoutId="check"
                            className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 text-white" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-4 group/field">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select Audience</label>
                    <select
                      value={broadcastData.audience}
                      onChange={(e) => setBroadcastData({ ...broadcastData, audience: e.target.value })}
                      className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                    >
                      <option>All Users (12.4k)</option>
                      <option>Club Owners (42)</option>
                      <option>Premium Users (2.1k)</option>
                      <option>Inactive Users (840)</option>
                    </select>
                  </div>
                  <div className="space-y-4 group/field">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select City</label>
                    <select
                      value={broadcastData.city}
                      onChange={(e) => setBroadcastData({ ...broadcastData, city: e.target.value })}
                      className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                    >
                      <option value="ALL">All Hubs</option>
                      {(Array.isArray(cities) ? cities : []).map((city: any) => (
                        <option key={city._id || city.id} value={city.city_name}>{city.city_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-8 relative z-10">
                  <RefinedField
                    label="Subject"
                    name="subject"
                    value={broadcastData.subject}
                    onChange={(e: any) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
                    placeholder="Enter broadcast subject..."
                    icon={<Zap className="w-4 h-4" />}
                  />

                  <div className="space-y-4 group/field">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Message Content</label>
                    <textarea
                      rows={6}
                      value={broadcastData.content}
                      onChange={(e) => setBroadcastData({ ...broadcastData, content: e.target.value })}
                      placeholder="Type your message here..."
                      className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none placeholder:text-white/10 font-medium"
                    ></textarea>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-10 border-t border-white/5 relative z-10">
                  <div className="flex items-center gap-6">
                    <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/20 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Add Attachment</span>
                  </div>
                  <button
                    onClick={() => setIsSending(true)}
                    className="px-12 py-5 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:shadow-[0_15px_50px_rgba(255,45,154,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    {isSending ? 'Sending...' : 'Send Broadcast'}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview & History */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Preview</h3>
                <div className="aspect-[9/16] max-w-[240px] mx-auto bg-[#0B0B0F] rounded-[32px] border-[6px] border-white/10 p-4 relative overflow-hidden shadow-2xl">
                  <div className="w-16 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded bg-primary/40"></div>
                        <div className="w-12 h-2 rounded bg-white/20"></div>
                      </div>
                      <div className="w-full h-2 rounded bg-white/10 mb-1"></div>
                      <div className="w-2/3 h-2 rounded bg-white/10"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-white/20"></div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent History</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Weekend Promo', date: '2h ago', status: 'SENT' },
                    { label: 'System Update', date: '1d ago', status: 'SENT' },
                    { label: 'New Club Alert', date: '3d ago', status: 'SENT' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{item.date}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Ad Modal */}
      <AnimatePresence mode="wait">
        {isCreatingAd && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-4xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight leading-none uppercase">
                      Create <span className="text-primary neon-text">Ad Campaign</span>
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Step {adStep} of 3</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsCreatingAd(false); setAdStep(1); }}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="w-full h-1 bg-white/5 relative">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-600 shadow-[0_0_15px_rgba(255,45,154,0.5)] z-10"
                  animate={{ width: `${(adStep / 3) * 100}%` }}
                  transition={{ duration: 0.5, ease: "circOut" }}
                />
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
                {adStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    <FormSection title="Campaign Details" icon={<User className="w-4 h-4" />}>
                      <div className="space-y-8">
                        <RefinedField
                          label="Campaign Name"
                          name="name"
                          value={adFormData.name}
                          onChange={(e: any) => setAdFormData({ ...adFormData, name: e.target.value })}
                          placeholder="Enter campaign name"
                          icon={<Zap className="w-4 h-4" />}
                        />
                      </div>
                    </FormSection>

                    <FormSection title="Targeting" icon={<Shield className="w-4 h-4" />}>
                      <div className="flex items-start gap-2 mb-6 px-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-400/80 font-medium leading-relaxed">
                          City and audience targeting aren't enforced by the backend yet — every ad shows to all users everywhere until that's built. These fields are for your own campaign notes for now.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 group/field">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select City</label>
                          <select
                            value={adFormData.city}
                            onChange={(e) => setAdFormData({ ...adFormData, city: e.target.value })}
                            className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                          >
                            <option value="all">All Cities</option>
                            {(Array.isArray(cities) ? cities : []).map((city: any) => (
                              <option key={city._id || city.id} value={city.city_name}>{city.city_name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-4 group/field">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select Audience</label>
                          <select
                            value={adFormData.audience}
                            onChange={(e) => setAdFormData({ ...adFormData, audience: e.target.value })}
                            className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                          >
                            <option value="all">All Users</option>
                            <option value="premium">Premium Only</option>
                            <option value="free">Free Users</option>
                          </select>
                        </div>
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {adStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                    <FormSection title="Ad Creative" icon={<Image className="w-4 h-4" />}>
                      <div className="space-y-8 text-center">
                        <label className="aspect-[16/9] w-full max-w-2xl mx-auto rounded-[40px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all group relative overflow-hidden shadow-inner">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setAdImageFile(file);
                              setAdFormData((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
                            }}
                          />
                          {adFormData.imageUrl ? (
                            <img src={adFormData.imageUrl} alt="Ad Content" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-all shadow-2xl">
                                <Upload className="w-10 h-10 text-white/20 group-hover:text-primary transition-colors" />
                              </div>
                              <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] block">Upload Image</span>
                                <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em]">Recommended: 1920x1080 | Required</span>
                              </div>
                            </>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </label>
                      </div>
                    </FormSection>

                    <FormSection title="Video Ad (Optional)" icon={<Video className="w-4 h-4" />}>
                      <div className="space-y-4 text-center">
                        <label className="w-full max-w-2xl mx-auto rounded-[32px] bg-[#09090B] border-2 border-dashed border-white/5 flex items-center justify-center gap-4 px-8 py-6 cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all group relative overflow-hidden">
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setAdVideoFile(file);
                              setAdFormData((prev) => ({ ...prev, videoUrl: URL.createObjectURL(file) }));
                            }}
                          />
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-all shrink-0">
                            <Video className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                          </div>
                          <div className="text-left">
                            <span className="text-[11px] font-black uppercase text-white/40 tracking-[0.2em] block">
                              {adVideoFile ? adVideoFile.name : 'Upload video (mp4, mov, webm)'}
                            </span>
                            <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em]">Shown instead of / alongside the image where supported</span>
                          </div>
                        </label>
                        {adVideoFile && (
                          <button
                            type="button"
                            onClick={() => { setAdVideoFile(null); setAdFormData((prev) => ({ ...prev, videoUrl: '' })); }}
                            className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300"
                          >
                            Remove video
                          </button>
                        )}
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {adStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                    <FormSection title="Destination" icon={<LinkIcon className="w-4 h-4" />}>
                      <RefinedField
                        label="Link URL (optional)"
                        name="linkUrl"
                        type="url"
                        value={adFormData.linkUrl}
                        onChange={(e: any) => setAdFormData({ ...adFormData, linkUrl: e.target.value })}
                        placeholder="https://example.com/promo"
                        icon={<LinkIcon className="w-4 h-4" />}
                      />
                      <p className="text-[10px] text-white/30 font-medium mt-2 ml-1">Tapping the ad opens this link. Leave blank for a non-clickable ad.</p>
                    </FormSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <FormSection title="Schedule" icon={<Clock className="w-4 h-4" />}>
                        <div className="space-y-8">
                          <RefinedField
                            label="Start Date"
                            name="startDate"
                            type="date"
                            value={adFormData.startDate}
                            onChange={(e: any) => setAdFormData({ ...adFormData, startDate: e.target.value })}
                            icon={<Calendar className="w-4 h-4" />}
                          />

                          <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Campaign Duration</label>
                              <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest group-hover/toggle:text-primary transition-colors">Run Until Paused</div>
                                <div className="relative w-10 h-5 bg-white/5 rounded-full border border-white/10 group-hover/toggle:border-primary/30 transition-all">
                                  <motion.div
                                    className={cn("absolute top-1 w-3 h-3 rounded-full transition-all", adFormData.untilPaused ? "right-1 bg-primary shadow-[0_0_10px_rgba(255,45,154,0.5)]" : "left-1 bg-white/20")}
                                    animate={{ left: adFormData.untilPaused ? 24 : 4 }}
                                  />
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={adFormData.untilPaused}
                                    onChange={(e) => setAdFormData({ ...adFormData, untilPaused: e.target.checked })}
                                  />
                                </div>
                              </label>
                            </div>

                            <AnimatePresence mode="wait">
                              {!adFormData.untilPaused && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <RefinedField
                                    label="End Date"
                                    name="endDate"
                                    type="date"
                                    value={adFormData.endDate}
                                    onChange={(e: any) => setAdFormData({ ...adFormData, endDate: e.target.value })}
                                    icon={<Calendar className="w-4 h-4" />}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </FormSection>

                      <FormSection title="Visual Validation" icon={<Eye className="w-4 h-4" />}>
                        <div className="space-y-8 flex flex-col items-center">
                          <div className="aspect-[9/16] w-full max-w-[200px] bg-[#0B0B0F] rounded-[48px] border-[8px] border-white/10 p-4 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative group/phone">
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-10">
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full aspect-[3/4] bg-primary/10 rounded-3xl border border-primary/30 flex items-center justify-center relative overflow-hidden group-hover/phone:shadow-[0_0_30px_rgba(255,45,154,0.2)] transition-all"
                              >
                                {adFormData.imageUrl ? (
                                  <img src={adFormData.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <p className="text-[8px] text-primary/40 font-black uppercase tracking-widest">Ad Canvas</p>
                                )}
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
                                  <X className="w-3 h-3 text-white/50" />
                                </div>
                              </motion.div>
                            </div>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-white/10"></div>
                          </div>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] text-center">Live System Preview</p>
                        </div>
                      </FormSection>
                    </div>
                  </motion.div>
                )}
              </div>

              {adSubmitError && (
                <div className="px-10 pt-4 flex items-center gap-2 text-red-400 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {adSubmitError}
                </div>
              )}

              <div className="p-10 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                <button
                  onClick={() => {
                    if (adStep > 1) {
                      setAdStep(adStep - 1);
                    } else {
                      setIsCreatingAd(false);
                      setAdStep(1);
                      setAdFormData({ name: '', city: 'all', audience: 'all', startDate: '', endDate: '', untilPaused: false, imageUrl: '', videoUrl: '', linkUrl: '' });
                      setAdImageFile(null);
                      setAdVideoFile(null);
                      setAdSubmitError('');
                    }
                  }}
                  className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {adStep > 1 ? 'Go Back' : 'Cancel'}
                </button>

                <button
                  onClick={() => {
                    setAdSubmitError('');
                    if (adStep < 3) {
                      setAdStep(adStep + 1);
                    } else {
                      createAdMutation.mutate();
                    }
                  }}
                  disabled={createAdMutation.isPending}
                  className="px-12 py-5 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,45,154,0.3)] hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group disabled:opacity-50 disabled:hover:scale-100"
                >
                  {createAdMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : (
                    <>{adStep < 3 ? 'Next Step' : 'Create Campaign'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <FeatureEventModal
        isOpen={isFeaturingEvent}
        onClose={() => setIsFeaturingEvent(false)}
        cities={cities || []}
        events={events || []}
        onConfirm={async (data) => {
          await featureEventMutation.mutateAsync(data);
        }}
      />
    </div>
  );
}
