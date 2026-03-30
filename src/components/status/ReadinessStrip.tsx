import { StatusBadge } from './StatusBadge';
import { StatusResponse } from '@/types/airlock';
import { Github, MessageSquare, Radio } from 'lucide-react';

interface ReadinessStripProps {
  status: StatusResponse | null;
  isLoading?: boolean;
}

export function ReadinessStrip({ status, isLoading }: ReadinessStripProps) {
  if (isLoading || !status) {
    return (
      <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 animate-pulse">
            <div className="h-4 w-4 rounded bg-muted-foreground/20" />
            <div className="h-3 w-20 rounded bg-muted-foreground/20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
        <Github className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-1">GitHub</span>
        <StatusBadge
          variant={status.github.connected ? 'connected' : 'disconnected'}
          label={status.github.connected ? (status.github.username || 'Connected') : 'Disconnected'}
        />
      </div>

      <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-1">Slack</span>
        <StatusBadge
          variant={status.slack.connected ? 'connected' : 'disconnected'}
          label={status.slack.connected ? (status.slack.workspace || 'Connected') : 'Disconnected'}
        />
      </div>

      <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
        <Radio className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-1">Companion</span>
        <StatusBadge
          variant={status.companion.online ? 'online' : 'offline'}
          label={status.companion.online ? 'Online' : 'Offline'}
        />
      </div>
    </div>
  );
}
