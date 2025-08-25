import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  tokenBalances: Record<string, string>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateTokenBalances: (balances: Record<string, string>) => void;
  setPrivyConnection: (address: string) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({
    'THINK': '1000',
    'NFT': '5'
  });

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
  };

  const updateTokenBalances = (balances: Record<string, string>) => {
    setTokenBalances(balances);
  };

  const setPrivyConnection = (privyAddress: string) => {
    setAddress(privyAddress);
    setIsConnected(true);
    console.log('Privy wallet connected:', privyAddress);
  };

  useEffect(() => {
    // Check if already connected via MetaMask
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        })
        .catch(console.error);
    }
  }, []);

  const value = {
    isConnected,
    address,
    tokenBalances,
    connectWallet,
    disconnectWallet,
    updateTokenBalances,
    setPrivyConnection
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Add window.ethereum type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}