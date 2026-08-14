import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Loader2, MapPin, Music, Calendar, Building2, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
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
  nameField: string;
  categoryType?: number;
}> = {
  cities: {
    listUrl: `${API_BASE}/city/get_all_cities`,
    createUrl: `${API_BASE}/city/create_city`,
    deleteUrl: (id) => `${API_BASE}/city/delete_city/${id}`,
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
      // Categories power both Event Types and Venue Types tabs from the
      // same list — split by category_type client-side.
      if (activeTab === 'eventTypes' || activeTab === 'venueTypes') {
        return list.filter((c: any) => c.category_type === config.categoryType);
      }
      return list;
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
        throw new Error(json?.message?.[0] || json?.message || 'Failed to add item');
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="col-span-full py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !items || items.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-none">
                No items found. Add one above.
              </div>
            ) : (
              items.map((item: any) => (
                <div key={item._id || item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
                  <span className="text-sm font-bold text-white">{item[config.nameField]}</span>
                  <button
                    onClick={() => deleteItemMutation.mutate(item._id || item.id)}
                    disabled={deleteItemMutation.isPending}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}