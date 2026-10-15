import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, X, Link as LinkIcon, Image as ImageIcon, Clock, Video } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_BASE } from '../lib/apiConfig';

const UPLOADS_BASE = API_BASE.replace(/\/api\/v1\/admin\/?$/, '/uploads');
const adAssetUrl = (filename) => {
  if (!filename) return '';
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${UPLOADS_BASE}/${filename}`;
};

export function AdPreviewModal({ ad, onClose }) {
  return (
    <AnimatePresence>
      {ad && (() => {
        const isExpired = ad.expiry_date ? new Date(ad.expiry_date).getTime() < Date.now() : false;
        const hasVideo = Boolean(ad.ad_video);
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-sm rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[180px]">{ad.ad_name || 'Ad Preview'}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">As shown in the app</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center gap-6">
                <div className="w-full max-w-[260px] bg-[#0B0B0F] rounded-[44px] border-[8px] border-white/10 p-3 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3" />
                  <div className="rounded-[28px] overflow-hidden bg-black relative">
                    {hasVideo ? (
                      <video
                        src={adAssetUrl(ad.ad_video)}
                        poster={ad.ad_image ? adAssetUrl(ad.ad_image) : undefined}
                        controls
                        playsInline
                        className="w-full h-auto bg-black"
                        style={{ aspectRatio: ad.video_width && ad.video_height ? `${ad.video_width} / ${ad.video_height}` : '9 / 16' }}
                      />
                    ) : ad.ad_image ? (
                      <img src={adAssetUrl(ad.ad_image)} alt={ad.ad_name || 'Ad'} className="w-full h-auto" />
                    ) : (
                      <div className="aspect-[9/16] flex items-center justify-center text-white/20">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    {ad.link_url && (
                      <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                        <LinkIcon className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-[10px] text-white/80 font-medium truncate">{ad.link_url}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full flex flex-wrap items-center justify-center gap-2">
                  <span className={cn('px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border', isExpired ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')}>
                    {isExpired ? 'Expired' : 'Active'}
                  </span>
                  {ad.expiry_date && (
                    <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-white/60 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {new Date(ad.expiry_date).toLocaleDateString()}
                    </span>
                  )}
                  {hasVideo && (
                    <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-white/60 flex items-center gap-1.5">
                      <Video className="w-3 h-3" /> Video
                    </span>
                  )}
                </div>

                {ad.link_url && (
                  <a href={ad.link_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Open destination link
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        );
      })()}
    </AnimatePresence>
  );
}
