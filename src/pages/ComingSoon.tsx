import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  title?:       string;
  description?: string;
}

/**
 * Generic "Coming Soon" placeholder used for routes that have no
 * working backend yet.  Keeps the sidebar link live and gives the
 * user a clear signal instead of a silent redirect.
 */
export default function ComingSoon({
  title       = 'Coming Soon',
  description = 'This feature is under development and will be available shortly.',
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-700">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_40px_rgba(255,45,154,0.15)]">
        <Sparkles className="w-10 h-10" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <span className="px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
        In Development
      </span>
    </div>
  );
}
