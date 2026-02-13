import React from 'react';
import { Coins, User, LogOut, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { getUserRole } from '../utils/household';
import { formatNumber } from '../utils/formatting';
import HouseholdSwitcher from './HouseholdSwitcher';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { household } = useHousehold();
  const location = useLocation();

  const userRole = getUserRole(user, household);


  return (
    <header className="bg-white border-b-2 border-mario-blue shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden xl:flex items-center justify-between h-14 gap-6">
          <div className="flex items-center gap-6">
            <Link to="/task-board" className="text-xl font-bold text-mario-blue hover:text-mario-blue-dark transition-colors">
              BlueSlash
            </Link>
            <div className="flex items-center gap-3">
              <HouseholdSwitcher />
              <nav className="flex items-center gap-2">
                <Link
                  to="/task-board"
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    location.pathname === '/task-board'
                      ? 'bg-mario-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Task Board
                </Link>
                <Link
                  to="/kitchen-board"
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    location.pathname === '/kitchen-board'
                      ? 'bg-mario-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Kitchen Board
                </Link>
                <Link
                  to={location.pathname === '/household-settings' ? '/task-board' : '/household-settings'}
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
            <div className="flex items-center gap-4">
              <div className="gem-counter text-sm">
                <Coins className="coin-icon" size={16} />
                <span>{formatNumber(user.gems)}</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <User size={14} />
                <span className="text-gray-700 whitespace-nowrap">{user.displayName}</span>
                <span className="power-up-badge text-xs">
                  {userRole === 'head' ? '👑 HEAD' : '👤 MEMBER'}
                </span>
              </div>

              <button
                onClick={signOut}
                className="mario-button-blue flex items-center gap-2 text-xs px-3 py-1.5"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile and Tablet Layout - Two Lines */}
        <div className="xl:hidden py-1.5">
          {/* First Line */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex-1 mr-2">
              <HouseholdSwitcher />
            </div>
            
            {user && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="gem-counter text-sm">
                  <Coins className="coin-icon" size={16} />
                  <span>{formatNumber(user.gems)}</span>
                </div>
                
                <Link
                  to={location.pathname === '/household-settings' ? '/task-board' : '/household-settings'}
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
                  {userRole === 'head' ? '👑 HEAD' : '👤 MEMBER'}
                </span>
              </>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <Link
              to="/task-board"
              className={`flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                location.pathname === '/task-board'
                  ? 'bg-mario-blue text-white'
                  : 'bg-white/70 text-gray-700'
              }`}
            >
              Task Board
            </Link>
            <Link
              to="/kitchen-board"
              className={`flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                location.pathname === '/kitchen-board'
                  ? 'bg-mario-blue text-white'
                  : 'bg-white/70 text-gray-700'
              }`}
            >
              Kitchen Board
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
