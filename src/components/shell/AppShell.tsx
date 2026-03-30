import { ReactNode } from 'react';
import { Shield, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  user?: { displayName?: string; email?: string } | null;
}

export function AppShell({ children, user }: AppShellProps) {
  const location = useLocation();

  const navLinks = [
    { href: '/airlock', label: 'Dashboard' },
    { href: '/connect', label: 'Connections' },
    { href: '/demo', label: 'Demo' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/airlock" className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-display text-sm font-bold tracking-widest uppercase">AIRLOCK</span>
              </Link>
              <nav className="hidden sm:flex items-center gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                      location.pathname.startsWith(link.href)
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{user.displayName || user.email}</span>
                </div>
                <button className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
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
