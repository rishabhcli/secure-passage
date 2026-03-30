import { ReactNode } from 'react';
import { Shield, LogOut, User, Terminal, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface AppShellProps {
  children: ReactNode;
  user?: { displayName?: string; email?: string } | null;
}

export function AppShell({ children, user: userProp }: AppShellProps) {
  const location = useLocation();
  const { user: authUser, signOut } = useAuth();

  const displayUser = authUser
    ? { displayName: authUser.user_metadata?.display_name || authUser.email, email: authUser.email }
    : userProp;

  const navLinks = [
    { href: '/airlock', label: 'Dashboard', icon: Zap },
    { href: '/connect', label: 'Connections', icon: Terminal },
    { href: '/demo', label: 'Demo', icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-lg neon-border-top">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-5">
              <Link to="/airlock" className="flex items-center gap-2 group">
                <div className="relative">
                  <Shield className="h-5 w-5 text-primary transition-all group-hover:drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
                </div>
                <span className="font-display text-sm font-bold tracking-[0.2em] uppercase text-foreground">
                  AIRLOCK
                </span>
              </Link>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <nav className="hidden sm:flex items-center gap-0.5">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'px-3 py-1.5 rounded text-xs font-medium transition-all',
                      location.pathname.startsWith(link.href)
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {displayUser && (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded px-2.5 py-1 border border-border">
                    <User className="h-3 w-3" />
                    <span className="font-mono text-[11px]">{displayUser.displayName || displayUser.email}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20"
                    title="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}