import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Loader2, MapPin, Music, Calendar, Building2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { cn, apiErrorMessage } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';

import { API_BASE } from '../lib/apiConfig';

// ─────────────────────────────────────────────────────────────────────────
// This page previously POSTed to made-up endpoints like `${API_BASE}/cities`,
// `${API_BASE}/genres`, `${API_BASE}/eventTypes`, `${API_BASE}/venueTypes` —
// none of which exist on the backend, so "+ Add" always silently 404'd.
// The real endpoints/fields per tab are:
//   Cities      → GET  /city/get_all_cities   POST /city/create_city
//                 (multipart: city_name, state_id, latitude, longitude)
//   Music Genre → GET  /genre/get_all_genres  POST /genre/add_genre
//                 (multipart: name, optional description/image)
//   Event Types → GET  /category/get_category POST /category/add_category
//                 (json: category_name, category_type: 1)
//   Venue Types → same /category endpoints, category_type: 2
// Categories share one endpoint for both Event/Venue types, filtered by
// category_type (1 = Event, 2 = Venue) client-side.
// ─────────────────────────────────────────────────────────────────────────

type TabId = 'cities' | 'genres' | 'eventTypes' | 'venueTypes';

const TAB_CONFIG: Record<TabId, {
  listUrl: string;
  createUrl: string;
  deleteUrl: (id: string) => string;
  toggleUrl?: (id: string) => string;
  nameField: string;
  categoryType?: number;
}> = {
  cities: {
    // Shows ALL cities (active + inactive) — the whole point of this tab is
    // to let the admin control which cities are active for the rest of the
    // app's filters, so it needs to include inactive ones too or there'd be
    // no way to see/reactivate a deactivated city.
    listUrl: `${API_BASE}/city/get_all_cities?include_inactive=true`,
    createUrl: `${API_BASE}/city/create_city`,
    deleteUrl: (id) => `${API_BASE}/city/delete_city/${id}`,
    toggleUrl: (id) => `${API_BASE}/city/toggle_status/${id}`,
    nameField: 'city_name',
  },
  genres: {
    listUrl: `${API_BASE}/genre/get_all_genres`,
    createUrl: `${API_BASE}/genre/add_genre`,
    deleteUrl: (id) => `${API_BASE}/genre/delete_genre/${id}`,
    nameField: 'name',
  },
  eventTypes: {
    listUrl: `${API_BASE}/category/get_category`,
    createUrl: `${API_BASE}/category/add_category`,
    deleteUrl: (id) => `${API_BASE}/category/delete_category/${id}`,
    nameField: 'category_name',
    categoryType: 1,
  },
  venueTypes: {
    listUrl: `${API_BASE}/category/get_category`,
    createUrl: `${API_BASE}/category/add_category`,
    deleteUrl: (id) => `${API_BASE}/category/delete_category/${id}`,
    nameField: 'category_name',
    categoryType: 2,
  },
};

