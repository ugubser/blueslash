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


  return (
    <header className="bg-white border-b-4 border-mario-blue shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden xl:flex items-center justify-between h-20 gap-8">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-2xl font-bold text-mario-blue hover:text-mario-blue-dark transition-colors">
              BlueSlash
            </Link>
            <div className="flex items-center gap-4">
              <HouseholdSwitcher />
              <nav className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-mario-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to={location.pathname === '/household-settings' ? '/dashboard' : '/household-settings'}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
                    location.pathname === '/household-settings'
                      ? 'bg-mario-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings size={14} />
                  Settings
                </Link>
              </nav>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-5">
              <div className="gem-counter">
                <Coins className="coin-icon" size={20} />
                <span>{user.gems.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <User size={16} />
                <span className="text-gray-700 whitespace-nowrap">{user.displayName}</span>
                <span className="power-up-badge text-xs">
                  {getCurrentUserRole() === 'head' ? '👑 HEAD' : '👤 MEMBER'}
                </span>
              </div>

              <button
                onClick={signOut}
                className="mario-button-blue flex items-center gap-2 text-xs px-4 py-2 h-11"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile and Tablet Layout - Two Lines */}
        <div className="xl:hidden py-2">
          {/* First Line */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1 mr-2">
              <HouseholdSwitcher />
            </div>
            
            {user && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="gem-counter text-sm">
                  <Coins className="coin-icon" size={16} />
                  <span>{user.gems.toLocaleString()}</span>
                </div>
                
                <Link
                  to={location.pathname === '/household-settings' ? '/dashboard' : '/household-settings'}
                  className={`p-2 rounded-lg transition-colors ${
                    location.pathname === '/household-settings' 
                      ? 'bg-mario-blue text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings size={18} />
                </Link>
                
                <button
                  onClick={signOut}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Second Line */}
          <div className="flex justify-between items-center">
            {user && (
              <>
                <div className="flex items-center gap-2 text-xs flex-1">
                  <User size={14} />
                  <span className="text-gray-700 truncate">{user.displayName}</span>
                </div>
                <span className="power-up-badge text-xs whitespace-nowrap flex-shrink-0">
                  {getCurrentUserRole() === 'head' ? '👑 HEAD' : '👤 MEMBER'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
