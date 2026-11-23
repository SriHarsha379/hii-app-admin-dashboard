const fs = require('fs');

// ── 1. RefinedForm.tsx — better field + section design ──────────────────────
fs.writeFileSync('src/components/RefinedForm.tsx', `
import React from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

export function FormSection({ title, icon, children, className, description }: FormSectionProps) {
  return (
    <div className={cn('relative rounded-3xl border border-white/[0.06] bg-white/[0.015] overflow-hidden', className)}>
      {/* Top accent line */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-3 px-8 pt-7 pb-5 border-b border-white/[0.04]">
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h4 className="text-[11px] font-black text-white/70 uppercase tracking-[0.25em]">{title}</h4>
          {description && <p className="text-[10px] text-white/30 font-medium mt-0.5">{description}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {children}
      </div>
    </div>
  );
}

interface RefinedFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  value?: any;
  onChange?: (e: any) => void;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function RefinedField({ label, name, icon, error, hint, className, ...props }: RefinedFieldProps) {
  return (
    <div className={cn('space-y-2 group/field', className)}>
      <label className="flex items-center justify-between">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] transition-colors duration-200 group-focus-within/field:text-primary/80">
          {label}
        </span>
        {hint && <span className="text-[9px] text-white/20 font-medium normal-case tracking-normal">{hint}</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-primary/60 transition-colors duration-200 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          name={name}
          className={cn(
            'w-full bg-[#0c0c10] border rounded-2xl py-3.5 text-sm text-white transition-all duration-200',
            'placeholder:text-white/15 focus:outline-none',
            'hover:border-white/15 focus:border-primary/50 focus:bg-[#0e0e14]',
            icon ? 'pl-11 pr-4' : 'px-4',
            error
              ? 'border-red-500/40 bg-red-500/5'
              : 'border-white/[0.07]',
            props.readOnly && 'opacity-50 cursor-not-allowed',
          )}
        />
        {/* Focus underline */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 scale-x-0 group-focus-within/field:scale-x-100 transition-transform duration-300 rounded-full" />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-[10px] text-red-400/80 font-bold uppercase tracking-widest flex items-center gap-1.5 pl-1"
          >
            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
`, 'utf8');
console.log('✅ RefinedForm.tsx written');


// ── 2. Patch Clubs.tsx — replace Add/Edit modal + Reject modal markup ────────
// Read current file
let clubs = fs.readFileSync('src/pages/Clubs.tsx', 'utf8');

// ── Patch: Reject modal component (replace the whole RejectModal function) ──
const oldRejectModal = clubs.indexOf('function RejectModal(');
const oldRejectModalEnd = clubs.indexOf('\nexport default function Clubs', oldRejectModal);

const newRejectModal = `
// ── Reject modal ─────────────────────────────────────────────────────────────
function RejectModal({ open, clubName, onConfirm, onCancel, isPending }: {
  open: boolean; clubName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = React.useState('');
  const presets = ['Incomplete information', 'Duplicate listing', 'Policy violation', 'Invalid documents'];
  React.useEffect(() => { if (!open) setReason(''); }, [open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="w-full max-w-md bg-[#0d0d12] rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-7 pt-7 pb-5 border-b border-white/[0.05]">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Reject Vendor</h3>
              <p className="text-[11px] text-white/40 font-medium mt-1 leading-snug">
                This will mark <span className="text-white/70 font-bold">{clubName}</span> as rejected and notify them by email.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5">
          {/* Quick presets */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Quick Reason</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setReason(p)}
                  className={\`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all \${
                    reason === p
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : 'bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/20'
                  }\`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Custom Reason <span className="normal-case font-medium text-white/20">(optional)</span></label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe why this vendor is being rejected..."
              className="w-full bg-[#0c0c10] border border-white/[0.07] rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-red-500/30 resize-none font-medium placeholder:text-white/15 transition-all hover:border-white/15"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] text-xs font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            Cancel
          </button>
          <button
            disabled={isPending}
            onClick={() => onConfirm(reason)}
            className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Ban className="w-4 h-4" />}
            Reject Vendor
          </button>
        </div>
      </motion.div>
    </div>
  );
}

`;

if (oldRejectModal !== -1 && oldRejectModalEnd !== -1) {
  clubs = clubs.slice(0, oldRejectModal) + newRejectModal + clubs.slice(oldRejectModalEnd);
  console.log('✅ RejectModal patched');
} else {
  console.log('⚠️  RejectModal not found — skipping patch');
}

