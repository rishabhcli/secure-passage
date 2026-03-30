import { useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { StatusBadge } from '@/components/status/StatusBadge';
import { EventTimeline } from '@/components/receipts/EventTimeline';
import { MOCK_CROSSINGS, MOCK_EVENTS, MOCK_STATUS } from '@/lib/mock-data';
import { ArrowLeft, ExternalLink, Hash, Send, Ban, Shield } from 'lucide-react';

export default function CrossingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const crossing = MOCK_CROSSINGS.find(c => c.id === id);
  const events = MOCK_EVENTS.filter(e => e.crossing_id === id);

  if (!crossing) {
    return (
      <AppShell user={MOCK_STATUS.user}>
        <div className="flex flex-col items-center justify-center py-20">
          <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-display font-semibold mb-2">Crossing Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">This crossing does not exist or you do not have access.</p>
          <Link to="/airlock" className="text-xs text-primary hover:underline">← Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const isSent = crossing.status === 'sent';
  const isBlocked = crossing.status === 'blocked_pre_review';

  return (
    <AppShell user={MOCK_STATUS.user}>
      {/* Back + Status */}
      <div className="mb-6">
        <Link to="/airlock" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge
            variant={isSent ? 'sent' : isBlocked ? 'blocked' : 'pending'}
            label={crossing.status.replace(/_/g, ' ')}
          />
          <span className="text-xs text-muted-foreground font-mono">{crossing.id}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(crossing.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Source Evidence */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground">Source Evidence</h3>
              {crossing.source_verified_at && (
                <StatusBadge variant="verified" label="Verified" showDot={false} />
              )}
            </div>
            <p className="text-sm font-medium">{crossing.source_title}</p>
            <p className="text-xs font-mono text-muted-foreground">
              {crossing.source_repo_owner}/{crossing.source_repo_name}#{crossing.source_issue_number}
              {crossing.source_issue_url && (
                <a href={crossing.source_issue_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </p>
            {crossing.source_excerpt && (
              <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 leading-relaxed">{crossing.source_excerpt}</p>
            )}
            {crossing.source_labels && crossing.source_labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {crossing.source_labels.map(l => (
                  <span key={l} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-secondary-foreground">
                    <Hash className="h-2.5 w-2.5" />{l}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Outbound Payload */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground">Outbound Payload</h3>
              <StatusBadge
                variant={isSent ? 'sent' : isBlocked ? 'blocked' : 'awaiting'}
                label={isSent ? 'Sent' : isBlocked ? 'Blocked' : 'Awaiting'}
                showDot={false}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Send className="h-3.5 w-3.5" />
              <span>Slack → <span className="font-mono text-foreground">{crossing.destination_channel_label}</span></span>
            </div>
            <div className="payload-frame leading-relaxed whitespace-pre-wrap break-words">
              {crossing.proposed_text}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>{crossing.proposed_text.length} chars</span>
              <span>hash: {crossing.proposed_payload_hash}</span>
            </div>
          </section>

          {/* Block reason */}
          {isBlocked && crossing.policy_reason_text && (
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-2">
              <Ban className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Policy Blocked</p>
                <p className="text-xs text-destructive/80 mt-1">{crossing.policy_reason_text}</p>
              </div>
            </section>
          )}

          {/* Provenance */}
          {isSent && (
            <section className="rounded-lg border border-verified/20 bg-verified/5 p-4 space-y-2">
              <p className="text-xs text-verified">✓ Source verified through connected GitHub account</p>
              <p className="text-xs text-verified">✓ Message executed through connected Slack account</p>
              {crossing.approved_at && (
                <p className="text-[10px] text-verified/60 font-mono">Approved at {new Date(crossing.approved_at).toLocaleString()}</p>
              )}
              {crossing.slack_message_ts && (
                <p className="text-[10px] text-verified/60 font-mono">Slack ts: {crossing.slack_message_ts}</p>
              )}
            </section>
          )}
        </div>

        {/* Sidebar: Event Timeline */}
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground mb-4">Event Timeline</h3>
            {events.length > 0 ? (
              <EventTimeline events={events} />
            ) : (
              <p className="text-xs text-muted-foreground">No events recorded</p>
            )}
          </section>

          {crossing.rationale && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-xs font-display font-semibold tracking-wider uppercase text-muted-foreground mb-2">Companion Rationale</h3>
              <p className="text-xs text-muted-foreground italic">{crossing.rationale}</p>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
