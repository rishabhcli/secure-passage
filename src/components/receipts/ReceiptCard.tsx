import { CrossingListItem } from '@/types/airlock';
import { StatusBadge } from '@/components/status/StatusBadge';
import { ArrowRight, CheckCircle2, Ban, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onClick}
      className="w-full text-left rounded border border-border bg-card p-3 transition-colors hover:border-primary/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${
          outcome.variant === 'sent' ? 'text-verified' :
          outcome.variant === 'blocked' ? 'text-destructive' : 'text-offline'
        }`} />
        <StatusBadge variant={outcome.variant} label={outcome.label} showDot={false} />
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          {crossing.id.slice(0, 6)}
        </span>
      </div>
      {crossing.source_title && (
        <p className="text-xs text-foreground mb-1 line-clamp-1">{crossing.source_title}</p>
      )}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
        <span>{sourceRef}</span>
        <ArrowRight className="h-2.5 w-2.5 text-primary/40" />
        <span>{crossing.destination_channel_label}</span>
      </div>
      {crossing.policy_reason_text && crossing.status === 'blocked_pre_review' && (
        <p className="text-[10px] text-destructive mt-1.5 line-clamp-1">{crossing.policy_reason_text}</p>
      )}
    </motion.button>
  );
}