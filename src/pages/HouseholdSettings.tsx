import React, { useState, useEffect } from 'react';
import { Users, Link, Trash2, Copy, Plus, Crown, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { 
  generateInviteLink, 
  getHouseholdMembers, 
  removeMemberFromHousehold 
} from '../services/households';
import type { User as UserType } from '../types';

const HouseholdSettings: React.FC = () => {
  const { user } = useAuth();
  const { household, refreshHousehold } = useHousehold();
  const [members, setMembers] = useState<UserType[]>([]);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const isHeadOfHousehold = user && household && household.headOfHousehold === user.id;

  const loadMembers = async () => {
    if (!household) {
      console.log('No household found, skipping member load');
      setLoading(false);
      return;
    }
    
    console.log('Loading members for household:', household.id);
    
    try {
      setLoading(true);
      const householdMembers = await getHouseholdMembers(household.id);
      console.log('Loaded members:', householdMembers);
      setMembers(householdMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      // Set empty array as fallback
      setMembers([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('HouseholdSettings mounted, user:', user?.id, 'household:', household?.id, 'isHead:', isHeadOfHousehold);
    if (household) {
      loadMembers();
    } else {
      // If no household, ensure loading is false
      setLoading(false);
    }
  }, [household]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const handleGenerateInviteLink = async () => {
    if (!household || !isHeadOfHousehold) return;
    
    try {
      setGeneratingLink(true);
      const link = await generateInviteLink(household.id);
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
      await loadMembers();
      await refreshHousehold();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  console.log('HouseholdSettings render - user:', !!user, 'household:', !!household, 'loading:', loading, 'isHead:', isHeadOfHousehold);
  
  // Add error boundary for date formatting
  const formatDate = (date: any) => {
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      if (date && date.toDate) {
        return date.toDate().toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
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

  if (!isHeadOfHousehold) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mario-card text-center py-12">
          <p className="text-red-600">Only the head of household can access these settings.</p>
          <p className="text-gray-600 mt-2">Current head: {household?.headOfHousehold || 'Unknown'}</p>
          <p className="text-gray-600">Your ID: {user?.id || 'Unknown'}</p>
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
          Household Settings
        </h1>
        <p className="text-gray-600 font-normal">
          Manage your household members and invite new people to join.
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

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="loading-spinner w-8 h-8" />
          </div>
        ) : (
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
        )}
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