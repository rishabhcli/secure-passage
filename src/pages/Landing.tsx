import { Shield, ArrowRight, Lock, Eye, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          <div className="rounded border border-primary/20 bg-primary/5 p-4 relative">
            <Shield className="h-10 w-10 text-primary" />
            <div className="absolute inset-0 rounded border border-primary/10 animate-pulse-glow" />
          </div>
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <h1 className="font-display text-4xl font-bold tracking-[0.25em] uppercase text-foreground">
            AIRLOCK
          </h1>
          <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mt-2">
            Permission Control for AI Agents
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto"
        >
          The visible checkpoint between sandboxed AI agents and real external systems.
          Every action is verified, reviewed, and controlled.
        </motion.p>

        {/* Flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground py-4"
        >
          <div className="rounded border border-border bg-card px-3 py-1.5 font-mono flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-muted-foreground" />
            Agent
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-primary/50" />
          <div className="rounded border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono text-primary flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            AIRLOCK
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-primary/50" />
          <div className="rounded border border-border bg-card px-3 py-1.5 font-mono flex items-center gap-1.5">
            <Eye className="h-3 w-3 text-muted-foreground" />
            Slack
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="grid grid-cols-3 gap-3 max-w-sm mx-auto"
        >
          {[
            { icon: Shield, label: 'Verify Source' },
            { icon: Eye, label: 'Review Payload' },
            { icon: Lock, label: 'Control Border' },
          ].map(f => (
            <div key={f.label} className="rounded border border-border bg-card p-3 text-center">
              <f.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-[10px] font-mono text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          <Button
            size="lg"
            className="w-full max-w-xs bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-widest uppercase text-sm border border-primary/50 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]"
            onClick={() => navigate('/login')}
          >
            Enter AIRLOCK
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-[10px] text-muted-foreground/50 font-mono"
        >
          v0.1 — The agent proposes. You decide.
        </motion.p>
      </div>
    </div>
  );
}