export default function ManageFilters() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('cities');
  const [newItemName, setNewItemName] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [statusView, setStatusView] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [newItemState, setNewItemState] = useState('');
  const [newItemLat, setNewItemLat] = useState('');
  const [newItemLng, setNewItemLng] = useState('');
  const [formError, setFormError] = useState('');

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'cities', label: 'Cities', icon: MapPin },
    { id: 'genres', label: 'Music Genres', icon: Music },
    { id: 'eventTypes', label: 'Event Types', icon: Calendar },
    { id: 'venueTypes', label: 'Venue Types', icon: Building2 },
  ];

  const config = TAB_CONFIG[activeTab];

  const { data: items, isLoading } = useQuery({
    queryKey: ['manage-filters', activeTab],
    queryFn: async () => {
      const res = await fetch(config.listUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const list = Array.isArray(json?.data) ? json.data : [];
      const sorted = list.slice().sort((a: any, b: any) => (a[config.nameField] || '').localeCompare(b[config.nameField] || ''));
      // Categories power both Event Types and Venue Types tabs from the
      // same list — split by category_type client-side.
      if (activeTab === 'eventTypes' || activeTab === 'venueTypes') {
        return sorted.filter((c: any) => c.category_type === config.categoryType);
      }
      return sorted;
    },
  });

  // Cities need a State to belong to — fetch the list for the dropdown.
  // Only needed while the Cities tab is open.
  const { data: states } = useQuery({
    queryKey: ['states-for-manage-filters'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/state/get_all_states`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return Array.isArray(json?.data) ? json.data : [];
    },
    enabled: activeTab === 'cities',
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const name = newItemName.trim();
      let res: Response;

      if (activeTab === 'cities') {
        if (!newItemState) throw new Error('Select a state first');
        const body = new FormData();
        body.append('city_name', name);
        body.append('state_id', newItemState);
        body.append('latitude', newItemLat || '0');
        body.append('longitude', newItemLng || '0');
        res = await fetch(config.createUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        });
      } else if (activeTab === 'genres') {
        const body = new FormData();
        body.append('name', name);
        res = await fetch(config.createUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        });
      } else {
        // eventTypes / venueTypes → Category
        res = await fetch(config.createUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ category_name: name, category_type: config.categoryType }),
        });
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(apiErrorMessage(json, 'Failed to add item'));
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-filters', activeTab] });
      setNewItemName('');
      setNewItemState('');
      setNewItemLat('');
      setNewItemLng('');
      setFormError('');
    },
    onError: (err: any) => setFormError(err.message || 'Failed to add item'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(config.deleteUrl(id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-filters', activeTab] });
    },
  });

  // Cities-only: activate/deactivate without deleting. This is what should
  // be used to curate which cities show up in Featured Events / Events /
  // Venues filters (only active cities show there) — Delete is destructive
  // and removes the city entirely, which usually isn't what's wanted here.
  const toggleItemMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!config.toggleUrl) throw new Error('Toggle not supported for this tab');
      const res = await fetch(config.toggleUrl(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-filters', activeTab] });
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (newItemName.trim()) {
      addItemMutation.mutate();
    }
  };

  const stateOptions = (Array.isArray(states) ? states : []).map((s: any) => ({
    label: s.state_name,
    value: s._id,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-white tracking-tight uppercase">Manage <span className="text-primary neon-text">Filters</span></h2>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-white/5 hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFormError(''); }}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(255,45,154,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`Add new ${tabs.find(t => t.id === activeTab)?.label.slice(0, -1).toLowerCase()}...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
              />

              {activeTab === 'cities' && (
                <div className="w-full sm:w-48">
                  <FilterDropdown
                    value={newItemState}
                    onChange={setNewItemState}
                    options={stateOptions}
                    placeholder="Select state..."
                    buttonClassName="py-3 px-4 rounded-xl text-sm h-full"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!newItemName.trim() || addItemMutation.isPending || (activeTab === 'cities' && !newItemState)}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>

            {activeTab === 'cities' && (
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="number"
                  step="any"
                  value={newItemLat}
                  onChange={(e) => setNewItemLat(e.target.value)}
                  placeholder="Latitude (optional)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                />
                <input
                  type="number"
                  step="any"
                  value={newItemLng}
                  onChange={(e) => setNewItemLng(e.target.value)}
                  placeholder="Longitude (optional)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                />
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}
          </form>

          {/* Search + status filter + summary — was a single unfiltered
              alphabetical grid of every item (100+ for Cities), making it
              genuinely hard to tell "is this actually restricted to just 4
              cities?" without scrolling through the whole list. Now you can
              filter to "Active" alone to see exactly what's live at a glance,
              and the count up top confirms it without any scrolling. */}
          {activeTab === 'cities' && Array.isArray(items) && items.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 -mt-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search cities..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((v) => {
                  const count = v === 'ALL' ? items.length : items.filter((i: any) => (v === 'ACTIVE' ? i.is_active : !i.is_active)).length;
                  return (
                    <button
                      key={v}
                      onClick={() => setStatusView(v)}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                        statusView === v ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'
                      )}
                    >
                      {v === 'ALL' ? 'All' : v === 'ACTIVE' ? 'Active' : 'Inactive'} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(() => {
              const visibleItems = activeTab === 'cities'
                ? (Array.isArray(items) ? items : [])
                    .filter((item: any) => statusView === 'ALL' || (statusView === 'ACTIVE' ? item.is_active : !item.is_active))
                    .filter((item: any) => item[config.nameField]?.toLowerCase().includes(itemSearch.toLowerCase()))
                : items;

              if (isLoading) {
                return (
                  <div className="col-span-full py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                );
              }
              if (!visibleItems || visibleItems.length === 0) {
                return (
                  <div className="col-span-full py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-none">
                    {activeTab === 'cities' && (itemSearch || statusView !== 'ALL') ? 'No cities match this search/filter.' : 'No items found. Add one above.'}
                  </div>
                );
              }
              return visibleItems.map((item: any) => (
                <div key={item._id || item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-bold text-white truncate min-w-0 flex-1">{item[config.nameField]}</span>
                    {activeTab === 'cities' && (
                      <span className={cn(
                        'shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border',
                        item.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      )}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {activeTab === 'cities' && (
                      <button
                        onClick={() => toggleItemMutation.mutate(item._id || item.id)}
                        disabled={toggleItemMutation.isPending}
                        title={item.is_active ? 'Deactivate (hide from Events/Venues/Ads filters)' : 'Activate (show in Events/Venues/Ads filters)'}
                        className={cn(
                          'p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50',
                          item.is_active ? 'hover:bg-zinc-500/20 text-muted-foreground hover:text-zinc-300' : 'hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400'
                        )}
                      >
                        {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => deleteItemMutation.mutate(item._id || item.id)}
                      disabled={deleteItemMutation.isPending}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}