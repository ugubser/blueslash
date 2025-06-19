import React, { useState, useEffect } from 'react';
import { Users, Link, Trash2, Copy, Plus, Crown, User, Brain, Save } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { 
  generateInviteLink, 
  removeMemberFromHousehold,
  updateHousehold 
} from '../services/households';
import { functions } from '../services/firebase';
import NotificationPermission from '../components/NotificationPermission';

const HouseholdSettings: React.FC = () => {
  const { user } = useAuth();
  const { household, members } = useHousehold();
  const [inviteLink, setInviteLink] = useState<string>('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [gemPrompt, setGemPrompt] = useState<string>('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [allowGemOverride, setAllowGemOverride] = useState<boolean>(false);

  const isHeadOfHousehold = user && household && household.headOfHousehold === user.id;


  useEffect(() => {
    console.log('HouseholdSettings mounted, user:', user?.id, 'household:', household?.id, 'isHead:', isHeadOfHousehold);
    if (household) {
      // Initialize gem prompt with default value if none exists
      const defaultPrompt = `A chore at home that takes 5-10 min. is 5 Gems, this includes emptying or filling the dishwasher, setting the table, vacuum one room, bringing out the trash or paper collection etc.

A chore at home that takes 10 - 30 min is 10 Gems, this includes cleaning the kitchen, vacuuming the house, walking the dog, helping with recycling, cleaning the cellar, putting together cardboard

A chore at home that takes longer than 30 min (a combination of previous chores) is 15 Gems.

Shopping or doing external activity for the household is 20 Gems, regardless of the time requirement

If something exceed any of these things, then it's 25 Gems.`;
      
      setGemPrompt(household.gemPrompt || defaultPrompt);
      setAllowGemOverride(household.allowGemOverride || false);
    }
  }, [household]);


  const handleGenerateInviteLink = async () => {
    if (!household || !isHeadOfHousehold || !user) return;
    
    try {
      setGeneratingLink(true);
      const link = await generateInviteLink(household.id, user.id);
      setInviteLink(link);
    } catch (error) {
      console.error('Error generating invite link:', error);
      alert('Failed to generate invite link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy link');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!household || !user || !isHeadOfHousehold) return;
    
    const memberToRemove = members.find(m => m.id === memberId);
    if (!memberToRemove) return;
    
    const confirmed = confirm(`Are you sure you want to remove ${memberToRemove.displayName} from the household?`);
    if (!confirmed) return;
    
    try {
      setRemovingMember(memberId);
      await removeMemberFromHousehold(household.id, memberId, user.id);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const handleSaveGemPrompt = async () => {
    if (!household || !user || !isHeadOfHousehold) return;
    
    try {
      setSavingPrompt(true);
      await updateHousehold(household.id, { 
        gemPrompt,
        allowGemOverride
      });
      alert('Gem calculation settings saved successfully!');
    } catch (error) {
      console.error('Error saving gem settings:', error);
      alert('Failed to save gem settings');
    } finally {
      setSavingPrompt(false);
    }
  };

  console.log('HouseholdSettings render - user:', !!user, 'household:', !!household, 'isHead:', isHeadOfHousehold);
  
  // Add error boundary for date formatting
  const formatDate = (date: unknown) => {
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
        return (date.toDate() as Date).toLocaleDateString();
      }
      if (typeof date === 'string' || typeof date === 'number') {
        return new Date(date).toLocaleDateString();
      }
      return 'Unknown date';
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown date';
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mario-card text-center py-12">
          <p className="text-red-600">No user found. Please log in.</p>
        </div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mario-card text-center py-12">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading household...</p>
        </div>
      </div>
    );
  }


  // Wrap the main content in a try-catch to prevent crashes
  try {

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isHeadOfHousehold ? 'Household Settings' : 'Household Info & Settings'}
        </h1>
        <p className="text-gray-600 font-normal">
          {isHeadOfHousehold 
            ? 'Manage your household members and invite new people to join.'
            : 'View household information and manage your personal settings.'
          }
        </p>
      </div>

      {/* Household Info */}
      <div className="mario-card mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Household Information</h2>
        <div className="space-y-2">
          <p><strong>Name:</strong> {household.name}</p>
          <p><strong>Members:</strong> {members.length}</p>
          <p><strong>Created:</strong> {formatDate(household.createdAt)}</p>
        </div>
      </div>

      {/* LLM Gem Calculation Prompt - Only for Head of Household */}
      {isHeadOfHousehold && (
        <div className="mario-card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={20} className="text-mario-blue" />
            <h2 className="text-xl font-bold text-gray-800">AI Gem Calculation</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Configure how the AI determines gem values for tasks. This prompt guides the AI in evaluating task difficulty and time requirements.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="gemPrompt" className="block text-sm font-bold text-gray-700 mb-2">
                Gem Calculation Guidelines
              </label>
              <textarea
                id="gemPrompt"
                value={gemPrompt}
                onChange={(e) => setGemPrompt(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mario-blue focus:border-transparent"
                placeholder="Enter guidelines for how the AI should calculate gem values..."
              />
            </div>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  id="allowGemOverride"
                  checked={allowGemOverride}
                  onChange={(e) => setAllowGemOverride(e.target.checked)}
                  className="w-4 h-4 text-mario-blue"
                />
                <label htmlFor="allowGemOverride" className="text-sm font-bold text-gray-700">
                  Allow users to override AI-calculated gem values
                </label>
              </div>
              <p className="text-xs text-gray-600">
                {allowGemOverride 
                  ? "Users can manually adjust gem values after AI calculation."
                  : "Users must use the AI-calculated gem values and cannot modify them."
                }
              </p>
            </div>
            
            <button
              onClick={handleSaveGemPrompt}
              disabled={savingPrompt}
              className="mario-button flex items-center gap-2"
            >
              <Save size={16} />
              {savingPrompt ? 'Saving...' : 'Save Prompt'}
            </button>
          </div>
        </div>
      )}

      {/* Invite Link Section - Only for Head of Household */}
      {isHeadOfHousehold && (
        <div className="mario-card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link size={20} className="text-mario-blue" />
            <h2 className="text-xl font-bold text-gray-800">Invite New Members</h2>
          </div>
          
          {!inviteLink ? (
            <button
              onClick={handleGenerateInviteLink}
              disabled={generatingLink}
              className="mario-button flex items-center gap-2"
            >
              <Plus size={16} />
              {generatingLink ? 'Generating...' : 'Generate Invite Link'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Share this link to invite new members:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="mario-button-blue flex items-center gap-2 text-xs"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={handleGenerateInviteLink}
                disabled={generatingLink}
                className="mario-button text-xs"
              >
                Generate New Link
              </button>
            </div>
          )}
        </div>
      )}

      {/* Members List */}
      <div className="mario-card">
        <div className="flex items-center gap-3 mb-6">
          <Users size={20} className="text-mario-blue" />
          <h2 className="text-xl font-bold text-gray-800">Household Members</h2>
        </div>

        <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {member.id === household.headOfHousehold ? (
                      <Crown size={20} className="text-yellow-500" />
                    ) : (
                      <User size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{member.displayName}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{member.gems.toLocaleString()} gems</span>
                      <span>
                        {member.id === household.headOfHousehold ? 'Head of Household' : 'Member'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove button - only for head of household and not for themselves */}
                {isHeadOfHousehold && member.id !== user.id && member.id !== household.headOfHousehold && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removingMember === member.id}
                    className="mario-button-blue flex items-center gap-2 text-xs"
                  >
                    <Trash2 size={14} />
                    {removingMember === member.id ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Notification Settings Section */}
      <div className="mario-card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User size={20} className="text-mario-blue" />
          <h2 className="text-xl font-bold text-mario-blue">Notification Settings</h2>
        </div>
        
        <NotificationPermission 
          onPermissionChange={(granted) => {
            console.log('Notification permission changed:', granted);
          }}
        />
        
        {/* Test Notification Button */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Test Notifications</h3>
          <div className="space-y-2">
            <button
              onClick={async () => {
                console.log('Test notification button clicked');
                console.log('Notification.permission:', Notification.permission);
                
                // Test local notification
                if (Notification.permission === 'granted') {
                  console.log('Creating notification...');
                  const notification = new Notification('Test Notification', {
                    body: 'This is a test notification from BlueSlash!',
                    icon: '/icons/icon-192x192.png',
                    tag: 'test-notification'
                  });
                  
                  notification.onclick = () => {
                    console.log('Notification clicked!');
                    notification.close();
                  };
                  
                  notification.onerror = (error) => {
                    console.error('Notification error:', error);
                  };
                  
                  console.log('Notification created:', notification);
                } else {
                  console.log('Notification permission not granted:', Notification.permission);
                  alert(`Notification permission: ${Notification.permission}. Please enable notifications first.`);
                }
              }}
              className="mario-button mario-button-blue text-sm mr-2"
            >
              Local Test Notification
            </button>
            
            <button
              onClick={async () => {
                console.log('Triggering scheduled notifications check...');
                try {
                  // Call the Firebase Function using the SDK
                  const triggerScheduledNotifications = httpsCallable(functions, 'triggerScheduledNotifications');
                  const result = await triggerScheduledNotifications();
                  
                  console.log('Scheduled notifications result:', result.data);
                  alert('Scheduled notifications check triggered! Check console and Firebase logs for results.');
                } catch (error) {
                  console.error('Error triggering scheduled notifications:', error);
                  alert('Error triggering scheduled notifications. Check console for details.');
                }
              }}
              className="mario-button mario-button-red text-sm"
            >
              Trigger Scheduled Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('HouseholdSettings render error:', error);
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mario-card text-center py-12">
          <p className="text-red-600">Error loading household settings</p>
          <p className="text-gray-600 mt-2">Please try refreshing the page</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mario-button mt-4"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default HouseholdSettings;