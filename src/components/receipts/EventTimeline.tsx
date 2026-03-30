import { CrossingEvent } from '@/types/airlock';
import { cn } from '@/lib/utils';

interface EventTimelineProps {
  events: CrossingEvent[];
}

const eventColors: Record<string, string> = {
  'intent.received': 'bg-muted-foreground',
  'source.verification.started': 'bg-sending',
  'source.verification.succeeded': 'bg-verified',
  'source.verification.failed': 'bg-destructive',
  'policy.allowed.review': 'bg-verified',
  'policy.blocked': 'bg-destructive',
  'review.opened': 'bg-muted-foreground',
  'approval.requested': 'bg-awaiting',
  'send.started': 'bg-sending',
  'send.succeeded': 'bg-verified',
  'send.failed': 'bg-destructive',
  'crossing.denied': 'bg-offline',
};

export function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={cn('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', eventColors[event.event_type] || 'bg-muted-foreground')} />
            {i < events.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
          </div>
          <div className="pb-4 min-w-0">
            <p className="text-xs text-foreground">{event.message}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground">{event.event_type}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(event.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
