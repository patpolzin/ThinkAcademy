import { useState } from 'react';
import { X, Mail, Lock, Wallet, BookOpen, Play, Unlock } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { connectWallet, isConnected } = useWallet();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletConnect = async () => {
    setIsLoading(true);
    try {
      await connectWallet();
      if (isConnected) {
        onClose();
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock email authentication
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          data-testid="button-close-auth-modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to <span className="text-cyan-400">U</span>THINK</h2>
          <p className="text-slate-600">Access token-gated courses and live sessions</p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Unlock className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-600">Token Access</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Play className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-slate-600">Live Sessions</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-slate-600">AI Courses</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Authentication Options */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleWalletConnect}
              disabled={isLoading}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50"
              data-testid="button-connect-wallet-modal"
            >
              <Wallet className="w-4 h-4" />
              <span>{isLoading ? 'Connecting...' : 'Connect MetaMask Wallet'}</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with email</span>
              </div>
            </div>

            <Button
              onClick={() => {/* Toggle to email form */}}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              data-testid="button-email-auth-toggle"
            >
              <Mail className="w-4 h-4" />
              <span>Email + Assigned Wallet</span>
            </Button>
          </div>



          {/* Email Authentication Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              variant="outline"
              data-testid="button-email-auth"
            >
              {isLoading ? 'Signing in...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <button
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              className="text-primary-500 hover:text-primary-600"
              data-testid="button-switch-auth-mode"
            >
              {authMode === 'signin' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}