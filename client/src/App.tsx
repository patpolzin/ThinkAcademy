import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/components/WalletProvider";
import { PrivyProvider } from '@privy-io/react-auth';
import Dashboard from "@/pages/dashboard";

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cme35jx9100i6ky0bxiecsetb';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route>
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">404 Page Not Found</h1>
            <p className="text-slate-600">Return to dashboard</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  const AppContent = (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );

  // Only wrap with PrivyProvider if we have a valid App ID
  if (PRIVY_APP_ID && PRIVY_APP_ID !== 'your-privy-app-id') {
    return (
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#06b6d4', // cyan-500
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
        }}
      >
        {AppContent}
      </PrivyProvider>
    );
  }

  // Fallback without Privy if no valid App ID
  console.log('Running without Privy - no valid App ID configured');
  return AppContent;
}

export default App;
