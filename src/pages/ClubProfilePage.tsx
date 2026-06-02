import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Building2 } from 'lucide-react';
import ClubAdminProfile from '../components/ClubAdminProfile';

export default function ClubProfilePage() {
  const navigate = useNavigate();
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Club Profile</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage your venue presence</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/events-account-settings')}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all group"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>
      <ClubAdminProfile />
    </div>
  );
}
