import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/airlock" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMessage('Check your email to confirm your account before signing in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/airlock');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold tracking-widest uppercase">AIRLOCK</span>
          </Link>
          <p className="text-xs text-muted-foreground font-mono">
            {isSignUp ? 'Create your operator account' : 'Authenticate to access the control plane'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@company.com"
                required
                className="bg-secondary border-border font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-secondary border-border font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-blocked/10 border border-blocked/20 px-3 py-2 text-xs text-blocked">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-md bg-verified/10 border border-verified/20 px-3 py-2 text-xs text-verified">
              {message}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <span className="font-mono text-xs">AUTHENTICATING…</span>
            ) : (
              <span className="flex items-center gap-2 font-mono text-xs">
                {isSignUp ? 'CREATE ACCOUNT' : 'ENTER AIRLOCK'}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {!isSignUp && (
          <div className="text-center">
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Forgot password?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
