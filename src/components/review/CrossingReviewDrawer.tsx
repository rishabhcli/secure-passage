import { StatusBadge } from '@/components/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { useCrossingDetailQuery, useApproveSendMutation, useDenyCrossingMutation } from '@/hooks/use-airlock-api';
import { MOCK_CROSSINGS } from '@/lib/mock-data';
import { X, ExternalLink, Shield, Send, Ban, CheckCircle2, Copy, Hash } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Use API data, fallback to mock
  const crossing = detail?.crossing || MOCK_CROSSINGS.find(c => c.id === crossingId);

  if (!crossingId || (!crossing && !isLoading)) return null;

  if (isLoading || !crossing) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-border bg-background shadow-2xl overflow-y-auto">
        <div className="px-5 py-5 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded mb-3" />
              <div className="h-3 w-full bg-muted rounded mb-2" />
              <div className="h-3 w-2/3 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isReviewable = crossing.status === 'ready_for_review';
  const isBlocked = crossing.status === 'blocked_pre_review';
  const isSent = crossing.status === 'sent';
  const isSending = approveMutation.isPending;

  const handleCopy = () => {
    navigator.clipboard.writeText(crossing.proposed_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = () => {
    approveMutation.mutate(
      { crossingId: crossing.id, approvedPayloadHash: crossing.proposed_payload_hash },
      {
        onSuccess: () => {
          toast({ title: 'Message sent', description: 'Crossing approved and sent through connected Slack account.' });
          onApprove?.(crossing.id);
        },
        onError: (err) => {
          toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleDeny = () => {
    denyMutation.mutate(crossing.id, {
      onSuccess: () => {
        toast({ title: 'Crossing denied', description: 'The crossing has been denied.' });
        onDeny?.(crossing.id);
      },
      onError: (err) => {
        toast({ title: 'Deny failed', description: err.message, variant: 'destructive' });
      },
    });
  };

  const sourceLabels: string[] = Array.isArray(crossing.source_labels) ? crossing.source_labels : [];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 350, damping: 35 }}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-border bg-background shadow-2xl overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-5 py-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-display text-sm font-semibold tracking-wider uppercase">Crossing Review</h2>
        </div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-accent transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 py-5 space-y-6">
        {/* Status */}
        <div className="flex items-center gap-3">
          <StatusBadge
            variant={isReviewable ? 'awaiting' : isBlocked ? 'blocked' : isSent ? 'sent' : 'pending'}
            label={crossing.status.replace(/_/g, ' ')}
          />
          <span className="text-xs text-muted-foreground font-mono">{crossing.id.slice(0, 8)}</span>
        </div>

        {/* Verified Source */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground">Verified Source</h3>
            {crossing.source_verified_at && (
              <StatusBadge variant="verified" label="GitHub verified" showDot={false} />
            )}
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-medium">{crossing.source_title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span>{crossing.source_repo_owner}/{crossing.source_repo_name}#{crossing.source_issue_number}</span>
              {crossing.source_issue_url && (
                <a href={crossing.source_issue_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {crossing.source_excerpt && (
              <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
                {crossing.source_excerpt}
              </p>
            )}
            {sourceLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sourceLabels.map((label: string) => (
                  <span key={label} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-secondary-foreground">
                    <Hash className="h-2.5 w-2.5" />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Outbound Action */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground">Outbound Action</h3>
            <StatusBadge
              variant={isReviewable ? 'awaiting' : isBlocked ? 'blocked' : isSent ? 'sent' : 'pending'}
              label={isReviewable ? 'Awaiting approval' : isBlocked ? 'Blocked' : isSent ? 'Sent' : crossing.write_check_status.replace(/_/g, ' ')}
              showDot={false}
            />
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Send className="h-3.5 w-3.5" />
              <span>Slack → <span className="font-mono text-foreground">{crossing.destination_channel_label}</span></span>
            </div>
            <div className="relative">
              <div className="payload-frame leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {crossing.proposed_text}
              </div>
              <button onClick={handleCopy} className="absolute top-2 right-2 rounded p-1 bg-secondary/80 hover:bg-secondary transition-colors" title="Copy payload">
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-verified" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>{crossing.proposed_text.length} chars</span>
              <span>hash: {crossing.proposed_payload_hash}</span>
            </div>
          </div>
        </section>

        {/* Policy block reason */}
        {isBlocked && crossing.policy_reason_text && (
          <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-2">
              <Ban className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Policy Blocked</p>
                <p className="text-xs text-destructive/80 mt-1">{crossing.policy_reason_text}</p>
              </div>
            </div>
          </section>
        )}

        {/* Rationale */}
        {crossing.rationale && (
          <section className="space-y-2">
            <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground">Companion Rationale</h3>
            <p className="text-xs text-muted-foreground italic">{crossing.rationale}</p>
          </section>
        )}

        {/* Provenance (for sent crossings) */}
        {isSent && (
          <section className="space-y-2 rounded-lg border border-verified/20 bg-verified/5 p-4">
            <p className="text-xs text-verified">✓ Source verified through connected GitHub account</p>
            <p className="text-xs text-verified">✓ Message executed through connected Slack account</p>
            {crossing.slack_message_ts && (
              <p className="text-[10px] font-mono text-verified/60">Slack ts: {crossing.slack_message_ts}</p>
            )}
          </section>
        )}
      </div>

      {/* Action Footer */}
      {isReviewable && (
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur px-5 py-4">
          <p className="text-[10px] text-muted-foreground mb-3">
            Approving will execute this message through your connected Slack account.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDeny} disabled={denyMutation.isPending}>
              <Ban className="h-4 w-4 mr-2" />
              Deny
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleApprove} disabled={isSending}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Approve & Send'}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
