import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StatusResponse, CrossingListItem, CrossingDetail, CrossingEvent } from '@/types/airlock';

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0] || '';

async function callFunction(name: string, options: {
  method?: string;
  params?: Record<string, string>;
  body?: unknown;
} = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// === STATUS ===
export function useStatusQuery() {
  return useQuery<StatusResponse>({
    queryKey: ['status'],
    queryFn: () => callFunction('status'),
    refetchInterval: 30000, // Light polling as fallback only
    retry: 1,
  });
}

// === CROSSINGS LIST ===
export function useCrossingsQuery(mode?: 'pending' | 'receipts') {
  return useQuery<CrossingListItem[]>({
    queryKey: ['crossings', mode],
    queryFn: () => callFunction('crossings', {
      params: mode ? { mode } : {},
    }),
    // No polling — realtime handles updates
    retry: 1,
  });
}

// === CROSSING DETAIL ===
export function useCrossingDetailQuery(id: string | null) {
  return useQuery<{ crossing: CrossingDetail; events: CrossingEvent[] }>({
    queryKey: ['crossing', id],
    queryFn: () => callFunction('crossings', {
      params: { action: 'detail', id: id! },
    }),
    enabled: !!id,
    retry: 1,
  });
}

// === APPROVE & SEND ===
export function useApproveSendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ crossingId, approvedPayloadHash }: { crossingId: string; approvedPayloadHash: string }) =>
      callFunction('crossings', {
        method: 'POST',
        params: { action: 'approve-send', id: crossingId },
        body: { approvedPayloadHash },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crossings'] });
      queryClient.invalidateQueries({ queryKey: ['crossing'] });
    },
  });
}

// === DENY ===
export function useDenyCrossingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (crossingId: string) =>
      callFunction('crossings', {
        method: 'POST',
        params: { action: 'deny', id: crossingId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crossings'] });
      queryClient.invalidateQueries({ queryKey: ['crossing'] });
    },
  });
}

// === DEMO ===
export function useResetDemoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callFunction('demo', { method: 'POST', params: { action: 'reset' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crossings'] });
      queryClient.invalidateQueries({ queryKey: ['status'] });
    },
  });
}

export function useSeedValidMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callFunction('demo', { method: 'POST', params: { action: 'seed-valid' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crossings'] });
      queryClient.invalidateQueries({ queryKey: ['status'] });
    },
  });
}

export function useSeedBlockedMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callFunction('demo', { method: 'POST', params: { action: 'seed-blocked' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crossings'] });
      queryClient.invalidateQueries({ queryKey: ['status'] });
    },
  });
}

// === HEARTBEAT ===
export function useSendHeartbeatMutation() {
  return useMutation({
    mutationFn: (opts?: { companionId?: string }) =>
      callFunction('heartbeat', {
        method: 'POST',
        body: { companionId: opts?.companionId || 'demo-companion', originType: 'demo' },
      }),
  });
}
