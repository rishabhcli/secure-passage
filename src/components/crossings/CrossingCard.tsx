import { cn } from '@/lib/utils';
import { CrossingListItem, CrossingStatus } from '@/types/airlock';
import { StatusBadge } from '@/components/status/StatusBadge';
import { ArrowRight, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';

function getStatusVariant(status: CrossingStatus) {
  const map: Record<CrossingStatus, 'pending' | 'verified' | 'awaiting' | 'blocked' | 'sending' | 'sent' | 'denied' | 'failed'> = {
    received: 'pending',
    verifying_source: 'pending',
    ready_for_review: 'awaiting',
    blocked_pre_review: 'blocked',
    sending: 'sending',
    sent: 'sent',
    denied: 'denied',
    failed: 'failed',
  };
  return map[status];
}

function getStatusLabel(status: CrossingStatus) {
  const map: Record<CrossingStatus, string> = {
    received: 'Received',
    verifying_source: 'Verifying',
    ready_for_review: 'Review Required',
    blocked_pre_review: 'Blocked',
    sending: 'Sending',
    sent: 'Sent',
    denied: 'Denied',
    failed: 'Failed',
  };
  return map[status];
}

interface CrossingCardProps {
  crossing: CrossingListItem;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CrossingCard({ crossing, isSelected, onClick }: CrossingCardProps) {
  const sourceRef = `${crossing.source_repo_owner}/${crossing.source_repo_name}#${crossing.source_issue_number}`;
  const ago = getTimeAgo(crossing.created_at);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border bg-card p-4 transition-all hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'border-primary/50 airlock-glow bg-accent/30',
        !isSelected && 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-mono text-muted-foreground truncate">{sourceRef}</span>
        </div>
        <StatusBadge variant={getStatusVariant(crossing.status)} label={getStatusLabel(crossing.status)} />
      </div>

      {crossing.source_title && (
        <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
          {crossing.source_title}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>GitHub</span>
        <ArrowRight className="h-3 w-3" />
        <span className="font-mono">{crossing.destination_channel_label}</span>
        <span className="ml-auto">{ago}</span>
      </div>

      {crossing.policy_reason_text && crossing.status === 'blocked_pre_review' && (
        <div className="mt-2 rounded border border-destructive/20 bg-destructive/5 px-2 py-1.5">
          <p className="text-xs text-destructive">{crossing.policy_reason_text}</p>
        </div>
      )}
    </button>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
