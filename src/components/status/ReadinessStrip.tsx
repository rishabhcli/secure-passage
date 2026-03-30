import { StatusBadge } from './StatusBadge';
import { StatusResponse } from '@/types/airlock';
import { Github, MessageSquare, Radio, Activity } from 'lucide-react';

interface ReadinessStripProps {
  status: StatusResponse | null;
  isLoading?: boolean;
}

export function ReadinessStrip({ status, isLoading }: ReadinessStripProps) {
  if (isLoading || !status) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 rounded border border-border bg-card p-3 animate-pulse">
            <div className="h-8 w-8 rounded bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-2.5 w-24 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const panels = [
    {
      icon: Github,
      label: 'GitHub',
      connected: status.github.connected,
      detail: status.github.connected ? (status.github.username || 'Connected') : 'Not connected',
    },
    {
      icon: MessageSquare,
      label: 'Slack',
      connected: status.slack.connected,
      detail: status.slack.connected ? (status.slack.workspace || 'Connected') : 'Not connected',
    },
    {
      icon: Radio,
      label: 'Companion',
      connected: status.companion.online,
      detail: status.companion.online ? 'Online' : 'Offline',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {panels.map(panel => (
        <div key={panel.label} className="flex items-center gap-3 rounded border border-border bg-card p-3 group hover:border-primary/20 transition-colors">
          <div className={`rounded p-2 ${panel.connected ? 'bg-verified/10' : 'bg-muted'}`}>
            <panel.icon className={`h-4 w-4 ${panel.connected ? 'text-verified' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">{panel.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge
                variant={panel.connected ? 'connected' : 'disconnected'}
                label={panel.detail}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}