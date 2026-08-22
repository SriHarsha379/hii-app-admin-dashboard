import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { API_BASE } from './lib/apiConfig';
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
import OrganiserRequests from './pages/OrganiserRequests';
import PendingApproval from './pages/PendingApproval';
import Bookings from './pages/Bookings';

const ProtectedRoute = ({
  children,
  requireSuperAdmin = false,
  allowedRoles
}: {
  children: React.ReactNode,
  requireSuperAdmin?: boolean,
  allowedRoles?: string[]
}) => {
  const { user, token, isLoading } = useAuth();

  // Was previously missing entirely — the only gate was `!user.organisation`,
  // which becomes true the instant the registration form is submitted,
  // regardless of whether the Vendor record behind it has actually been
  // approved. A brand-new, unapproved club got identical access to an
  // approved one. This checks the real backend verification status.
  const { data: ownVendorStatus, isLoading: vendorCheckLoading } = useQuery({
    queryKey: ['own-vendor-status', user?.organisation],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      return list.find((v: any) => v.name === user?.organisation) || null;
    },
    enabled: user?.role === 'CLUB_ADMIN' && Boolean(user?.organisation),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white font-bold uppercase tracking-widest text-xs">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') return <Navigate to="/" replace />;

  // Onboarding check for CLUB_ADMIN
  const isClaiming = window.location.pathname.startsWith('/claim-club/');
  if (user.role === 'CLUB_ADMIN' && !user.organisation && window.location.pathname !== '/club-onboarding' && !isClaiming) {
    return <Navigate to="/club-onboarding" replace />;
  }

  // Approval gate for CLUB_ADMIN — organisation is set, but the vendor
  // behind it isn't verified yet. Don't gate the onboarding/claim pages
  // themselves, or the pending-approval page, to avoid a redirect loop.
  const isPendingApprovalPage = window.location.pathname === '/pending-approval';
  if (
    user.role === 'CLUB_ADMIN' &&
    user.organisation &&
    !isClaiming &&
    window.location.pathname !== '/club-onboarding' &&
    !isPendingApprovalPage
  ) {
    if (vendorCheckLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white font-bold uppercase tracking-widest text-xs">Loading...</div>;
    }
    if (!ownVendorStatus?.is_verified) {
      return <Navigate to="/pending-approval" replace />;
    }
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
        <BrowserRouter basename="/app/admin">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/club-onboarding" element={<ProtectedRoute><ClubOnboarding /></ProtectedRoute>} />
            <Route path="/event-onboarding" element={<ProtectedRoute><EventAdminOnboarding /></ProtectedRoute>} />
            <Route path="/claim-club/:clubId" element={<ProtectedRoute><ClaimClubForm /></ProtectedRoute>} />
            <Route path="/pending-approval" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<ProtectedRoute requireSuperAdmin><Users /></ProtectedRoute>} />
              <Route path="organiser-requests" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><OrganiserRequests /></ProtectedRoute>} />
              <Route path="events" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EVENT_ADMIN', 'NORMAL_ADMIN']}><Events /></ProtectedRoute>} />
              <Route path="clubs" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CLUB_ADMIN', 'NORMAL_ADMIN']}><Clubs /></ProtectedRoute>} />
              <Route path="ticketing" element={<Ticketing />} />
              <Route path="ads-broadcast" element={<ProtectedRoute requireSuperAdmin><AdsBroadcast /></ProtectedRoute>} />
              <Route path="polls-contests" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><PollsContests /></ProtectedRoute>} />
              <Route path="support-activity" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN']}><SupportActivity /></ProtectedRoute>} />
              <Route path="activity-logs" element={<ProtectedRoute requireSuperAdmin><ActivityLogs /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EVENT_ADMIN']}><Analytics /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><Settings /></ProtectedRoute>} />
              <Route path="manage-filters" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><ManageFilters /></ProtectedRoute>} />
              <Route path="recommendations" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><Recommendations /></ProtectedRoute>} />
              <Route path="admins" element={<ProtectedRoute requireSuperAdmin><Admins /></ProtectedRoute>} />
              <Route path="account-settings" element={<ProtectedRoute allowedRoles={['CLUB_ADMIN']}><AccountSettings /></ProtectedRoute>} />
              <Route path="bookings" element={<ProtectedRoute allowedRoles={['CLUB_ADMIN']}><Bookings /></ProtectedRoute>} />
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