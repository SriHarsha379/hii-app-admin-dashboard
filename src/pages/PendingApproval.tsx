import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

// FIXED: previously there was no gate at all between submitting the venue
// registration form and getting full dashboard access — App.tsx only
// checked whether `user.organisation` was set (which happens the instant
// the form is submitted), never whether the underlying Vendor record was
// actually approved. So a brand-new, unapproved club got the exact same
// access as an approved one. This page is what now sits in between:
// ProtectedRoute redirects here if the admin's organisation exists but its
// matching vendor record isn't verified yet.
export default function PendingApproval() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Pending Approval</h1>
          <p className="text-sm text-white/40 leading-relaxed">
            <span className="text-white font-bold">{user?.organisation}</span> has been submitted for review.
            A Super Admin needs to approve your account before you can access your dashboard — you'll be notified once that happens.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Check Status
          </button>
          <button
            onClick={logout}
            className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}