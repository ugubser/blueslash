import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { HouseholdProvider, useHousehold } from './hooks/useHousehold';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HouseholdSetup from './pages/HouseholdSetup';
import './styles/index.css';

const AppRoutes: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { household, loading: householdLoading } = useHousehold();

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

  if (!user) {
    return <Login />;
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
