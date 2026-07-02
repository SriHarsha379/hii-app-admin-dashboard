import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Events from './pages/Events';
import Clubs from './pages/Clubs';
import Ticketing from './pages/Ticketing';
import Admins from './pages/Admins';
import Analytics from './pages/Analytics';
import AdsBroadcast from './pages/AdsBroadcast';
import PollsContests from './pages/PollsContests';
import SupportActivity from './pages/SupportActivity';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import ManageFilters from './pages/ManageFilters';
import Recommendations from './pages/Recommendations';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import ClubOnboarding from './pages/ClubOnboarding';
import EventAdminOnboarding from './pages/EventAdminOnboarding';

const ProtectedRoute = ({ 
  children, 
  requireSuperAdmin = false,
  allowedRoles
}: { 
  children: React.ReactNode, 
  requireSuperAdmin?: boolean,
  allowedRoles?: string[]
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white font-bold uppercase tracking-widest text-xs">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') return <Navigate to="/" replace />;
  
  // Onboarding check for CLUB_ADMIN
  const isClaiming = window.location.pathname.startsWith('/claim-club/');
  if (user.role === 'CLUB_ADMIN' && !user.organisation && window.location.pathname !== '/club-onboarding' && !isClaiming) {
    return <Navigate to="/club-onboarding" replace />;
  }

  // Onboarding check for EVENT_ADMIN
  if (user.role === 'EVENT_ADMIN' && !user.organisation && window.location.pathname !== '/event-onboarding') {
    return <Navigate to="/event-onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

import AccountSettings from './pages/AccountSettings';
import EventAccountSettings from './pages/EventAccountSettings';
import ClaimClubForm from './pages/ClaimClubForm';
import EventAdminProfilePage from './pages/EventAdminProfilePage';
import ClubProfilePage from './pages/ClubProfilePage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/club-onboarding" element={<ProtectedRoute><ClubOnboarding /></ProtectedRoute>} />
            <Route path="/event-onboarding" element={<ProtectedRoute><EventAdminOnboarding /></ProtectedRoute>} />
            <Route path="/claim-club/:clubId" element={<ProtectedRoute><ClaimClubForm /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<ProtectedRoute requireSuperAdmin><Users /></ProtectedRoute>} />
              <Route path="events" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EVENT_ADMIN', 'NORMAL_ADMIN']}><Events /></ProtectedRoute>} />
              <Route path="clubs" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CLUB_ADMIN', 'NORMAL_ADMIN']}><Clubs /></ProtectedRoute>} />
              <Route path="ticketing" element={<Ticketing />} />
              <Route path="ads-broadcast" element={<ProtectedRoute requireSuperAdmin><AdsBroadcast /></ProtectedRoute>} />
              <Route path="polls-contests" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><PollsContests /></ProtectedRoute>} />
              <Route path="support-activity" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN']}><SupportActivity /></ProtectedRoute>} />
              <Route path="activity-logs" element={<ProtectedRoute requireSuperAdmin><ActivityLogs /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN']}><Analytics /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><Settings /></ProtectedRoute>} />
              <Route path="manage-filters" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><ManageFilters /></ProtectedRoute>} />
              <Route path="recommendations" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><Recommendations /></ProtectedRoute>} />
              <Route path="admins" element={<ProtectedRoute requireSuperAdmin><Admins /></ProtectedRoute>} />
              <Route path="account-settings" element={<ProtectedRoute allowedRoles={['CLUB_ADMIN']}><AccountSettings /></ProtectedRoute>} />
              <Route path="event-account-settings" element={<ProtectedRoute allowedRoles={['EVENT_ADMIN']}><EventAccountSettings /></ProtectedRoute>} />
              <Route path="event-profile" element={<ProtectedRoute allowedRoles={['EVENT_ADMIN']}><EventAdminProfilePage /></ProtectedRoute>} />
              <Route path="club-profile" element={<ProtectedRoute allowedRoles={['CLUB_ADMIN']}><ClubProfilePage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
