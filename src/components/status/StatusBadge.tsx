import { cn } from '@/lib/utils';

type BadgeVariant = 'connected' | 'disconnected' | 'online' | 'offline' | 'verified' | 'awaiting' | 'blocked' | 'sent' | 'failed' | 'sending' | 'denied' | 'pending';

const variantStyles: Record<BadgeVariant, string> = {
  connected: 'bg-verified/10 text-verified border-verified/25',
  disconnected: 'bg-destructive/10 text-destructive border-destructive/25',
  online: 'bg-verified/10 text-verified border-verified/25',
  offline: 'bg-offline/10 text-offline border-offline/25',
  verified: 'bg-verified/10 text-verified border-verified/25',
  awaiting: 'bg-awaiting/10 text-awaiting border-awaiting/25',
  blocked: 'bg-destructive/10 text-destructive border-destructive/25',
  sent: 'bg-verified/10 text-verified border-verified/25',
  failed: 'bg-destructive/10 text-destructive border-destructive/25',
  sending: 'bg-sending/10 text-sending border-sending/25',
  denied: 'bg-offline/10 text-offline border-offline/25',
  pending: 'bg-awaiting/10 text-awaiting border-awaiting/25',
};

const dotStyles: Record<BadgeVariant, string> = {
  connected: 'bg-verified shadow-[0_0_4px_hsl(var(--verified)/0.6)]',
  disconnected: 'bg-destructive',
  online: 'bg-verified shadow-[0_0_4px_hsl(var(--verified)/0.6)] status-pulse',
  offline: 'bg-offline',
  verified: 'bg-verified shadow-[0_0_4px_hsl(var(--verified)/0.6)]',
  awaiting: 'bg-awaiting shadow-[0_0_4px_hsl(var(--awaiting)/0.6)] status-pulse',
  blocked: 'bg-destructive shadow-[0_0_4px_hsl(var(--blocked)/0.6)]',
  sent: 'bg-verified shadow-[0_0_4px_hsl(var(--verified)/0.6)]',
  failed: 'bg-destructive',
  sending: 'bg-sending shadow-[0_0_4px_hsl(var(--sending)/0.6)] status-pulse',
  denied: 'bg-offline',
  pending: 'bg-awaiting',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ variant, label, showDot = true, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-medium font-mono uppercase tracking-widest',
      variantStyles[variant],
      className,
    )}>
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />}
      {label}
    </span>
  );
}