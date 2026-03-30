import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, ArrowRight, Shield, Ban, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityEntry {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
  crossing_id: string;
}

const eventIcons: Record<string, typeof Activity> = {
  'intent.received': ArrowRight,
  'source.verification.succeeded': CheckCircle2,
  'source.verification.failed': AlertTriangle,
  'policy.allowed.review': Shield,
  'policy.blocked': Ban,
  'send.started': Radio,
  'send.succeeded': CheckCircle2,
  'send.failed': AlertTriangle,
  'crossing.denied': Ban,
};

const eventColors: Record<string, string> = {
  'intent.received': 'text-muted-foreground',
  'source.verification.succeeded': 'text-verified',
  'source.verification.failed': 'text-destructive',
  'policy.allowed.review': 'text-awaiting',
  'policy.blocked': 'text-destructive',
  'send.started': 'text-sending',
  'send.succeeded': 'text-verified',
  'send.failed': 'text-destructive',
  'crossing.denied': 'text-offline',
};

export function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    // Fetch recent events
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('crossing_events')
        .select('id, event_type, message, created_at, crossing_id')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setEntries(data);
    };
    fetchRecent();

    // Subscribe to new events
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crossing_events' },
        (payload) => {
          const newEntry = payload.new as ActivityEntry;
          setEntries(prev => [newEntry, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="rounded border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-secondary/30">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[11px] font-display font-semibold tracking-widest uppercase text-muted-foreground">
          Live Activity
        </h3>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-verified status-pulse" />
          <span className="text-[10px] font-mono text-verified/70">LIVE</span>
        </div>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <Activity className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[11px] text-muted-foreground">No activity yet</p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Seed a crossing to see events</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {entries.map((entry, i) => {
              const Icon = eventIcons[entry.event_type] || Activity;
              const color = eventColors[entry.event_type] || 'text-muted-foreground';
              const time = new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={cn(
                    'flex items-start gap-2.5 px-3 py-2 border-b border-border/50 last:border-b-0',
                    i === 0 && 'bg-primary/[0.02]'
                  )}
                >
                  <Icon className={cn('h-3 w-3 mt-0.5 shrink-0', color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground leading-snug">{entry.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-mono text-muted-foreground/60">{entry.event_type}</span>
                      <span className="text-[9px] font-mono text-muted-foreground/40">{time}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}