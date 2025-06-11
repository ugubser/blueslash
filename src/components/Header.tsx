import React from 'react';
import { Coins, User, LogOut, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import HouseholdSwitcher from './HouseholdSwitcher';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { household } = useHousehold();
  const location = useLocation();

  const getCurrentUserRole = () => {
    if (!user || !household) return 'member';
    const userHousehold = user.households?.find(h => h.householdId === household.id);
    return userHousehold?.role || 'member';
  };

  const isHeadOfHousehold = user && household && household.headOfHousehold === user.id;

  return (
    <header className="bg-white border-b-4 border-mario-blue shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-2xl font-bold text-mario-blue hover:text-mario-blue-dark transition-colors">
              BlueSlash
            </Link>
            <HouseholdSwitcher />
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-lg font-bold text-sm transition-colors ${
                location.pathname === '/dashboard' 
                  ? 'bg-mario-blue text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            {isHeadOfHousehold && (
              <Link
                to="/household-settings"
                className={`px-3 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
                  location.pathname === '/household-settings' 
                    ? 'bg-mario-blue text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings size={14} />
                Settings
              </Link>
            )}
          </nav>

          {user && (
            <div className="flex items-center gap-4">
              <div className="gem-counter">
                <Coins className="coin-icon" size={20} />
                <span>{user.gems.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <User size={16} />
                <span className="text-gray-700">{user.displayName}</span>
                <span className="power-up-badge text-xs">
                  {getCurrentUserRole() === 'head' ? '👑 HEAD' : '👤 MEMBER'}
                </span>
              </div>

              <button
                onClick={signOut}
                className="mario-button-blue flex items-center gap-2 text-xs px-3 py-2"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;