import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { MOCK_STATUS } from '@/lib/mock-data';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { RotateCcw, Plus, Ban, Radio, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DemoPage() {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      setLastAction('Demo state reset successfully');
    }, 1000);
  };

  const handleSeedValid = () => {
    setIsSeeding(true);
    setTimeout(() => {
      setIsSeeding(false);
      setLastAction('Seeded valid crossing: valid_issue_alert');
    }, 800);
  };

  const handleSeedBlocked = () => {
    setIsSeeding(true);
    setTimeout(() => {
      setIsSeeding(false);
      setLastAction('Seeded blocked crossing: blocked_wrong_channel');
    }, 800);
  };

  return (
    <AppShell user={MOCK_STATUS.user}>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleReset}
              disabled={isResetting}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {isResetting ? 'Resetting...' : 'Reset Demo State'}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSeedValid}
              disabled={isSeeding}
            >
              <Plus className="h-4 w-4 mr-2" />
              Seed Valid Crossing
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSeedBlocked}
              disabled={isSeeding}
            >
              <Ban className="h-4 w-4 mr-2" />
              Seed Blocked Crossing
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
              variant={MOCK_STATUS.companion.online ? 'online' : 'offline'}
              label={MOCK_STATUS.companion.online ? 'Online' : 'Offline'}
            />
          </div>
          {MOCK_STATUS.companion.lastSeen && (
            <p className="text-[10px] text-muted-foreground font-mono">
              Last heartbeat: {new Date(MOCK_STATUS.companion.lastSeen).toLocaleString()}
            </p>
          )}
          {MOCK_STATUS.companion.companionId && (
            <p className="text-[10px] text-muted-foreground font-mono">
              ID: {MOCK_STATUS.companion.companionId}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
