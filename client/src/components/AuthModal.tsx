import { useState } from 'react';
import { X, Mail, Wallet, BookOpen, Play, Unlock, Shield } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from './ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { connectWallet, isConnected } = useWallet();
  
  // Safe Privy hook usage with fallback
  let privyState = { login: null, authenticated: false, user: null };
  try {
    privyState = usePrivy();
  } catch (error) {
    console.log('Privy not available:', error);
  }
  
  const { login, authenticated, user } = privyState;
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState<'wallet' | 'email' | null>(null);

  const handleWalletConnect = async () => {
    setIsLoading(true);
    setLoadingMethod('wallet');
    try {
      await connectWallet();
      if (isConnected) {
        onClose();
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handlePrivyConnect = async () => {
    setIsLoading(true);
    setLoadingMethod('email');
    
    try {
      if (login) {
        await login();
        if (authenticated) {
          console.log('Privy authentication successful:', user);
          onClose();
        }
      } else {
        console.log('Privy is not properly configured. Please check your App ID.');
        alert('Email authentication requires proper Privy configuration. Please verify your App ID in the secrets.');
      }
    } catch (error) {
      console.error('Privy authentication failed:', error);
      alert('Authentication failed. Please check your Privy configuration.');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200"
          data-testid="button-close-auth-modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-cyan-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to <span className="text-cyan-400">U</span>THINK
          </h2>
          <p className="text-slate-600 dark:text-gray-300">Choose your login method</p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300">Token Access</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300">Live Sessions</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300">AI Courses</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Authentication Options */}
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={handleWalletConnect}
              disabled={isLoading}
              variant="outline"
              className="w-full flex items-center justify-center space-x-3 p-4 h-auto border-2 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
              data-testid="button-connect-wallet-modal"
            >
              <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-medium">Connect Wallet</p>
                <p className="text-xs opacity-75">
                  {isLoading && loadingMethod === 'wallet' ? 'Connecting...' : 'Use MetaMask or Web3 wallet'}
                </p>
              </div>
            </Button>

            <Button
              onClick={handlePrivyConnect}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 p-4 h-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              data-testid="button-connect-email"
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-medium">Email Login</p>
                <p className="text-xs opacity-75">
                  {isLoading && loadingMethod === 'email' ? 'Connecting...' : 'Email + assigned non-custodial wallet'}
                </p>
              </div>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-gray-400">
              <Shield className="w-3 h-3 inline mr-1" />
              Secure, decentralized authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}