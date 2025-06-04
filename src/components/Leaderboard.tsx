import React from 'react';
import { Trophy, Coins, Crown, Medal, Award } from 'lucide-react';
import { useHousehold } from '../hooks/useHousehold';
import { useAuth } from '../hooks/useAuth';

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { members, household } = useHousehold();

  const getMemberRole = (memberId: string) => {
    if (!user || !household) return 'member';
    // Check if this member is the head of household
    return household.headOfHousehold === memberId ? 'head' : 'member';
  };

  const sortedMembers = [...members].sort((a, b) => b.gems - a.gems);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="text-yellow-500" size={20} />;
      case 1:
        return <Medal className="text-gray-500" size={20} />;
      case 2:
        return <Award className="text-orange-500" size={20} />;
      default:
        return <Trophy className="text-gray-400" size={20} />;
    }
  };

  const getRankClass = (index: number) => {
    switch (index) {
      case 0:
        return 'first';
      case 1:
        return 'second';
      case 2:
        return 'third';
      default:
        return '';
    }
  };

  if (members.length === 0) {
    return (
      <div className="mario-card">
        <div className="text-center py-8">
          <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-600 mb-2">No Members Yet</h3>
          <p className="text-sm text-gray-500">
            Invite household members to see the leaderboard!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mario-card">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-mario-yellow" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Gem Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {sortedMembers.map((member, index) => (
          <div
            key={member.id}
            className={`leaderboard-item ${getRankClass(index)}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(index)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800">
                    {member.displayName}
                  </h3>
                  {getMemberRole(member.id) === 'head' && (
                    <span className="power-up-badge text-xs">
                      👑 HEAD
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  #{index + 1} in household
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="gem-counter">
                <Coins className="coin-icon" size={16} />
                <span className="font-bold">{member.gems.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedMembers.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h4 className="font-bold text-sm text-gray-800 mb-2">
            How to Earn Gems:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Create detailed tasks: 5-15 gems</li>
            <li>• Complete tasks: Full gem reward</li>
            <li>• Verify others' work: 3 gems</li>
            <li>• Publish tasks: 10% of task value</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;