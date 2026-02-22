import { useAuth } from "@/_core/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Home,
  PlusCircle,
  LayoutGrid,
  Plug,
  BarChart3,
  User,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/posts", icon: LayoutGrid, label: "Posts" },
  { path: "/compose", icon: PlusCircle, label: "Create", primary: true },
  { path: "/platforms", icon: Plug, label: "Platforms" },
  { path: "/profile", icon: User, label: "Profile" },
];

function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-auto max-w-lg">
        <div
          className="glass mx-3 mb-3 rounded-2xl px-2 py-2"
          style={{
            background: "oklch(0.12 0.015 260 / 0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid oklch(0.22 0.02 260 / 0.6)",
            boxShadow: "0 8px 32px oklch(0 0 0 / 0.4)",
          }}
        >
          <div className="flex items-center justify-around">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              const Icon = item.icon;

              if (item.primary) {
                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      className="relative flex flex-col items-center"
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{
                          background: "var(--gradient-primary)",
                          boxShadow: "0 4px 16px oklch(0.72 0.18 280 / 0.4)",
                        }}
                      >
                        <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                      </div>
                    </motion.div>
                  </Link>
                );
              }

              return (
                <Link key={item.path} href={item.path}>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative flex flex-col items-center gap-1 px-3 py-1"
                  >
                    <div className="relative">
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors duration-200",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium transition-colors duration-200",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  const isLandingPage = location === "/";
  const showNav = isAuthenticated && !isLandingPage;

  return (
    <div className="relative min-h-dvh bg-background">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.72 0.18 280)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.65 0.20 320)" }}
        />
      </div>

      {/* Page content */}
      <main
        className={cn(
          "relative z-10 mx-auto max-w-lg min-h-dvh",
          showNav && "pb-28"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-dvh"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {showNav && <BottomNav />}
    </div>
  );
}
