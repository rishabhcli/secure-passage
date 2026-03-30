import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ReadinessStrip } from '@/components/status/ReadinessStrip';
import { CrossingCard } from '@/components/crossings/CrossingCard';
import { ReceiptCard } from '@/components/receipts/ReceiptCard';
import { CrossingReviewDrawer } from '@/components/review/CrossingReviewDrawer';
import { useStatusQuery, useCrossingsQuery } from '@/hooks/use-airlock-api';
import { useCrossingsRealtime } from '@/hooks/use-crossings-realtime';
import { useNavigate } from 'react-router-dom';
import { Inbox, FileCheck } from 'lucide-react';
import { MOCK_STATUS, MOCK_CROSSINGS } from '@/lib/mock-data';

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Subscribe to realtime updates
  useCrossingsRealtime();

  const { data: status, isLoading: statusLoading } = useStatusQuery();
  const { data: allCrossings, isLoading: crossingsLoading } = useCrossingsQuery();

  // Use real data if available, fallback to mock
  const effectiveStatus = status || MOCK_STATUS;
  const crossings = allCrossings || MOCK_CROSSINGS;

  const pending = crossings.filter(c =>
    ['received', 'verifying_source', 'ready_for_review'].includes(c.status)
  );
  const receipts = crossings.filter(c =>
    ['sent', 'blocked_pre_review', 'denied', 'failed'].includes(c.status)
  );

  return (
    <AppShell user={effectiveStatus.user}>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground font-mono">
          A local agent can prepare the action. AIRLOCK decides whether it crosses the border.
        </p>
      </div>

      {/* Readiness Strip */}
      <div className="mb-6">
        <ReadinessStrip status={effectiveStatus} isLoading={statusLoading} />
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

          {crossingsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                  <div className="h-4 w-48 bg-muted rounded mb-3" />
                  <div className="h-3 w-32 bg-muted rounded mb-2" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending crossings</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Use the Demo page to seed crossing scenarios
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
            onApprove={() => setSelectedId(null)}
            onDeny={() => setSelectedId(null)}
          />
        </>
      )}
    </AppShell>
  );
}