// ── Patch: Add/Edit Club modal header step indicator ─────────────────────────
// Replace the step progress bar section to look cleaner
clubs = clubs.replace(
  `<div className="flex items-center justify-between mb-16 relative px-4">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700 shadow-[0_0_15px_rgba(255,45,154,0.5)]" style={{ width: \`\${((venueStep - 1) / 2) * 100}%\` }} />
                  {[1, 2, 3].map(step => (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black border-2 transition-all duration-500', venueStep >= step ? 'bg-primary border-primary text-white shadow-[0_0_30px_rgba(255,45,154,0.3)] scale-110' : 'bg-[#09090B] border-white/5 text-white/20')}>
                        {venueStep > step ? <Check className="w-6 h-6 stroke-[3px]" /> : step}
                      </div>
                      <span className={cn('text-[10px] uppercase font-black tracking-[0.2em] absolute -bottom-10 w-32 text-center transition-colors duration-500', venueStep >= step ? 'text-primary' : 'text-white/20')}>
                        {step === 1 ? 'Details' : step === 2 ? 'Visuals' : 'Logistics'}
                      </span>
                    </div>
                  ))}
                </div>`,
  `<div className="mb-10">
                  {/* Step labels */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    {['Details', 'Visuals', 'Logistics'].map((label, i) => {
                      const step = i + 1;
                      return (
                        <span key={label} className={\`text-[10px] font-black uppercase tracking-widest transition-colors \${venueStep >= step ? 'text-primary' : 'text-white/20'}\`}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                  {/* Progress track */}
                  <div className="relative h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(255,45,154,0.4)]"
                      style={{ width: \`\${((venueStep - 1) / 2) * 100}%\` }}
                    />
                  </div>
                  {/* Step dots */}
                  <div className="flex items-center justify-between mt-3 px-0">
                    {[1, 2, 3].map(step => (
                      <div key={step} className="flex flex-col items-center gap-1.5">
                        <div className={\`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all duration-300 \${
                          venueStep > step
                            ? 'bg-primary border-primary text-white shadow-[0_0_12px_rgba(255,45,154,0.3)]'
                            : venueStep === step
                              ? 'bg-primary/10 border-primary text-primary scale-110'
                              : 'bg-white/[0.03] border-white/10 text-white/20'
                        }\`}>
                          {venueStep > step ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : step}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>`
);

// ── Patch: Add/Edit modal — tighten up the padding ───────────────────────────
clubs = clubs.replace(
  `<div className="flex-1 overflow-y-auto p-10 lg:p-12 scrollbar-hide">`,
  `<div className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-hide">`
);

// ── Patch: modal header — rounder, cleaner ───────────────────────────────────
clubs = clubs.replace(
  `className="glass-card w-full max-w-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"`,
  `className="glass-card w-full max-w-2xl rounded-3xl border border-white/[0.08] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.7)] flex flex-col max-h-[90vh]"`
);

// ── Patch: footer buttons — tighter ─────────────────────────────────────────
clubs = clubs.replace(
  `<div className="p-10 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>{venueStep > 1 && <button onClick={() => setVenueStep(v => v - 1)} className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 active:scale-95"><ChevronLeft className="w-4 h-4" /> Back</button>}</div>
              <div className="flex items-center gap-4">
                <button onClick={() => { setIsCreatingClub(false); resetVenueForm(); }} className="px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all">Cancel</button>
                {venueStep < 3 ? (
                  <button onClick={() => { if (venueStep === 1) { if (!venueFormData.name) { alert('Enter a club name'); return; } if (!selectedClub && !venueFormData.vendor_id) { alert('Select a vendor'); return; } if (!venueFormData.type?.length) { alert('Select a category'); return; } } if (venueStep === 2 && !venueFormData.city) { alert('Select a city'); return; } setVenueStep(v => v + 1); }} className="px-14 py-5 rounded-[24px] bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group">Next Step <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>
                ) : (
                  <button disabled={isSubmitting} onClick={handleSubmitVenue} className="px-16 py-5 rounded-[24px] bg-gradient-to-br from-primary to-purple-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : selectedClub ? 'Save Changes' : 'Add Club'}
                  </button>
                )}
              </div>
            </div>`,
  `<div className="px-6 py-5 border-t border-white/[0.05] flex items-center justify-between bg-[#0a0a0f]">
              <div>
                {venueStep > 1 && (
                  <button onClick={() => setVenueStep(v => v - 1)}
                    className="px-5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-2 active:scale-95">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsCreatingClub(false); resetVenueForm(); }}
                  className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 transition-all">
                  Cancel
                </button>
                {venueStep < 3 ? (
                  <button
                    onClick={() => {
                      if (venueStep === 1) {
                        if (!venueFormData.name) { alert('Enter a club name'); return; }
                        if (!selectedClub && !venueFormData.vendor_id) { alert('Select a vendor'); return; }
                        if (!venueFormData.type?.length) { alert('Select a category'); return; }
                      }
                      if (venueStep === 2 && !venueFormData.city) { alert('Select a city'); return; }
                      setVenueStep(v => v + 1);
                    }}
                    className="px-7 py-2.5 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all flex items-center gap-2 group shadow-lg">
                    Next <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <button
                    disabled={isSubmitting}
                    onClick={handleSubmitVenue}
                    className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      : selectedClub ? 'Save Changes' : 'Add Club'}
                  </button>
                )}
              </div>
            </div>`
);

// ── Patch: modal header padding ──────────────────────────────────────────────
clubs = clubs.replace(
  `<div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">`,
  `<div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between bg-[#0a0a0f]">`
);

clubs = clubs.replace(
  `<div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]"><Building2 className="w-5 h-5" /></div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{selectedClub ? 'Edit' : 'Add New'} <span className="text-primary neon-text">Club</span></h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Step {venueStep}/3</p>
                  </div>`,
  `<div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      {selectedClub ? 'Edit Club' : 'Add New Club'}
                    </h3>
                    <p className="text-[10px] text-white/30 font-medium mt-0.5">Step {venueStep} of 3</p>
                  </div>`
);

fs.writeFileSync('src/pages/Clubs.tsx', clubs, 'utf8');
console.log('✅ Clubs.tsx modal UI patched');

console.log('\n✅ All done');
