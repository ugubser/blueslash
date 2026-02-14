import React, { useState } from 'react';
import { LogIn, Home, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signInWithDev, showDevSignIn } from '../services/auth';
import TermsModal from '../components/TermsModal';

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [devEmail, setDevEmail] = useState('test@example.com');
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState('');

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevSignIn = async () => {
    if (!devEmail) return;
    try {
      setDevError('');
      setDevLoading(true);
      await signInWithDev(devEmail);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Dev sign in failed:', error);
      setDevError(msg);
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mario-card text-center">
          {/* Logo and Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-mario-blue mb-4">
              BlueSlash
            </h1>
            <p className="text-gray-600 text-lg font-normal">
              Gamified Household Task Management
            </p>
          </div>

          {/* Features */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-3 text-left">
              <Home className="text-mario-blue flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-gray-800">Household Collaboration</h3>
                <p className="text-sm text-gray-600 font-normal">
                  Create and manage tasks with your household members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-left">
              <span className="text-2xl flex-shrink-0">💎</span>
              <div>
                <h3 className="font-bold text-gray-800">Earn Gems</h3>
                <p className="text-sm text-gray-600 font-normal">
                  Complete tasks and verify others' work to earn rewards
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-left">
              <CheckCircle className="text-mario-green flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-gray-800">Track Progress</h3>
                <p className="text-sm text-gray-600 font-normal">
                  See your household leaderboard and task completion
                </p>
              </div>
            </div>
          </div>

          {/* Native + emulator: show dev sign-in form instead of Google button */}
          {showDevSignIn ? (
            <div>
              <p className="text-sm text-gray-600 mb-3 font-normal">Dev Sign-In (Emulator)</p>
              <input
                type="email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-3 border border-gray-300 rounded text-base mb-3"
              />
              <button
                onClick={handleDevSignIn}
                disabled={devLoading || !devEmail}
                className="mario-button w-full flex items-center justify-center gap-3 py-4 text-base"
              >
                {devLoading ? (
                  <div className="loading-spinner w-5 h-5" />
                ) : (
                  <LogIn size={20} />
                )}
                Dev Sign In
              </button>
              {devError && (
                <p className="text-red-500 text-sm mt-3 font-normal">{devError}</p>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="mario-button w-full flex items-center justify-center gap-3 py-4 text-base"
              >
                {loading ? (
                  <div className="loading-spinner w-5 h-5" />
                ) : (
                  <LogIn size={20} />
                )}
                Sign in with Google
              </button>

              <p className="text-xs text-gray-500 mt-4 font-normal">
                By signing in, you agree to our{' '}
                <button
                  onClick={() => setShowTerms(true)}
                  className="text-mario-blue hover:text-mario-blue-dark underline focus:outline-none"
                >
                  terms of service and privacy policy
                </button>
                .
              </p>
            </>
          )}
        </div>

        {/* Mario-inspired decorative elements */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-4 text-3xl">
            <span className="animate-bounce">🍄</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>⭐</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🏆</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 mario-card text-center">
          <p className="text-sm text-gray-600 font-normal mb-2">
            Made in Switzerland 🇨🇭
          </p>
          <a
            href="https://github.com/ugubser/blueslash"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-mario-blue hover:text-mario-blue-dark transition-colors underline"
          >
            Learn more <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <TermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
      />
    </div>
  );
};

export default Login;