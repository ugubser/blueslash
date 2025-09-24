import React, { useState } from 'react';
import { Home, Users, Link, Copy, CheckCircle } from 'lucide-react';
import { createHousehold, generateInviteLink } from '../services/households';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';

const HouseholdSetup: React.FC = () => {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { } = useHousehold();
  const [householdName, setHouseholdName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !householdName.trim()) return;

    try {
      setLoading(true);
      const household = await createHousehold(householdName.trim(), user.id);
      const link = await generateInviteLink(household.id, user.id);
      setInviteLink(link);
    } catch (error) {
      console.error('Error creating household:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (inviteLink) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="mario-card text-center">
            <div className="mb-6">
              <CheckCircle className="mx-auto text-mario-green mb-4" size={64} />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Household Created!
              </h1>
              <p className="text-gray-600 font-normal">
                Share this link to invite household members
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <Link size={20} className="text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-transparent text-sm font-mono"
                />
              </div>
              
              <button
                onClick={handleCopyLink}
                className={`mario-button w-full mt-3 flex items-center justify-center gap-2 ${
                  copied ? 'bg-mario-green' : ''
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Invite Link
                  </>
                )}
              </button>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-2">Next Steps:</h3>
              <ul className="text-sm text-gray-600 text-left space-y-1 font-normal">
                <li>• Share the invite link with household members</li>
                <li>• Start creating tasks and chores</li>
                <li>• Earn gems by completing and verifying tasks</li>
                <li>• Climb the household leaderboard!</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.href = '/task-board'}
              className="mario-button-blue w-full"
            >
              Go to Task Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mario-card">
          <div className="text-center mb-8">
            <Home className="mx-auto text-mario-blue mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Create Your Household
            </h1>
            <p className="text-gray-600 font-normal">
              Set up your household to start managing tasks together
            </p>
          </div>

          <form onSubmit={handleCreateHousehold}>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Household Name *
              </label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="mario-input"
                placeholder="The Smith Family"
                required
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose a name that all household members will recognize
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Users className="text-mario-yellow flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">
                    You'll be the Head of Household
                  </h3>
                  <p className="text-sm text-gray-600 font-normal">
                    As the head, you can manage household settings and invite members.
                    You'll get an invite link to share with others.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !householdName.trim()}
              className="mario-button w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="loading-spinner w-5 h-5" />
              ) : (
                <Home size={20} />
              )}
              Create Household
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HouseholdSetup;
