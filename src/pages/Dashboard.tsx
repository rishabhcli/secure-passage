import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ReadinessStrip } from '@/components/status/ReadinessStrip';
import { CrossingCard } from '@/components/crossings/CrossingCard';
import { ReceiptCard } from '@/components/receipts/ReceiptCard';
import { CrossingReviewDrawer } from '@/components/review/CrossingReviewDrawer';
import { ActivityFeed } from '@/components/observability/ActivityFeed';
import { useStatusQuery, useCrossingsQuery } from '@/hooks/use-airlock-api';
import { useCrossingsRealtime } from '@/hooks/use-crossings-realtime';
import { useNavigate } from 'react-router-dom';
import { Inbox, FileCheck, Shield } from 'lucide-react';
import { MOCK_STATUS, MOCK_CROSSINGS } from '@/lib/mock-data';
import { AnimatePresence, motion } from 'framer-motion';

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useCrossingsRealtime();

  const { data: status, isLoading: statusLoading } = useStatusQuery();
  const { data: allCrossings, isLoading: crossingsLoading } = useCrossingsQuery();

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
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-primary" />
            <h1 className="font-display text-base font-semibold tracking-wide">Control Panel</h1>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            The local agent proposes — AIRLOCK decides whether it crosses the border.
          </p>
        </div>
      </div>

      {/* Readiness Strip */}
      <div className="mb-5">
        <ReadinessStrip status={effectiveStatus} isLoading={statusLoading} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pending Crossings */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-3.5 w-3.5 text-awaiting" />
            <h2 className="font-display text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Pending Crossings
            </h2>
            {pending.length > 0 && (
              <span className="rounded bg-awaiting/10 text-awaiting border border-awaiting/20 px-1.5 py-0.5 text-[10px] font-mono font-medium">
                {pending.length}
              </span>
            )}
          </div>

          {crossingsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="rounded border border-border bg-card p-4 animate-pulse">
                  <div className="h-3.5 w-40 bg-muted rounded mb-3" />
                  <div className="h-3 w-28 bg-muted rounded mb-2" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="rounded border border-dashed border-border bg-card p-8 text-center dot-matrix">
              <Inbox className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No pending crossings</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                Use Demo to seed crossing scenarios
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {pending.map(crossing => (
                  <CrossingCard
                    key={crossing.id}
                    crossing={crossing}
                    isSelected={selectedId === crossing.id}
                    onClick={() => setSelectedId(crossing.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Receipts */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-2">
            <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="font-display text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Receipts
            </h2>
          </div>

          {receipts.length === 0 ? (
            <div className="rounded border border-dashed border-border bg-card p-6 text-center">
              <FileCheck className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[11px] text-muted-foreground">No receipts yet</p>
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

        {/* Activity Feed */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-verified status-pulse" />
            </div>
            <h2 className="font-display text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Observability
            </h2>
          </div>
          <ActivityFeed />
        </div>
      </div>

      {/* Review Drawer */}
      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
              onClick={() => setSelectedId(null)}
            />
            <CrossingReviewDrawer
              crossingId={selectedId}
              onClose={() => setSelectedId(null)}
              onApprove={() => setSelectedId(null)}
              onDeny={() => setSelectedId(null)}
            />
          </>
        )}
      </AnimatePresence>
    </AppShell>
  );
}