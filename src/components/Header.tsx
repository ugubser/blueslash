import React from 'react';
import { Coins, Home, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { household } = useHousehold();

  return (
    <header className="bg-white border-b-4 border-mario-blue shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-mario-blue">
              BlueSlash
            </h1>
            {household && (
              <div className="flex items-center gap-2 text-sm">
                <Home size={16} />
                <span className="text-gray-600">{household.name}</span>
              </div>
            )}
          </div>

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
                  {user.role === 'head' ? '👑 HEAD' : '👤 MEMBER'}
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