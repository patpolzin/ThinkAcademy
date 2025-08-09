import { useState } from 'react';
import { Wallet, X, Mail, Shield } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';
import AuthModal from './AuthModal';

export default function WalletConnect() {
  const { isConnected, address, connectWallet, disconnectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3 bg-cyan-50 text-cyan-700 px-4 py-2 rounded-lg">
        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
        <span className="font-medium">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={disconnectWallet}
          className="text-cyan-600 hover:text-cyan-800"
          data-testid="button-disconnect-wallet"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          variant="outline"
          className="flex items-center space-x-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50"
          data-testid="button-connect-wallet"
        >
          <Wallet className="w-4 h-4" />
          <span>{isConnecting ? 'Connecting...' : 'MetaMask'}</span>
        </Button>
        
        <Button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          data-testid="button-connect-email"
        >
          <Mail className="w-4 h-4" />
          <span>Email + Wallet</span>
        </Button>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}