import { AppShell } from '@/components/shell/AppShell';
import { MOCK_STATUS } from '@/lib/mock-data';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Github, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConnectPage() {
  return (
    <AppShell user={MOCK_STATUS.user}>
      <div className="mb-6">
        <h1 className="font-display text-lg font-bold tracking-wider uppercase mb-1">Connections</h1>
        <p className="text-xs text-muted-foreground">
          AIRLOCK uses your connected accounts to verify sources and execute outbound actions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {/* GitHub */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-secondary p-2">
              <Github className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium">GitHub</h3>
              <p className="text-[10px] text-muted-foreground">Source verification</p>
            </div>
          </div>
          <StatusBadge
            variant={MOCK_STATUS.github.connected ? 'connected' : 'disconnected'}
            label={MOCK_STATUS.github.connected ? `Connected as ${MOCK_STATUS.github.username}` : 'Disconnected'}
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            AIRLOCK verifies GitHub issues server-side through your connected account. The local companion never accesses GitHub directly.
          </p>
          <Button variant="outline" size="sm" className="w-full text-xs">
            <ExternalLink className="h-3 w-3 mr-1.5" />
            Manage Connection
          </Button>
        </div>

        {/* Slack */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-secondary p-2">
              <MessageSquare className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Slack</h3>
              <p className="text-[10px] text-muted-foreground">Outbound execution</p>
            </div>
          </div>
          <StatusBadge
            variant={MOCK_STATUS.slack.connected ? 'connected' : 'disconnected'}
            label={MOCK_STATUS.slack.connected ? `Connected to ${MOCK_STATUS.slack.workspace}` : 'Disconnected'}
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            AIRLOCK sends approved messages to Slack through your connected account. Messages are only sent after explicit human approval.
          </p>
          <Button variant="outline" size="sm" className="w-full text-xs">
            <ExternalLink className="h-3 w-3 mr-1.5" />
            Manage Connection
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
