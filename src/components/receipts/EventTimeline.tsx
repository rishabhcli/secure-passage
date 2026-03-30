import { CrossingEvent } from '@/types/airlock';
import { cn } from '@/lib/utils';

interface EventTimelineProps {
  events: CrossingEvent[];
}

const eventColors: Record<string, string> = {
  'intent.received': 'bg-muted-foreground',
  'source.verification.started': 'bg-sending',
  'source.verification.succeeded': 'bg-verified shadow-[0_0_4px_hsl(var(--verified)/0.5)]',
  'source.verification.failed': 'bg-destructive',
  'policy.allowed.review': 'bg-verified',
  'policy.blocked': 'bg-destructive shadow-[0_0_4px_hsl(var(--blocked)/0.5)]',
  'review.opened': 'bg-muted-foreground',
  'approval.requested': 'bg-awaiting',
  'send.started': 'bg-sending shadow-[0_0_4px_hsl(var(--sending)/0.5)]',
  'send.succeeded': 'bg-verified shadow-[0_0_4px_hsl(var(--verified)/0.5)]',
  'send.failed': 'bg-destructive',
  'crossing.denied': 'bg-offline',
};

export function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={event.id} className="flex gap-3 group">
          <div className="flex flex-col items-center">
            <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', eventColors[event.event_type] || 'bg-muted-foreground')} />
            {i < events.length - 1 && <div className="w-px flex-1 bg-border/50 my-1" />}
          </div>
          <div className="pb-3.5 min-w-0">
            <p className="text-[11px] text-foreground leading-snug">{event.message}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-mono text-muted-foreground/50">{event.event_type}</span>
              <span className="text-[9px] font-mono text-muted-foreground/30">
                {new Date(event.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}