import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold tracking-widest uppercase">AIRLOCK</span>
          </Link>
          <p className="text-xs text-muted-foreground font-mono">Reset your password</p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 text-center">
            <div className="rounded-md bg-verified/10 border border-verified/20 px-3 py-3 text-xs text-verified">
              Check your email for a password reset link.
            </div>
            <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to login
            </Link>
          </div>
        ) : (
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
            </div>
            {error && (
              <div className="rounded-md bg-blocked/10 border border-blocked/20 px-3 py-2 text-xs text-blocked">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              <span className="font-mono text-xs">{submitting ? 'SENDING…' : 'SEND RESET LINK'}</span>
            </Button>
            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
