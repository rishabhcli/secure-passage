import { StatusBadge } from '@/components/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { useCrossingDetailQuery, useApproveSendMutation, useDenyCrossingMutation } from '@/hooks/use-airlock-api';
import { MOCK_CROSSINGS } from '@/lib/mock-data';
import { X, ExternalLink, Shield, Send, Ban, CheckCircle2, Copy, Hash, GitBranch } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface CrossingReviewDrawerProps {
  crossingId: string | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
}

export function CrossingReviewDrawer({ crossingId, onClose, onApprove, onDeny }: CrossingReviewDrawerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { data: detail, isLoading } = useCrossingDetailQuery(crossingId);
  const approveMutation = useApproveSendMutation();
  const denyMutation = useDenyCrossingMutation();

  const crossing = detail?.crossing || MOCK_CROSSINGS.find(c => c.id === crossingId);

  const isReviewable = crossing?.status === 'ready_for_review';
  const isSending = approveMutation.isPending;

  const handleApprove = useCallback(() => {
    if (!crossing) return;
    approveMutation.mutate(
      { crossingId: crossing.id, approvedPayloadHash: crossing.proposed_payload_hash },
      {
        onSuccess: () => {
          toast({ title: 'Message sent', description: 'Crossing approved and sent.' });
          onApprove?.(crossing.id);
        },
        onError: (err) => {
          toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
        },
      }
    );
  }, [crossing, approveMutation, toast, onApprove]);

  const handleDeny = useCallback(() => {
    if (!crossing) return;
    denyMutation.mutate(crossing.id, {
      onSuccess: () => {
        toast({ title: 'Crossing denied', description: 'The crossing has been denied.' });
        onDeny?.(crossing.id);
      },
      onError: (err) => {
        toast({ title: 'Deny failed', description: err.message, variant: 'destructive' });
      },
    });
  }, [crossing, denyMutation, toast, onDeny]);

  // Keyboard shortcuts: ⌘/Ctrl+Enter = approve, ⌘/Ctrl+Backspace = deny, Escape = close
  useEffect(() => {
    if (!crossingId) return;
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (mod && e.key === 'Enter' && isReviewable && !isSending) {
        e.preventDefault();
        handleApprove();
      } else if (mod && e.key === 'Backspace' && isReviewable && !denyMutation.isPending) {
        e.preventDefault();
        handleDeny();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [crossingId, isReviewable, isSending, denyMutation.isPending, handleApprove, handleDeny, onClose]);

  if (!crossingId || (!crossing && !isLoading)) return null;

  if (isLoading || !crossing) {
    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-background shadow-2xl overflow-y-auto"
      >
        <div className="px-4 py-5 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded border border-border bg-card p-4 animate-pulse">
              <div className="h-3.5 w-28 bg-muted rounded mb-3" />
              <div className="h-3 w-full bg-muted rounded mb-2" />
              <div className="h-3 w-2/3 bg-muted rounded" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const isBlocked = crossing.status === 'blocked_pre_review';
  const isSent = crossing.status === 'sent';

  const handleCopy = () => {
    navigator.clipboard.writeText(crossing.proposed_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const sourceLabels: string[] = Array.isArray(crossing.source_labels) ? crossing.source_labels : [];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 350, damping: 35 }}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-background shadow-2xl overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3 neon-border-top">
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-display text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Review</h2>
          <span className="text-[10px] font-mono text-muted-foreground/50">{crossing.id.slice(0, 8)}</span>
        </div>
        <button onClick={onClose} className="rounded p-1 hover:bg-accent transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <StatusBadge
            variant={isReviewable ? 'awaiting' : isBlocked ? 'blocked' : isSent ? 'sent' : 'pending'}
            label={crossing.status.replace(/_/g, ' ')}
          />
        </div>

        {/* Source */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-3 w-3 text-muted-foreground" />
            <h3 className="text-[10px] font-display font-semibold tracking-widest uppercase text-muted-foreground">Source</h3>
            {crossing.source_verified_at && (
              <StatusBadge variant="verified" label="Verified" showDot={false} />
            )}
          </div>
          <div className="rounded border border-border bg-card p-3 space-y-2">
            <p className="text-sm font-medium leading-snug">{crossing.source_title}</p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
              <span>{crossing.source_repo_owner}/{crossing.source_repo_name}#{crossing.source_issue_number}</span>
              {crossing.source_issue_url && (
                <a href={crossing.source_issue_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {crossing.source_excerpt && (
              <p className="text-[11px] text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-2.5">
                {crossing.source_excerpt}
              </p>
            )}
            {sourceLabels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {sourceLabels.map((label: string) => (
                  <span key={label} className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-secondary-foreground border border-border">
                    <Hash className="h-2 w-2" />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Outbound */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Send className="h-3 w-3 text-muted-foreground" />
            <h3 className="text-[10px] font-display font-semibold tracking-widest uppercase text-muted-foreground">Outbound</h3>
            <StatusBadge
              variant={isReviewable ? 'awaiting' : isBlocked ? 'blocked' : isSent ? 'sent' : 'pending'}
              label={isReviewable ? 'Awaiting' : isBlocked ? 'Blocked' : isSent ? 'Sent' : crossing.write_check_status.replace(/_/g, ' ')}
              showDot={false}
            />
          </div>
          <div className="rounded border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
              <span>Slack →</span>
              <span className="text-foreground">{crossing.destination_channel_label}</span>
            </div>
            <div className="relative">
              <div className="payload-frame leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto text-[12px]">
                {crossing.proposed_text}
              </div>
              <button onClick={handleCopy} className="absolute top-2 right-2 rounded p-1 bg-secondary/80 hover:bg-secondary transition-colors border border-border" title="Copy">
                {copied ? <CheckCircle2 className="h-3 w-3 text-verified" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 font-mono">
              <span>{crossing.proposed_text.length} chars</span>
              <span>hash: {crossing.proposed_payload_hash}</span>
            </div>
          </div>
        </section>

        {/* Policy block */}
        {isBlocked && crossing.policy_reason_text && (
          <section className="rounded border border-destructive/25 bg-destructive/5 p-3">
            <div className="flex items-start gap-2">
              <Ban className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-destructive">Policy Blocked</p>
                <p className="text-[11px] text-destructive/70 mt-0.5">{crossing.policy_reason_text}</p>
              </div>
            </div>
          </section>
        )}

        {/* Rationale */}
        {crossing.rationale && (
          <section className="space-y-1.5">
            <h3 className="text-[10px] font-display font-semibold tracking-widest uppercase text-muted-foreground">Rationale</h3>
            <p className="text-[11px] text-muted-foreground italic leading-relaxed">{crossing.rationale}</p>
          </section>
        )}

        {/* Provenance */}
        {isSent && (
          <section className="rounded border border-verified/15 bg-verified/5 p-3 space-y-1.5">
            <p className="text-[11px] text-verified flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> Source verified via GitHub
            </p>
            <p className="text-[11px] text-verified flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> Sent via Slack
            </p>
            {crossing.slack_message_ts && (
              <p className="text-[9px] font-mono text-verified/40">ts: {crossing.slack_message_ts}</p>
            )}
          </section>
        )}
      </div>

      {/* Footer */}
      {isReviewable && (
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur px-4 py-3">
          <p className="text-[10px] text-muted-foreground mb-2.5 font-mono">
            Approving executes this message through your connected Slack.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
              onClick={handleDeny}
              disabled={denyMutation.isPending}
            >
              <Ban className="h-3.5 w-3.5 mr-1.5" />
              Deny
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]"
              onClick={handleApprove}
              disabled={isSending}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {isSending ? 'Sending...' : 'Approve & Send'}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}