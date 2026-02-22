import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Compose from "./pages/Compose";
import Posts from "./pages/Posts";
import Platforms from "./pages/Platforms";
import Subscription from "./pages/Subscription";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import AppShell from "./components/AppShell";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/compose" component={Compose} />
      <Route path="/posts" component={Posts} />
      <Route path="/platforms" component={Platforms} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/profile" component={Profile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: "oklch(0.14 0.015 260)",
                border: "1px solid oklch(0.22 0.02 260)",
                color: "oklch(0.95 0.01 260)",
              },
            }}
          />
          <AppShell>
            <Router />
          </AppShell>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
