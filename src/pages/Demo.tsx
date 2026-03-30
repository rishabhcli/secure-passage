import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { useStatusQuery, useResetDemoMutation, useSeedValidMutation, useSeedBlockedMutation, useSendHeartbeatMutation } from '@/hooks/use-airlock-api';
import { MOCK_STATUS } from '@/lib/mock-data';
import { RotateCcw, Plus, Ban, Radio, AlertTriangle, CheckCircle2, Heart } from 'lucide-react';

export default function DemoPage() {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const { data: status } = useStatusQuery();
  const effectiveStatus = status || MOCK_STATUS;

  const resetMutation = useResetDemoMutation();
  const seedValidMutation = useSeedValidMutation();
  const seedBlockedMutation = useSeedBlockedMutation();
  const heartbeatMutation = useSendHeartbeatMutation();

  const handleReset = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => setLastAction('Demo state reset successfully'),
      onError: (err) => setLastAction(`Reset failed: ${err.message}`),
    });
  };

  const handleSeedValid = () => {
    seedValidMutation.mutate(undefined, {
      onSuccess: (data) => setLastAction(`Seeded valid crossing: ${data.crossingId}`),
      onError: (err) => setLastAction(`Seed failed: ${err.message}`),
    });
  };

  const handleSeedBlocked = () => {
    seedBlockedMutation.mutate(undefined, {
      onSuccess: (data) => setLastAction(`Seeded blocked crossing: ${data.crossingId}`),
      onError: (err) => setLastAction(`Seed failed: ${err.message}`),
    });
  };

  const handleHeartbeat = () => {
    heartbeatMutation.mutate({ companionId: 'companion-local-01' }, {
      onSuccess: () => setLastAction('Heartbeat sent successfully'),
      onError: (err) => setLastAction(`Heartbeat failed: ${err.message}`),
    });
  };

  return (
    <AppShell user={effectiveStatus.user}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-display text-lg font-bold tracking-wider uppercase">Demo Controls</h1>
          <StatusBadge variant="awaiting" label="Operational" showDot={false} />
        </div>
        <p className="text-xs text-muted-foreground">
          Protected operational tooling for staging and resetting demo scenarios.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Scenario Controls */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground">Scenario Controls</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleReset} disabled={resetMutation.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {resetMutation.isPending ? 'Resetting...' : 'Reset Demo State'}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleSeedValid} disabled={seedValidMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {seedValidMutation.isPending ? 'Seeding...' : 'Seed Valid Crossing'}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleSeedBlocked} disabled={seedBlockedMutation.isPending}>
              <Ban className="h-4 w-4 mr-2" />
              {seedBlockedMutation.isPending ? 'Seeding...' : 'Seed Blocked Crossing'}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleHeartbeat} disabled={heartbeatMutation.isPending}>
              <Heart className="h-4 w-4 mr-2" />
              {heartbeatMutation.isPending ? 'Sending...' : 'Send Heartbeat'}
            </Button>
          </div>
          {lastAction && (
            <div className="flex items-center gap-2 rounded-md bg-verified/10 px-3 py-2 text-xs text-verified">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {lastAction}
            </div>
          )}
        </section>

        {/* Runtime Mode */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground">Runtime Mode</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
              <span className="text-xs text-muted-foreground">GitHub Verify</span>
              <StatusBadge variant="awaiting" label="Mock" showDot={false} />
            </div>
            <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
              <span className="text-xs text-muted-foreground">Slack Send</span>
              <StatusBadge variant="awaiting" label="Mock" showDot={false} />
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-awaiting mt-0.5 shrink-0" />
            <span>Mock mode uses deterministic provider responses. Configure environment variables to enable real provider calls.</span>
          </div>
        </section>

        {/* Companion State */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground">Companion State</h2>
          <div className="flex items-center gap-3">
            <Radio className="h-4 w-4 text-muted-foreground" />
            <StatusBadge
              variant={effectiveStatus.companion.online ? 'online' : 'offline'}
              label={effectiveStatus.companion.online ? 'Online' : 'Offline'}
            />
          </div>
          {effectiveStatus.companion.lastSeen && (
            <p className="text-[10px] text-muted-foreground font-mono">
              Last heartbeat: {new Date(effectiveStatus.companion.lastSeen).toLocaleString()}
            </p>
          )}
          {effectiveStatus.companion.companionId && (
            <p className="text-[10px] text-muted-foreground font-mono">
              ID: {effectiveStatus.companion.companionId}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
