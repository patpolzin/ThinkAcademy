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

  // Temporarily disable Privy until domain configuration is complete
  // To enable Privy authentication, you need to:
  // 1. Go to dashboard.privy.io 
  // 2. Select your app with ID: cme35jx9100i6ky0bxiecsetb
  // 3. Go to Settings > Allowed origins
  // 4. Add: https://6ac68285-ddeb-45de-b1c5-523386a5591c-00-t7jltvvxcs2h.spock.replit.dev
  // 5. Save the configuration
  // 6. Then uncomment the PrivyProvider code below
  
  console.log('Privy is disabled until domain configuration is complete');
  console.log('Your domain to add to Privy: https://6ac68285-ddeb-45de-b1c5-523386a5591c-00-t7jltvvxcs2h.spock.replit.dev');
  
  return AppContent;

  /*
  if (PRIVY_APP_ID && PRIVY_APP_ID !== 'your-privy-app-id') {
    return (
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#06b6d4',
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
  return AppContent;
  */
}

export default App;
