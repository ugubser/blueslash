import React from 'react';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import { useHousehold } from '../hooks/useHousehold';
import { formatNumber } from '../utils/formatting';

const Leaderboard: React.FC = () => {
  const { members } = useHousehold();


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
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="text-mario-yellow" size={20} />
        <h2 className="text-lg font-bold text-gray-800">Gem Leaderboard</h2>
      </div>

      <div className="space-y-2">
        {sortedMembers.map((member, index) => (
          <div
            key={member.id}
            className={`leaderboard-item ${getRankClass(index)}`}
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center justify-center w-7 h-7">
                {getRankIcon(index)}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-800">
                  {member.displayName}
                </h3>
                <p className="text-xs text-gray-500">
                  #{index + 1} in household
                </p>
              </div>

              <div className="gem-counter ml-auto">
                <span className="gem-icon">💎</span>
                <span className="font-bold">{formatNumber(member.gems)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedMembers.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-bold text-xs text-gray-800 mb-1">
            How to Earn Gems:
          </h4>
          <ul className="text-xs text-gray-600 space-y-0.5" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" }}>
            <li>Create detailed tasks: 5-25 gems</li>
            <li>Complete tasks: Full gem reward</li>
            <li>Verify others' work: 3 gems</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;