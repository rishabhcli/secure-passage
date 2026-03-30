import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to realtime changes on crossings and crossing_events tables.
 * Automatically invalidates the relevant React Query caches when data changes.
 */
export function useCrossingsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('crossings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crossings' },
        (payload) => {
          // Invalidate list and detail queries
          queryClient.invalidateQueries({ queryKey: ['crossings'] });
          queryClient.invalidateQueries({ queryKey: ['status'] });

          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['crossing', payload.new.id] });
          }
          if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            queryClient.invalidateQueries({ queryKey: ['crossing', payload.old.id] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crossing_events' },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'crossing_id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['crossing', payload.new.crossing_id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
