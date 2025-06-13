import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Home, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { joinHouseholdByInvite } from '../services/households';

const Invite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signIn, refreshUser } = useAuth();
  const { } = useHousehold();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const hasProcessedRef = useRef(false);

  const handleJoinHousehold = useCallback(async () => {
    if (!token || !user || hasProcessedRef.current || processing || success) {
      console.log('handleJoinHousehold: Skipping', { 
        token: !!token, 
        user: !!user, 
        hasProcessed: hasProcessedRef.current,
        processing,
        success
      });
      return;
    }

    console.log('handleJoinHousehold: Starting invite processing', { token, userId: user.id });
    hasProcessedRef.current = true;

    try {
      setProcessing(true);
      setError(null);
      
      console.log('handleJoinHousehold: Calling joinHouseholdByInvite');
      const updatedHousehold = await joinHouseholdByInvite(token, user.id);
      
      console.log('handleJoinHousehold: Successfully joined household:', updatedHousehold.id);
      
      // Clear the saved token immediately after successful join
      localStorage.removeItem('pendingInviteToken');
      
      console.log('handleJoinHousehold: Success! Setting success state');
      setSuccess(true);
      
      // Force refresh the auth context with updated user data
      console.log('handleJoinHousehold: Refreshing auth context');
      await refreshUser();
      
      // No need to manually refresh household data - real-time listeners handle this
      console.log('handleJoinHousehold: Real-time listeners will update household data');
      
      // Wait a bit to ensure state updates, then navigate
      setTimeout(() => {
        console.log('handleJoinHousehold: Navigating to dashboard');
        navigate('/dashboard', { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error('Error joining household:', error);
      setError(error instanceof Error ? error.message : 'Failed to join household');
      localStorage.removeItem('pendingInviteToken');
      hasProcessedRef.current = false; // Allow retry on error
    } finally {
      setProcessing(false);
    }
  }, [token, user?.id, refreshUser, navigate]); // Removed processing and success from dependencies

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      setError('Failed to sign in. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  useEffect(() => {
    // Early exit if we've already succeeded - don't do any processing
    if (success) {
      console.log('Invite useEffect: Already successful, skipping');
      return;
    }

    console.log('Invite useEffect:', { token, user: !!user, hasToken: !!token, hasProcessed: hasProcessedRef.current, processing, success });
    
    if (!token) {
      console.log('Invite useEffect: No token, setting error');
      setError('Invalid invite link');
      return;
    }

    // Save the token in localStorage so we can use it after login
    localStorage.setItem('pendingInviteToken', token);
    console.log('Invite useEffect: Saved token to localStorage');

    // If user is logged in and not already processed/processing, process the invite
    if (user && !hasProcessedRef.current && !processing) {
      console.log('Invite useEffect: User is logged in, calling handleJoinHousehold');
      handleJoinHousehold();
    } else {
      console.log('Invite useEffect: Conditions not met', { 
        user: !!user, 
        hasProcessed: hasProcessedRef.current,
        processing
      });
    }
  }, [token, user, processing, success]); // Removed handleJoinHousehold from dependencies

  // If user is not authenticated, show login message
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        <div className="max-w-md w-full">
          <div className="mario-card text-center">
            <Users className="mx-auto text-mario-blue mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Household Invitation
            </h1>
            <p className="text-gray-600 font-normal mb-6">
              You've been invited to join a household! Please sign in to continue.
            </p>
            
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-600 font-normal">{error}</p>
              </div>
            )}
            
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="mario-button w-full flex items-center justify-center gap-2 mb-6"
            >
              {signingIn ? (
                <div className="loading-spinner w-5 h-5" />
              ) : (
                <LogIn size={20} />
              )}
              Sign in with Google
            </button>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-normal">
                We've saved your invitation. After signing in, you'll automatically join the household.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        <div className="max-w-md w-full">
          <div className="mario-card text-center">
            <CheckCircle className="mx-auto text-mario-green mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to the Household!
            </h1>
            <p className="text-gray-600 font-normal mb-6">
              You've successfully joined the household. Redirecting to dashboard...
            </p>
            <div className="loading-spinner w-8 h-8 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        <div className="max-w-md w-full">
          <div className="mario-card text-center">
            <XCircle className="mx-auto text-red-500 mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Invitation Error
            </h1>
            <p className="text-gray-600 font-normal mb-6">
              {error}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mario-button-blue w-full flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        <div className="max-w-md w-full">
          <div className="mario-card text-center">
            <Users className="mx-auto text-mario-blue mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Joining Household...
            </h1>
            <p className="text-gray-600 font-normal mb-6">
              Processing your invitation, please wait.
            </p>
            <div className="loading-spinner w-8 h-8 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Default state - should not be reached
  return null;
};

export default Invite;