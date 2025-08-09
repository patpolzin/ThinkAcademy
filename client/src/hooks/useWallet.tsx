import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTokenBalance } from "./useTokenBalance";
import { loadEthers, loadPrivy } from "@/lib/web3";
import { User } from "@shared/schema";

interface WalletContextType {
  user: User | null;
  isConnected: boolean;
  isConnecting: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  connectWallet: () => Promise<void>;
  connectEmail: (email: string) => Promise<void>;
  verifyEmailCode: (code: string) => Promise<void>;
  disconnectWallet: () => void;
  authMethod: 'wallet' | 'email' | null;
  setAuthMethod: (method: 'wallet' | 'email' | null) => void;
  emailLoginStep: 'email' | 'code' | 'success';
  setEmailLoginStep: (step: 'email' | 'code' | 'success') => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  isLoggingIn: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMethod, setAuthMethod] = useState<'wallet' | 'email' | null>(null);
  const [emailLoginStep, setEmailLoginStep] = useState<'email' | 'code' | 'success'>('email');
  const [userEmail, setUserEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { queryTokenBalances } = useTokenBalance();

  // Initialize web3 libraries
  useEffect(() => {
    loadEthers().catch(console.error);
    loadPrivy().catch(console.error);
  }, []);

  const connectWalletMutation = useMutation({
    mutationFn: async (walletData: {
      walletAddress: string;
      connectedWalletType: string;
      tokenBalances: Record<string, string>;
    }) => {
      const response = await apiRequest("POST", "/api/auth/connect-wallet", walletData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setIsConnected(true);
      setShowAuthModal(false);
      setAuthMethod(null);
    },
  });

  const connectEmailMutation = useMutation({
    mutationFn: async (emailData: {
      email: string;
      walletAddress: string;
    }) => {
      const response = await apiRequest("POST", "/api/auth/connect-email", emailData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setIsConnected(true);
      setShowAuthModal(false);
      setAuthMethod(null);
    },
  });

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Load ethers.js if not already loaded
      await loadEthers();

      let actualProvider = null;
      let actualAddress = null;

      if (window.ethereum) {
        try {
          // Try to connect to real wallet
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          if (accounts.length > 0) {
            actualAddress = accounts[0];
            actualProvider = new (window as any).ethers.BrowserProvider(window.ethereum);
          }
        } catch (error) {
          console.log('Real wallet connection failed, using mock:', error);
        }
      }
      
      // Use real connection if available, otherwise fallback to mock
      const finalAddress = actualAddress || '0x742d35Cc6434C0532925a3b5F3FBdA82b45234567';
      const finalProvider = actualProvider || new (window as any).ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com');
      
      // Query token balances
      const tokenBalances = await queryTokenBalances(finalAddress, finalProvider);
      
      await connectWalletMutation.mutateAsync({
        walletAddress: finalAddress,
        connectedWalletType: actualProvider ? 'metamask' : 'mock-wallet',
        tokenBalances,
      });
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectEmail = async (email: string) => {
    setIsLoggingIn(true);
    
    try {
      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserEmail(email);
      setEmailLoginStep('code');
      
    } catch (error) {
      console.error('Failed to send verification code:', error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const verifyEmailCode = async (code: string) => {
    setIsLoggingIn(true);
    
    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, any 6-digit code works
      if (code.length === 6) {
        // Create a deterministic embedded wallet address based on user email
        const emailHash = btoa(userEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const mockEmbeddedWalletAddress = `0x${emailHash}${'0'.repeat(32 - emailHash.length)}abc123`;
        
        await connectEmailMutation.mutateAsync({
          email: userEmail,
          walletAddress: mockEmbeddedWalletAddress,
        });
        
        setEmailLoginStep('success');
      } else {
        throw new Error('Invalid verification code');
      }
      
    } catch (error) {
      console.error('Failed to verify email code:', error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const disconnectWallet = () => {
    setUser(null);
    setIsConnected(false);
    setAuthMethod(null);
    setEmailLoginStep('email');
    setUserEmail('');
    setVerificationCode('');
  };

  const value: WalletContextType = {
    user,
    isConnected,
    isConnecting,
    showAuthModal,
    setShowAuthModal,
    connectWallet,
    connectEmail,
    verifyEmailCode,
    disconnectWallet,
    authMethod,
    setAuthMethod,
    emailLoginStep,
    setEmailLoginStep,
    userEmail,
    setUserEmail,
    verificationCode,
    setVerificationCode,
    isLoggingIn,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Wrap the main App component with WalletProvider in App.tsx
