import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  // In production, check auth and redirect. For now, show landing.
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo mark */}
        <div className="flex items-center justify-center gap-3">
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Wordmark */}
        <h1 className="font-display text-3xl font-bold tracking-[0.3em] uppercase">
          AIRLOCK
        </h1>

        {/* Promise */}
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          A local agent can prepare the action. AIRLOCK decides whether it crosses the border.
        </p>

        {/* Visual metaphor */}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground py-4">
          <span className="rounded border border-border px-2 py-1 font-mono">Local Agent</span>
          <ArrowRight className="h-4 w-4 text-primary" />
          <span className="rounded border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-primary">AIRLOCK</span>
          <ArrowRight className="h-4 w-4 text-primary" />
          <span className="rounded border border-border px-2 py-1 font-mono">External API</span>
        </div>

        {/* Login */}
        <Button
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider uppercase"
          onClick={() => navigate('/login')}
        >
          Enter AIRLOCK
        </Button>

        <p className="text-[10px] text-muted-foreground">
          Permission control for local AI agents
        </p>
      </div>
    </div>
  );
}
