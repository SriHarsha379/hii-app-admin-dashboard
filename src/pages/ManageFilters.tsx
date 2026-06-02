import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Loader2, MapPin, Music, Calendar, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ManageFilters() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('cities');
  const [newItemName, setNewItemName] = useState('');

  const tabs = [
    { id: 'cities', label: 'Cities', icon: MapPin },
    { id: 'genres', label: 'Music Genres', icon: Music },
    { id: 'eventTypes', label: 'Event Types', icon: Calendar },
    { id: 'venueTypes', label: 'Venue Types', icon: Building2 },
  ];

  const { data: items, isLoading } = useQuery({
    queryKey: [activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/${activeTab}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Failed to add item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab] });
      setNewItemName('');
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab] });
    }
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      addItemMutation.mutate(newItemName.trim());
    }
  };

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
              onClick={() => setActiveTab(tab.id)}
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
          <form onSubmit={handleAddItem} className="flex gap-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Add new ${tabs.find(t => t.id === activeTab)?.label.slice(0, -1).toLowerCase()}...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={!newItemName.trim() || addItemMutation.isPending}
              className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="col-span-full py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : items?.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-none">
                No items found. Add one above.
              </div>
            ) : (
              items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
                  <span className="text-sm font-bold text-white">{item.name}</span>
                  <button
                    onClick={() => deleteItemMutation.mutate(item.id)}
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
