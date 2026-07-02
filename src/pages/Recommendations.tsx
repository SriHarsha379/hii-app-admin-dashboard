import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Plus,
  Search,
  Calendar,
  Building2,
  MapPin,
  X,
  Loader2,
  Eye,
  LayoutList,
  Check,
  ChevronDown,
  Phone,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { FilterDropdown } from '../components/FilterDropdown';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import RecommendationCard from '../components/RecommendationCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecForm {
  type: 'event' | 'club';
  resource_id: string;
  resource_label: string;
  title: string;
  priority: number;
  target_city: string;
  target_gender: string;
  target_crowd_type: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
}

const emptyForm = (): RecForm => ({
  type: 'event',
  resource_id: '',
  resource_label: '',
  title: '',
  priority: 0,
  target_city: '',
  target_gender: '',
  target_crowd_type: '',
  active: true,
  starts_at: '',
  ends_at: '',
});

const CROWD_TYPES = [
  'College Crowd', 'Corporate', 'Mixed', 'Party Animals', 'Sophisticated', 'Young Adults',
];

const GENDERS = ['All', 'Male', 'Female', 'Non-Binary'];

// ─── Phone Preview Card ───────────────────────────────────────────────────────

function PhonePreviewCard({ rec }: { rec: any }) {
  const resource = rec.resource_id || {};
  const name = rec.type === 'event' ? resource.title : resource.name;
  const city = resource.city || '';
  const poster = rec.type === 'event' ? resource.poster_url : resource.portrait_url;
  const displayTitle = rec.title || name || 'Untitled';

  return (
    <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 flex flex-col">
      <div className="h-32 bg-gradient-to-br from-primary/20 to-purple-600/20 relative overflow-hidden">
        {poster ? (
          <img src={poster} alt={displayTitle} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {rec.type === 'event' ? (
              <Calendar className="w-8 h-8 text-white/20" />
            ) : (
              <Building2 className="w-8 h-8 text-white/20" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span
          className={cn(
            'absolute top-2 left-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
            rec.type === 'event'
              ? 'bg-purple-500/80 text-white'
              : 'bg-amber-500/80 text-white'
          )}
        >
          {rec.type}
        </span>
      </div>
      <div className="p-3">
        <p className="text-[11px] font-black text-white truncate">{displayTitle}</p>
        {city && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">{city}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Recommendations() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'active' | 'add' | 'preview'>('active');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [form, setForm] = useState<RecForm>(emptyForm());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['recommendations', filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/recommendations?${params}`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      return res.json();
    },
  });

  const { data: preview, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['recommendations-preview'],
    queryFn: async () => {
      const res = await fetch('/api/recommendations/preview', {
        headers: { Authorization: `Bearer ${token}`},
      });
      return res.json();
    },
    enabled: activeTab === 'preview',
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch('/api/cities', { headers: { Authorization: `Bearer ${token}`} });
      return res.json();
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-preview'] });
      setIsPanelOpen(false);
      setForm(emptyForm());
      setEditingId(null);
      setActiveTab('active');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-preview'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-preview'] });
    },
  });

  // ── Resource search ────────────────────────────────────────────────────────

  const handleResourceSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const endpoint = form.type === 'event' ? '/api/events' : '/api/clubs';
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}`} });
      const data = await res.json();
      const filtered = Array.isArray(data)
        ? data.filter((item: any) => {
            const label = form.type === 'event' ? item.title : item.name;
            return label?.toLowerCase().includes(q.toLowerCase());
          }).slice(0, 8)
        : [];
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const selectResource = (item: any) => {
    const label = form.type === 'event' ? item.title : item.name;
    setForm((f) => ({ ...f, resource_id: item._id, resource_label: label }));
    setSearchQuery(label);
    setSearchResults([]);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.resource_id) return;
    const payload = {
      type: form.type,
      resource_id: form.resource_id,
      title: form.title,
      priority: Number(form.priority),
      target_city: form.target_city || null,
      target_gender: form.target_gender || null,
      target_crowd_type: form.target_crowd_type || null,
      active: form.active,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsPanelOpen(true);
    setActiveTab('add');
  };

  const recList = Array.isArray(recommendations) ? recommendations : [];
  const previewList = Array.isArray(preview) ? preview : [];
  const cityOptions = Array.isArray(cities)
    ? cities.map((c: any) => ({ label: c.name, value: c.name }))
    : [];

  const tabs = [
    { id: 'active', label: 'Active', icon: LayoutList },
    { id: 'add',    label: isSuperAdmin ? 'Add New' : 'Details', icon: Plus },
    { id: 'preview', label: 'Preview', icon: Eye },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
            Recommendations
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            Curate and push content to app users
          </div>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Recommendation
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
              activeTab === id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Active ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <FilterDropdown
                label="Type"
                value={filterType}
                options={[
                  { label: 'All Types', value: '' },
                  { label: 'Events', value: 'event' },
                  { label: 'Clubs', value: 'club' },
                ]}
                onChange={setFilterType}
              />
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {recList.length} recommendation{recList.length !== 1 ? 's' : ''}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : recList.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-black text-white uppercase tracking-widest">
                  No recommendations yet
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                  {isSuperAdmin ? 'Click "Add Recommendation" to get started' : 'No items to display'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recList.map((rec: any) => (
                  <RecommendationCard
                    key={rec._id}
                    rec={rec}
                    isSuperAdmin={isSuperAdmin}
                    onToggleActive={(id, active) => updateMutation.mutate({ id, data: { active } })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: Add / Edit ──────────────────────────────────────────────────── */}
        {activeTab === 'add' && (
          <motion.div
            key="add"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {!isSuperAdmin ? (
              <div className="text-center py-20">
                <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-black text-white uppercase tracking-widest">
                  Read-only access
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                  Only Super Admins can add or edit recommendations
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
                <FormSection
                  title="Content Type"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  <div className="grid grid-cols-2 gap-4">
                    {(['event', 'club'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, type: t, resource_id: '', resource_label: '' }));
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-2xl border transition-all',
                          form.type === t
                            ? 'border-primary/50 bg-primary/10 text-white'
                            : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:text-white'
                        )}
                      >
                        {t === 'event' ? (
                          <Calendar className="w-5 h-5" />
                        ) : (
                          <Building2 className="w-5 h-5" />
                        )}
                        <span className="text-[11px] font-black uppercase tracking-widest capitalize">
                          {t}
                        </span>
                        {form.type === t && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                      </button>
                    ))}
                  </div>
                </FormSection>

                <FormSection
                  title="Select Resource"
                  icon={<Search className="w-4 h-4" />}
                >
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                      <input
                        type="text"
                        placeholder={`Search ${form.type}s…`}
                        value={searchQuery}
                        onChange={(e) => handleResourceSearch(e.target.value)}
                        className="w-full bg-[#09090B] border border-white/5 rounded-[24px] py-6 pl-14 pr-8 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 placeholder:text-white/10"
                      />
                      {isSearching && (
                        <Loader2 className="w-4 h-4 animate-spin absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      )}
                    </div>
                    <AnimatePresence>
                      {searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                          {searchResults.map((item: any) => {
                            const label = form.type === 'event' ? item.title : item.name;
                            return (
                              <button
                                key={item._id}
                                type="button"
                                onClick={() => selectResource(item)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                  {form.type === 'event' ? (
                                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                  ) : (
                                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{label}</p>
                                  {item.city && (
                                    <p className="text-[9px] text-muted-foreground">{item.city}</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {form.resource_id && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                      <Check className="w-3 h-3" /> Selected: {form.resource_label}
                    </div>
                  )}
                </FormSection>

                <FormSection
                  title="Display Options"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  <div className="space-y-6">
                    <RefinedField
                      label="Title Override (optional)"
                      name="title"
                      placeholder="Leave blank to use resource name"
                      value={form.title}
                      onChange={(e: any) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                    <RefinedField
                      label="Priority (lower = higher rank)"
                      name="priority"
                      type="number"
                      placeholder="0"
                      value={form.priority}
                      onChange={(e: any) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                    />
                    {/* Active toggle */}
                    <div className="flex items-center justify-between px-8 py-6 bg-[#09090B] border border-white/5 rounded-[24px]">
                      <span className="text-sm text-white/60 font-bold uppercase tracking-widest text-[10px]">
                        Active
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                        className={cn(
                          'w-12 h-7 rounded-full flex items-center transition-all',
                          form.active ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start'
                        )}
                      >
                        <div className="w-5 h-5 rounded-full bg-white shadow-md mx-1" />
                      </button>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Audience Targeting"
                  icon={<MapPin className="w-4 h-4" />}
                >
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                        Target City
                      </label>
                      <FilterDropdown
                        label="Any City"
                        value={form.target_city}
                        options={[
                          { label: 'Any City', value: '' },
                          ...cityOptions,
                        ]}
                        onChange={(v: string) => setForm((f) => ({ ...f, target_city: v }))}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                        Target Gender
                      </label>
                      <FilterDropdown
                        label="Any Gender"
                        value={form.target_gender}
                        options={[
                          { label: 'Any Gender', value: '' },
                          ...GENDERS.map((g) => ({ label: g, value: g })),
                        ]}
                        onChange={(v: string) => setForm((f) => ({ ...f, target_gender: v }))}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                        Crowd Type
                      </label>
                      <FilterDropdown
                        label="Any Crowd"
                        value={form.target_crowd_type}
                        options={[
                          { label: 'Any Crowd', value: '' },
                          ...CROWD_TYPES.map((c) => ({ label: c, value: c })),
                        ]}
                        onChange={(v: string) => setForm((f) => ({ ...f, target_crowd_type: v }))}
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Schedule Window"
                  icon={<Calendar className="w-4 h-4" />}
                >
                  <div className="grid grid-cols-2 gap-6">
                    <RefinedField
                      label="Starts At"
                      name="starts_at"
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(e: any) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                    />
                    <RefinedField
                      label="Ends At"
                      name="ends_at"
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(e: any) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                    />
                  </div>
                </FormSection>

                <div className="flex items-center gap-4 pb-8">
                  <button
                    type="submit"
                    disabled={!form.resource_id || createMutation.isPending || updateMutation.isPending}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {editingId ? 'Save Changes' : 'Add Recommendation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForm(emptyForm()); setEditingId(null); setActiveTab('active'); }}
                    className="px-6 py-4 rounded-2xl border border-white/10 text-muted-foreground text-[11px] font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {/* ── Tab: Preview ──────────────────────────────────────────────────────── */}
        {activeTab === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
              <Eye className="w-3 h-3" />
              Simulated mobile app feed — active & scheduled recommendations only
            </div>

            {isPreviewLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex gap-8 items-start justify-center">
                {/* Phone shell */}
                <div className="w-[360px] shrink-0">
                  <div className="relative bg-[#0a0a0a] rounded-[3rem] border-4 border-white/10 shadow-2xl overflow-hidden">
                    {/* Status bar */}
                    <div className="h-10 bg-black/50 flex items-center justify-between px-6">
                      <span className="text-[9px] font-bold text-white/50">9:41</span>
                      <div className="w-20 h-4 bg-black rounded-full mx-auto" />
                      <div className="flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-white/50" />
                        <span className="text-[9px] font-bold text-white/50">100%</span>
                      </div>
                    </div>

                    {/* App header */}
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-widest">For You</p>
                        <p className="text-[9px] text-muted-foreground">Recommended picks</p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    {/* Feed */}
                    <div className="px-4 pb-6 space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                      {previewList.length === 0 ? (
                        <div className="text-center py-12">
                          <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            No active recommendations
                          </p>
                        </div>
                      ) : (
                        previewList.map((rec: any) => (
                          <PhonePreviewCard key={rec._id} rec={rec} />
                        ))
                      )}
                    </div>

                    {/* Home indicator */}
                    <div className="h-6 flex items-center justify-center">
                      <div className="w-24 h-1 bg-white/20 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-4 pt-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                    {previewList.length} item{previewList.length !== 1 ? 's' : ''} showing
                  </p>
                  {previewList.map((rec: any, i: number) => {
                    const resource = rec.resource_id || {};
                    const name = rec.type === 'event' ? resource.title : resource.name;
                    return (
                      <div key={rec._id} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[10px] font-bold text-white">{rec.title || name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase">
                            {rec.type} · priority {rec.priority}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
