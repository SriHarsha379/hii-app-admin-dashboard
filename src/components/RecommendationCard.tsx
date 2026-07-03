import React from 'react';
import {
  Calendar,
  Building2,
  MapPin,
  Trash2,
  GripVertical,
  Clock,
  Edit2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface RecommendationCardProps {
  rec: any;
  isSuperAdmin: boolean;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (rec: any) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default function RecommendationCard({
  rec,
  isSuperAdmin,
  onToggleActive,
  onDelete,
  onEdit,
  isDragging = false,
  dragHandleProps = {},
}: RecommendationCardProps) {
  const resource = rec.resource_id || {};
  const name = rec.type === 'event' ? resource.title : resource.name;
  const city = resource.city || '';
  const poster = rec.type === 'event' ? resource.poster_url : resource.portrait_url;
  const overrideTitle = rec.title || name || 'Untitled';

  return (
    <motion.div
      layout
      className={cn(
        'glass-card rounded-[2rem] border border-white/10 p-4 flex items-center gap-4 transition-all hover:border-white/20',
        isDragging && 'border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]'
      )}
    >
      {/* Drag handle (super admin only) */}
      {isSuperAdmin && (
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-white transition-colors shrink-0 touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Poster */}
      <div
        className={cn(
          'w-14 h-14 rounded-2xl bg-white/5 overflow-hidden shrink-0 border border-white/10',
          isSuperAdmin && onEdit && 'cursor-pointer'
        )}
        onClick={() => isSuperAdmin && onEdit?.(rec)}
      >
        {poster ? (
          <img src={poster} alt={overrideTitle} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {rec.type === 'event' ? (
              <Calendar className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Building2 className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className={cn('flex-1 min-w-0', isSuperAdmin && onEdit && 'cursor-pointer')}
        onClick={() => isSuperAdmin && onEdit?.(rec)}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
              rec.type === 'event'
                ? 'bg-purple-500/10 text-purple-400'
                : 'bg-amber-500/10 text-amber-400'
            )}
          >
            {rec.type}
          </span>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            #{rec.priority ?? 0}
          </span>
        </div>
        <p className="text-xs font-black text-white truncate">{overrideTitle}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {city && (
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" /> {city}
            </span>
          )}
          {rec.target_city && (
            <span className="text-[9px] text-blue-400">→ {rec.target_city}</span>
          )}
          {(rec.starts_at || rec.ends_at) && (
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {rec.starts_at ? new Date(rec.starts_at).toLocaleDateString() : '?'}
              {' – '}
              {rec.ends_at ? new Date(rec.ends_at).toLocaleDateString() : '∞'}
            </span>
          )}
        </div>
      </div>

      {/* Active toggle */}
      <button
        onClick={() => onToggleActive(rec._id, !rec.active)}
        disabled={!isSuperAdmin}
        role="switch"
        aria-checked={!!rec.active}
        aria-label="Toggle active"
        className={cn(
          'w-10 h-6 rounded-full flex items-center transition-all shrink-0',
          rec.active ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start',
          !isSuperAdmin && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="w-4 h-4 rounded-full bg-white shadow-md mx-1" />
      </button>

      {/* Edit */}
      {isSuperAdmin && onEdit && (
        <button
          onClick={() => onEdit(rec)}
          className="p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 transition-all shrink-0"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      {/* Delete */}
      {isSuperAdmin && (
        <button
          onClick={() => onDelete(rec._id)}
          className="p-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}