import { useState } from 'react';
import { Wallet, X } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { Button } from './ui/button';

export default function WalletConnect() {
  const { isConnected, address, connectWallet, disconnectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

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
      <div className="flex items-center space-x-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg">
        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        <span className="font-medium">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={disconnectWallet}
          className="text-emerald-600 hover:text-emerald-800"
          data-testid="button-disconnect-wallet"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center space-x-2"
      data-testid="button-connect-wallet"
    >
      <Wallet className="w-4 h-4" />
      <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
    </Button>
  );
}