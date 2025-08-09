import { useState } from 'react';
import { Wallet, X, LogIn } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import AuthModal from './AuthModal';

export default function WalletConnect() {
  const { isConnected, address, disconnectWallet } = useWallet();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-4 py-2 rounded-lg">
        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
        <span className="font-medium">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={disconnectWallet}
          className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200"
          data-testid="button-disconnect-wallet"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowAuthModal(true)}
        className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
        data-testid="button-login"
      >
        <LogIn className="w-4 h-4" />
        <span>Login</span>
      </Button>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}