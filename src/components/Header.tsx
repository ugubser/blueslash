import React from 'react';
import { User, LogOut, Settings } from 'lucide-react';
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
    <header className="bg-white border-b-2 border-mario-blue shadow-md pt-[env(safe-area-inset-top)]">
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
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs whitespace-nowrap ${
                    location.pathname === '/task-board'
                      ? 'mario-button-blue'
                      : 'mario-button-blue-muted'
                  }`}
                >
                  Task Board
                </Link>
                <Link
                  to="/kitchen-board"
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs whitespace-nowrap ${
                    location.pathname === '/kitchen-board'
                      ? 'mario-button-blue'
                      : 'mario-button-blue-muted'
                  }`}
                >
                  Kitchen Board
                </Link>
                <Link
                  to={location.pathname === '/household-settings' ? '/task-board' : '/household-settings'}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs whitespace-nowrap ${
                    location.pathname === '/household-settings'
                      ? 'mario-button-blue'
                      : 'mario-button-blue-muted'
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
              <div className="gem-counter text-xs">
                <span className="gem-icon">💎</span>
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
                className="mario-button flex items-center gap-2 text-xs px-3 py-1.5 whitespace-nowrap"
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
                <div className="gem-counter text-xs">
                  <span className="gem-icon">💎</span>
                  <span>{formatNumber(user.gems)}</span>
                </div>
                
                <Link
                  to={location.pathname === '/household-settings' ? '/task-board' : '/household-settings'}
                  className={`p-2 ${
                    location.pathname === '/household-settings'
                      ? 'mario-button-blue'
                      : 'mario-button-blue-muted'
                  }`}
                >
                  <Settings size={18} />
                </Link>

                <button
                  onClick={signOut}
                  className="mario-button p-2"
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
              className={`flex-1 text-center px-3 py-1.5 text-xs ${
                location.pathname === '/task-board'
                  ? 'mario-button-blue'
                  : 'mario-button-blue-muted'
              }`}
            >
              Task Board
            </Link>
            <Link
              to="/kitchen-board"
              className={`flex-1 text-center px-3 py-1.5 text-xs ${
                location.pathname === '/kitchen-board'
                  ? 'mario-button-blue'
                  : 'mario-button-blue-muted'
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
