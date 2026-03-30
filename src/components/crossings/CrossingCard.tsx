import { cn } from '@/lib/utils';
import { CrossingListItem, CrossingStatus } from '@/types/airlock';
import { StatusBadge } from '@/components/status/StatusBadge';
import { ArrowRight, GitBranch, Clock } from 'lucide-react';
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
    ready_for_review: 'Review',
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
  const isReviewable = crossing.status === 'ready_for_review';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded border bg-card p-4 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring relative overflow-hidden',
        isSelected && 'border-primary/40 airlock-glow bg-primary/5',
        !isSelected && 'border-border hover:border-primary/20',
        isReviewable && !isSelected && 'border-awaiting/20',
      )}
    >
      {/* Left accent bar */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-0.5',
        isReviewable ? 'bg-awaiting' : isSelected ? 'bg-primary' : 'bg-transparent',
      )} />

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-mono text-muted-foreground truncate">{sourceRef}</span>
        </div>
        <StatusBadge variant={getStatusVariant(crossing.status)} label={getStatusLabel(crossing.status)} />
      </div>

      {crossing.source_title && (
        <p className="text-sm font-medium text-foreground mb-2.5 line-clamp-2 leading-snug">
          {crossing.source_title}
        </p>
      )}

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-mono">GitHub</span>
        <ArrowRight className="h-3 w-3 text-primary/50" />
        <span className="font-mono">{crossing.destination_channel_label}</span>
        <div className="ml-auto flex items-center gap-1 text-muted-foreground/70">
          <Clock className="h-3 w-3" />
          <span>{ago}</span>
        </div>
      </div>

      {crossing.policy_reason_text && crossing.status === 'blocked_pre_review' && (
        <div className="mt-2.5 rounded border border-destructive/20 bg-destructive/5 px-2.5 py-1.5">
          <p className="text-[11px] text-destructive leading-relaxed">{crossing.policy_reason_text}</p>
        </div>
      )}
    </motion.button>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}