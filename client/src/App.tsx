import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/components/WalletProvider";
import { PrivyProvider } from '@privy-io/react-auth';
import Dashboard from "@/pages/dashboard";
import CourseDetailPage from "@/pages/course-detail";

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cme35jx9100i6ky0bxiecsetb';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/course/:id" component={CourseDetailPage} />
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

  // MetaMask authentication is fully functional
  // Privy email authentication requires additional Replit configuration
  // For Privy to work on Replit, contact Replit support to adjust CSP headers
  // that allow framing from auth.privy.io
  
  console.log('Running with MetaMask authentication - Privy requires CSP header changes');
  return AppContent;
}

export default App;
