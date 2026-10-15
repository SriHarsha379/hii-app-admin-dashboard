import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Upload, Plus, Trash2, Image as ImageIcon, MapPin, Loader2, Check } from 'lucide-react';
import { cn, apiErrorMessage } from '../lib/utils';
import { LocationPicker } from './LocationPicker';
import { API_BASE } from '../lib/apiConfig';

const UPLOADS_BASE = API_BASE.replace(/\/api\/v1\/admin\/?$/, '/uploads');
const assetUrl = (f?: string | null) => {
  if (!f) return '';
  if (/^https?:\/\//i.test(f)) return f;
  return `${UPLOADS_BASE}/${f}`;
};

export default function ClubVenueMedia() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState('');
  const [keptGallery, setKeptGallery] = useState<string[]>([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState({ address: '', latitude: '', longitude: '' });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: vendors } = useQuery({
    queryKey: ['cvm-vendors'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: Boolean(token),
  });

  const { data: venues } = useQuery({
    queryKey: ['cvm-venues'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/venue/get_all_venues`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: Boolean(token),
  });

  const myVendor = Array.isArray(vendors) ? vendors.find((v: any) => v.name === user?.organisation) : null;
  const venue = (Array.isArray(venues) ? venues : []).find((v: any) => {
    const vid = typeof v.vendor_id === 'object' ? v.vendor_id?._id : v.vendor_id;
    return myVendor && vid === myVendor._id;
  }) || null;

  useEffect(() => {
    if (!venue) return;
    setPortraitPreview(venue.venue_image ? assetUrl(venue.venue_image) : '');
    setKeptGallery(Array.isArray(venue.gallery_images) ? venue.gallery_images : []);
    setLocation({
      address: venue.address || '',
      latitude: venue.latitude != null ? String(venue.latitude) : '',
      longitude: venue.longitude != null ? String(venue.longitude) : '',
    });
  }, [venue?._id]);

  const handlePortrait = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPortraitFile(f);
    setPortraitPreview(URL.createObjectURL(f));
  };

  const addGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNewGalleryFiles((p) => [...p, f]);
    setNewGalleryPreviews((p) => [...p, URL.createObjectURL(f)]);
    e.target.value = '';
  };

  const removeKept = (i: number) => setKeptGallery((p) => p.filter((_, idx) => idx !== i));
  const removeNew = (i: number) => {
    setNewGalleryFiles((p) => p.filter((_, idx) => idx !== i));
    setNewGalleryPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!venue?._id) throw new Error('No venue is set up for your account yet - ask a Super Admin to create your venue first.');
      const body = new FormData();
      if (portraitFile) body.append('venue_image', portraitFile);
      body.append('existing_gallery_images', JSON.stringify(keptGallery));
      newGalleryFiles.forEach((f) => body.append('gallery_images', f));
      body.append('address', location.address || '');
      if (location.latitude) body.append('latitude', String(location.latitude));
      if (location.longitude) body.append('longitude', String(location.longitude));
      const res = await fetch(`${API_BASE}/venue/update_venue/${venue._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(apiErrorMessage(json, 'Failed to save venue media'));
      return json;
    },
    onSuccess: () => {
      setPortraitFile(null);
      setNewGalleryFiles([]); setNewGalleryPreviews([]);
      queryClient.invalidateQueries({ queryKey: ['cvm-venues'] });
      queryClient.invalidateQueries({ queryKey: ['clubs-admin'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: any) => setError(e.message || 'Failed to save'),
  });

  return (
    <div className="glass-card rounded-[48px] border border-white/5 p-10 lg:p-16 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none opacity-50" />
      <div className="relative z-10 space-y-12">
        <div className="flex items-center gap-3 border-b border-white/5 pb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Venue Media & Location</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Profile photo, gallery, and map location</p>
          </div>
        </div>

        {!venue ? (
          <div className="p-10 rounded-[32px] bg-amber-500/5 border border-amber-500/20 text-amber-200/80 text-sm font-medium">
            No venue is set up for your account yet. Once a Super Admin creates your venue, you'll be able to add a profile photo, gallery, and map location here.
          </div>
        ) : (
          <>
            <div className="space-y-6">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block">Profile Photo</label>
              <label className="aspect-[9/16] max-w-[220px] rounded-[32px] bg-[#09090B] border-2 border-dashed border-white/5 overflow-hidden group relative cursor-pointer hover:border-primary/40 transition-all block">
                <input type="file" accept="image/*" className="hidden" onChange={handlePortrait} />
                {portraitPreview ? (
                  <>
                    <img src={portraitPreview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 group-hover:text-primary transition-colors">
                    <Upload className="w-10 h-10" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Upload Photo</span>
                  </div>
                )}
              </label>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block">Gallery</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {keptGallery.map((f, i) => (
                  <div key={`k-${i}`} className="relative aspect-video rounded-[24px] overflow-hidden border border-white/5 group">
                    <img src={assetUrl(f)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeKept(i)} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/70 border border-white/10 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {newGalleryPreviews.map((src, i) => (
                  <div key={`n-${i}`} className="relative aspect-video rounded-[24px] overflow-hidden border border-primary/30 group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/80 text-white">New</span>
                    <button type="button" onClick={() => removeNew(i)} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/70 border border-white/10 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="aspect-video rounded-[24px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-2 text-white/10 hover:text-primary hover:border-primary/40 transition-all cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={addGalleryFile} />
                  <Plus className="w-7 h-7" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Add Image</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Exact Location
              </label>
              <LocationPicker
                value={{ address: location.address, latitude: location.latitude, longitude: location.longitude }}
                onChange={(loc: any) => setLocation({ address: loc.address, latitude: loc.latitude, longitude: loc.longitude })}
                placeholder="Search address or place..."
              />
            </div>

            {error && <p className="text-xs text-red-400 font-bold">{error}</p>}

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={() => { setError(''); saveMutation.mutate(); }}
                disabled={saveMutation.isPending}
                className={cn(
                  'px-10 py-5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-3 active:scale-95 disabled:opacity-50',
                  saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-primary text-white hover:bg-primary/90'
                )}
              >
                {saveMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : saved ? <><Check className="w-4 h-4" /> Saved</> : <><Upload className="w-4 h-4" /> Save Media & Location</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
