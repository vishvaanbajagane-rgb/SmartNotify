import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AppLayout } from "./components/layout/AppLayout"
import { LandingPage } from "./pages/LandingPage"
import { Dashboard } from "./pages/Dashboard"
import { Predictions } from "./pages/Predictions"
import { PredictionDetail } from "./pages/PredictionDetail"
import { Analytics } from "./pages/Analytics"
import { Upload } from "./pages/Upload"
import { Simulate } from "./pages/Simulate"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/predictions">
        <AppLayout><Predictions /></AppLayout>
      </Route>
      <Route path="/predictions/:messageId">
        <AppLayout><PredictionDetail /></AppLayout>
      </Route>
      <Route path="/analytics">
        <AppLayout><Analytics /></AppLayout>
      </Route>
      <Route path="/upload">
        <AppLayout><Upload /></AppLayout>
      </Route>
      <Route path="/simulate">
        <AppLayout><Simulate /></AppLayout>
      </Route>
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-mono">
          <div className="text-center">
            <h1 className="text-4xl text-primary mb-4">404</h1>
            <p>Signal lost.</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
