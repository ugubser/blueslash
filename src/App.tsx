import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { HouseholdProvider, useHousehold } from './hooks/useHousehold';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HouseholdSetup from './pages/HouseholdSetup';
import Invite from './pages/Invite';
import './styles/index.css';

const AppRoutes: React.FC = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600 font-normal">Loading BlueSlash...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/invite/:token" element={<Invite />} />
      <Route path="/*" element={<AuthenticatedRoutes />} />
    </Routes>
  );
};

const AuthenticatedRoutes: React.FC = () => {
  const { user } = useAuth();
  const { household, loading: householdLoading } = useHousehold();
  const location = useLocation();

  if (!user) {
    return <Login />;
  }

  // Check for pending invite token after authentication, but only if we're not already on an invite page
  const pendingInviteToken = localStorage.getItem('pendingInviteToken');
  
  if (pendingInviteToken && !location.pathname.startsWith('/invite/')) {
    // Always allow invite processing - users can join multiple households
    return <Navigate to={`/invite/${pendingInviteToken}`} replace />;
  }

  if (!householdLoading && !household) {
    return <HouseholdSetup />;
  }

  if (householdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600 font-normal">Loading household...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      <Header />
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <HouseholdProvider>
          <AppRoutes />
        </HouseholdProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
