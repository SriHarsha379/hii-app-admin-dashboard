import React, { useState, useRef } from 'react';
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
  AlertTriangle,
  Trash2,
  Lock,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { FilterDropdown } from '../components/FilterDropdown';
import RecommendationCard from '../components/RecommendationCard';

import { API_BASE } from '../lib/apiConfig';
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

// Format an ISO date string for a <input type="datetime-local"> value
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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

// ─── Delete Confirm Dialog ──────────────────────────────────────────────────

function DeleteConfirmDialog({ rec, onConfirm, onCancel, isDeleting }: { rec: any; onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
  const resource = rec.resource_id || {};
  const name = rec.type === 'event' ? resource.title : resource.name;
  const label = rec.title || name || 'this recommendation';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-md rounded-3xl border border-red-500/20 overflow-hidden shadow-2xl p-8 space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Delete Recommendation</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">
          Are you sure you want to delete <span className="text-white font-bold">"{label}"</span>? It will be removed from the app feed immediately.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Recommendations() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'active' | 'add' | 'preview'>('active');
  const [form, setForm] = useState<RecForm>(emptyForm());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['recommendations', filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      const res = await fetch(`${API_BASE}/recommendations?${params}`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      return res.json();
    },
  });

  const { data: preview, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['recommendations-preview'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/recommendations/preview`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      return res.json();
    },
    enabled: activeTab === 'preview',
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/cities`, { headers: { Authorization: `Bearer ${token}`} });
      return res.json();
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to create recommendation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-preview'] });
      setForm(emptyForm());
      setEditingId(null);
      setFormError('');
      setActiveTab('active');
    },
    onError: (err: any) => setFormError(err.message || 'Failed to create recommendation'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`${API_BASE}/recommendations/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to update recommendation');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-preview'] });
      // Only reset/close the form if this update came from the edit form
      // (not from a quick inline toggle-active click on the Active tab).
      if (editingId && variables.id === editingId) {
        setForm(emptyForm());
        setEditingId(null);
        setFormError('');
        setActiveTab('active');
      }
    },
    onError: (err: any) => setFormError(err.message || 'Failed to update recommendation'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/recommendations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error('Failed to delete recommendation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-preview'] });
      setDeleteTarget(null);
    },
  });

  // ── Resource search ────────────────────────────────────────────────────────
  // Fetched once per content-type and cached; the dropdown then just filters
  // that list in memory, so opening the field (even with an empty query)
  // can show every available event/club instead of requiring 2+ typed chars.

  const [allResources, setAllResources] = useState<any[]>([]);
  const [resourcesLoadedFor, setResourcesLoadedFor] = useState<'event' | 'club' | null>(null);
  const [isResourceDropdownOpen, setIsResourceDropdownOpen] = useState(false);
  const resourceDropdownRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resourceDropdownRef.current && !resourceDropdownRef.current.contains(e.target as Node)) {
        setIsResourceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadResourcesForType = async (type: 'event' | 'club') => {
    setIsSearching(true);
    try {
      const endpoint = type === 'event' ? `${API_BASE}/events/list` : `${API_BASE}/vendor/get_all_vendors`;
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}`} });
      const data = await res.json();
      setAllResources(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
      setResourcesLoadedFor(type);
    } catch {
      setAllResources([]);
    } finally {
      setIsSearching(false);
    }
  };

  const filterResources = (q: string) => {
    const label = (item: any) => (form.type === 'event' ? item.title : item.name);
    // Some documents (e.g. inserted directly into MongoDB, bypassing schema
    // validation) may be missing a title/name. Exclude them from the picker
    // rather than rendering an unlabeled, effectively unusable row.
    const withLabel = allResources.filter((item: any) => !!label(item)?.trim());
    const list = q
      ? withLabel.filter((item: any) => label(item)!.toLowerCase().includes(q.toLowerCase()))
      : withLabel;
    setSearchResults(list.slice(0, 20));
  };

  const handleResourceFocus = async () => {
    setIsResourceDropdownOpen(true);
    if (resourcesLoadedFor !== form.type) {
      await loadResourcesForType(form.type);
    }
    filterResources(searchQuery);
  };

  const handleResourceSearch = (q: string) => {
    setSearchQuery(q);
    if (resourcesLoadedFor !== form.type) return; // still loading, filter runs after load completes
    filterResources(q);
  };

  const selectResource = (item: any) => {
    const label = form.type === 'event' ? item.title : item.name;
    setForm((f) => ({ ...f, resource_id: item._id, resource_label: label }));
    setSearchQuery(label);
    setSearchResults([]);
    setIsResourceDropdownOpen(false);
  };

  // Re-filter (and re-fetch if the type changed) whenever the query or type updates
  React.useEffect(() => {
    if (resourcesLoadedFor === form.type) {
      filterResources(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, form.type, allResources]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.resource_id) return;

    if (editingId) {
      // PATCH only accepts these fields — type/resource_id can't be changed once created.
      const payload = {
        title: form.title,
        priority: Number.isFinite(Number(form.priority)) ? Number(form.priority) : 0,
        target_city: form.target_city || null,
        target_gender: form.target_gender || null,
        target_crowd_type: form.target_crowd_type || null,
        active: form.active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      const payload = {
        type: form.type,
        resource_id: form.resource_id,
        title: form.title,
        priority: Number.isFinite(Number(form.priority)) ? Number(form.priority) : 0,
        target_city: form.target_city || null,
        target_gender: form.target_gender || null,
        target_crowd_type: form.target_crowd_type || null,
        active: form.active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      createMutation.mutate(payload);
    }
  };

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setSearchQuery('');
    setSearchResults([]);
    setFormError('');
    setActiveTab('add');
  };

  const openEdit = (rec: any) => {
    const resource = rec.resource_id || {};
    const label = rec.type === 'event' ? resource.title : resource.name;
    setForm({
      type: rec.type,
      resource_id: resource._id || (typeof rec.resource_id === 'string' ? rec.resource_id : ''),
      resource_label: label || '',
      title: rec.title || '',
      priority: rec.priority ?? 0,
      target_city: rec.target_city || '',
      target_gender: rec.target_gender || '',
      target_crowd_type: rec.target_crowd_type || '',
      active: rec.active ?? true,
      starts_at: toLocalInput(rec.starts_at),
      ends_at: toLocalInput(rec.ends_at),
    });
    setEditingId(rec._id);
    setSearchQuery(label || '');
    setSearchResults([]);
    setFormError('');
    setActiveTab('add');
  };

  const cancelForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFormError('');
    setActiveTab('active');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
    } catch {
      // error state could be surfaced here if desired; dialog stays open on failure
    } finally {
      setIsDeleting(false);
    }
  };

  const recList = Array.isArray(recommendations) ? recommendations : [];
  const previewList = Array.isArray(preview) ? preview : [];
  const cityOptions = Array.isArray(cities)
    ? cities.map((c: any) => ({ label: c.name, value: c.name }))
    : [];

  const tabs = [
    { id: 'active', label: 'Active', icon: LayoutList },
    { id: 'add',    label: isSuperAdmin ? (editingId ? 'Edit' : 'Add New') : 'Details', icon: Plus },
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
            onClick={() => {
              if (id === 'active' || id === 'preview') {
                // leaving the edit form without saving — reset it
                if (activeTab === 'add') { setEditingId(null); setForm(emptyForm()); setFormError(''); }
              }
              setActiveTab(id);
            }}
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
      {/* AnimatePresence mode="wait" needs to see a single child swap, not three
          sibling `{cond && <motion.div key=.../>}` blocks in its children array.
          With the old structure the exit animation for the outgoing tab could
          get stuck (no WAAPI support in some environments, or the diff not
          resolving) and the incoming tab's content never mounted — the page
          just went blank after clicking "Add Recommendation". A single
          ternary guarantees AnimatePresence always tracks exactly one child. */}
      <AnimatePresence mode="wait">
        {activeTab === 'active' ? (
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
                    onDelete={() => setDeleteTarget(rec)}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'add' ? (
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
                  {editingId ? (
                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-white/60">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Type and linked {form.type} can't be changed after creation. Delete and re-add to point at a different {form.type}.
                      </span>
                    </div>
                  ) : (
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
                  )}
                </FormSection>

                <FormSection
                  title="Select Resource"
                  icon={<Search className="w-4 h-4" />}
                >
                  {editingId ? (
                    <div className="flex items-center gap-3 px-6 py-5 bg-[#09090B] border border-white/5 rounded-[24px] text-white/70">
                      {form.type === 'event' ? (
                        <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="text-sm font-bold truncate">{form.resource_label || 'Unknown resource'}</span>
                    </div>
                  ) : (
                    <div className="relative" ref={resourceDropdownRef}>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                          type="text"
                          placeholder={`Search ${form.type}s… or click to browse all`}
                          value={searchQuery}
                          onFocus={handleResourceFocus}
                          onChange={(e) => handleResourceSearch(e.target.value)}
                          className="w-full bg-[#09090B] border border-white/5 rounded-[24px] py-6 pl-14 pr-8 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 placeholder:text-white/10"
                        />
                        {isSearching && (
                          <Loader2 className="w-4 h-4 animate-spin absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        )}
                      </div>
                      <AnimatePresence>
                        {isResourceDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto custom-scrollbar"
                          >
                            {isSearching ? (
                              <div className="px-4 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading {form.type}s…
                              </div>
                            ) : searchResults.length === 0 ? (
                              <div className="px-4 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {searchQuery ? `No ${form.type}s match "${searchQuery}"` : `No ${form.type}s found`}
                              </div>
                            ) : (
                              searchResults.map((item: any) => {
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
                              })
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {!editingId && form.resource_id && (
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
                      onChange={(e: any) => {
                        const v = e.target.value;
                        setForm((f) => ({ ...f, priority: v === '' ? 0 : Number(v) }));
                      }}
                    />
                    {/* Active toggle */}
                    <div className="flex items-center justify-between px-8 py-6 bg-[#09090B] border border-white/5 rounded-[24px]">
                      <span className="text-sm text-white/60 font-bold uppercase tracking-widest text-[10px]">
                        Active
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={form.active}
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

                {formError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}

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
                    onClick={cancelForm}
                    className="px-6 py-4 rounded-2xl border border-white/10 text-muted-foreground text-[11px] font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        ) : activeTab === 'preview' ? (
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
        ) : null}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmDialog
            rec={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}