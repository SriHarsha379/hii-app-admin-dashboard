import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import EventAdminProfile from '../components/EventAdminProfile';

export default function EventAdminProfilePage() {
  const navigate = useNavigate();
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <UserProfileIcon />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Company Profile</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage your company presence</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/event-account-settings')}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all group"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>
      <EventAdminProfile />
    </div>
  );
}

function UserProfileIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
