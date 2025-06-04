import React from 'react';
import { Coins, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import HouseholdSwitcher from './HouseholdSwitcher';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { household } = useHousehold();

  const getCurrentUserRole = () => {
    if (!user || !household) return 'member';
    const userHousehold = user.households?.find(h => h.householdId === household.id);
    return userHousehold?.role || 'member';
  };

  return (
    <header className="bg-white border-b-4 border-mario-blue shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-mario-blue">
              BlueSlash
            </h1>
            <HouseholdSwitcher />
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