import { CrossingListItem } from '@/types/airlock';
import { StatusBadge } from '@/components/status/StatusBadge';
import { ArrowRight, CheckCircle2, Ban, XCircle } from 'lucide-react';

interface ReceiptCardProps {
  crossing: CrossingListItem;
  onClick?: () => void;
}

function getOutcome(crossing: CrossingListItem) {
  if (crossing.status === 'sent') return { label: 'Sent', variant: 'sent' as const, icon: CheckCircle2 };
  if (crossing.status === 'blocked_pre_review') return { label: 'Blocked', variant: 'blocked' as const, icon: Ban };
  if (crossing.status === 'denied') return { label: 'Denied', variant: 'denied' as const, icon: XCircle };
  return { label: 'Failed', variant: 'failed' as const, icon: XCircle };
}

export function ReceiptCard({ crossing, onClick }: ReceiptCardProps) {
  const outcome = getOutcome(crossing);
  const Icon = outcome.icon;
  const sourceRef = `${crossing.source_repo_owner}/${crossing.source_repo_name}#${crossing.source_issue_number}`;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-card p-3 transition-all hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5" style={{ color: `hsl(var(--${outcome.variant === 'sent' ? 'verified' : outcome.variant === 'blocked' ? 'destructive' : 'offline'}))` }} />
        <StatusBadge variant={outcome.variant} label={outcome.label} showDot={false} />
      </div>
      <p className="text-xs text-muted-foreground font-mono mb-1">{sourceRef}</p>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>GitHub</span>
        <ArrowRight className="h-2.5 w-2.5" />
        <span className="font-mono">{crossing.destination_channel_label}</span>
      </div>
      {crossing.policy_reason_text && crossing.status === 'blocked_pre_review' && (
        <p className="text-[10px] text-destructive mt-1.5 line-clamp-2">{crossing.policy_reason_text}</p>
      )}
    </button>
  );
}
