import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ReadinessStrip } from '@/components/status/ReadinessStrip';
import { CrossingCard } from '@/components/crossings/CrossingCard';
import { ReceiptCard } from '@/components/receipts/ReceiptCard';
import { CrossingReviewDrawer } from '@/components/review/CrossingReviewDrawer';
import { MOCK_STATUS, MOCK_CROSSINGS } from '@/lib/mock-data';
import { useNavigate } from 'react-router-dom';
import { Inbox, FileCheck } from 'lucide-react';

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const pending = MOCK_CROSSINGS.filter(c =>
    ['received', 'verifying_source', 'ready_for_review'].includes(c.status)
  );
  const receipts = MOCK_CROSSINGS.filter(c =>
    ['sent', 'blocked_pre_review', 'denied', 'failed'].includes(c.status)
  );

  const handleApprove = (id: string) => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSelectedId(null);
    }, 1500);
  };

  const handleDeny = (id: string) => {
    setSelectedId(null);
  };

  return (
    <AppShell user={MOCK_STATUS.user}>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground font-mono">
          A local agent can prepare the action. AIRLOCK decides whether it crosses the border.
        </p>
      </div>

      {/* Readiness Strip */}
      <div className="mb-6">
        <ReadinessStrip status={MOCK_STATUS} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pending Crossings */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Pending Crossings
            </h2>
            {pending.length > 0 && (
              <span className="rounded-full bg-awaiting/15 text-awaiting px-2 py-0.5 text-[10px] font-mono">
                {pending.length}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">
            Actions proposed by your local companion
          </p>

          {pending.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending crossings</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Your local companion can emit new crossing intents
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map(crossing => (
                <CrossingCard
                  key={crossing.id}
                  crossing={crossing}
                  isSelected={selectedId === crossing.id}
                  onClick={() => setSelectedId(crossing.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Receipts */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Recent Receipts
            </h2>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">
            What crossed the border, and what didn't
          </p>

          {receipts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
              <FileCheck className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No receipts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {receipts.map(crossing => (
                <ReceiptCard
                  key={crossing.id}
                  crossing={crossing}
                  onClick={() => navigate(`/airlock/crossings/${crossing.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Drawer */}
      {selectedId && (
        <>
          <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
          <CrossingReviewDrawer
            crossingId={selectedId}
            onClose={() => setSelectedId(null)}
            onApprove={handleApprove}
            onDeny={handleDeny}
            isSending={isSending}
          />
        </>
      )}
    </AppShell>
  );
}
