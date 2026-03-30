import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    // Also check hash
    if (window.location.hash.includes('type=recovery')) {
      setReady(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      navigate('/airlock');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Shield className="h-8 w-8 text-primary mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground font-mono">Verifying reset link…</p>
          <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <Shield className="h-8 w-8 text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-mono">Set your new password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-secondary border-border font-mono text-sm"
              />
            </div>
          </div>
          {error && (
            <div className="rounded-md bg-blocked/10 border border-blocked/20 px-3 py-2 text-xs text-blocked">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            <span className="font-mono text-xs">{submitting ? 'UPDATING…' : 'UPDATE PASSWORD'}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
