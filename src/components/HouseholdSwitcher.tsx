import React, { useState } from 'react';
import { ChevronDown, Home, Users, Crown } from 'lucide-react';
import { useHousehold } from '../hooks/useHousehold';
import { useAuth } from '../hooks/useAuth';

const HouseholdSwitcher: React.FC = () => {
  const { user } = useAuth();
  const { household, userHouseholds, switchCurrentHousehold } = useHousehold();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSwitchHousehold = async (householdId: string) => {
    if (!user || household?.id === householdId) return;
    
    try {
      setSwitching(true);
      await switchCurrentHousehold(householdId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching household:', error);
    } finally {
      setSwitching(false);
    }
  };

  const getUserRole = (householdId: string) => {
    const userHousehold = user?.households?.find(h => h.householdId === householdId);
    return userHousehold?.role || 'member';
  };

  if (!household || userHouseholds.length <= 1) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <Home size={20} />
        <span className="font-medium">{household?.name || 'No Household'}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border-2 border-gray-200 hover:border-mario-blue transition-colors duration-200 disabled:opacity-50"
      >
        <Home size={20} className="text-mario-blue" />
        <span className="font-medium text-gray-700 max-w-32 sm:max-w-none truncate">
          {household.name}
        </span>
        <div className="flex items-center space-x-1">
          {getUserRole(household.id) === 'head' && (
            <Crown size={16} className="text-mario-yellow" />
          )}
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg border-2 border-gray-200 shadow-xl z-50 max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
                Your Households ({userHouseholds.length})
              </div>
              
              {userHouseholds.map((h) => {
                const role = getUserRole(h.id);
                const isCurrentHousehold = h.id === household.id;
                
                return (
                  <button
                    key={h.id}
                    onClick={() => handleSwitchHousehold(h.id)}
                    disabled={isCurrentHousehold || switching}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                      isCurrentHousehold
                        ? 'bg-mario-blue text-white cursor-default'
                        : 'hover:bg-gray-50 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isCurrentHousehold ? 'bg-white/20' : 'bg-mario-blue/10'
                      }`}>
                        <Users size={16} className={
                          isCurrentHousehold ? 'text-white' : 'text-mario-blue'
                        } />
                      </div>
                      <div className="text-left">
                        <div className="font-medium truncate max-w-32">{h.name}</div>
                        <div className={`text-xs ${
                          isCurrentHousehold ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {h.members.length} member{h.members.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {role === 'head' && (
                        <Crown size={14} className={
                          isCurrentHousehold ? 'text-white' : 'text-mario-yellow'
                        } />
                      )}
                      {isCurrentHousehold && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HouseholdSwitcher;