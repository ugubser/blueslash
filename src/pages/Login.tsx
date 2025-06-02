import React, { useState } from 'react';
import { LogIn, Home, Coins, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

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
              <Coins className="text-mario-yellow flex-shrink-0" size={24} />
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

          {/* Sign In Button */}
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
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>

        {/* Mario-inspired decorative elements */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-4 text-3xl">
            <span className="animate-bounce">🍄</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>⭐</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🏆</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;