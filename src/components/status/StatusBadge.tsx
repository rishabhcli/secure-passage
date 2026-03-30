import { cn } from '@/lib/utils';

type BadgeVariant = 'connected' | 'disconnected' | 'online' | 'offline' | 'verified' | 'awaiting' | 'blocked' | 'sent' | 'failed' | 'sending' | 'denied' | 'pending';

const variantStyles: Record<BadgeVariant, string> = {
  connected: 'bg-verified/15 text-verified border-verified/30',
  disconnected: 'bg-destructive/15 text-destructive border-destructive/30',
  online: 'bg-verified/15 text-verified border-verified/30',
  offline: 'bg-offline/15 text-offline border-offline/30',
  verified: 'bg-verified/15 text-verified border-verified/30',
  awaiting: 'bg-awaiting/15 text-awaiting border-awaiting/30',
  blocked: 'bg-destructive/15 text-destructive border-destructive/30',
  sent: 'bg-verified/15 text-verified border-verified/30',
  failed: 'bg-destructive/15 text-destructive border-destructive/30',
  sending: 'bg-sending/15 text-sending border-sending/30',
  denied: 'bg-offline/15 text-offline border-offline/30',
  pending: 'bg-awaiting/15 text-awaiting border-awaiting/30',
};

const dotStyles: Record<BadgeVariant, string> = {
  connected: 'bg-verified',
  disconnected: 'bg-destructive',
  online: 'bg-verified animate-pulse-glow',
  offline: 'bg-offline',
  verified: 'bg-verified',
  awaiting: 'bg-awaiting animate-pulse-glow',
  blocked: 'bg-destructive',
  sent: 'bg-verified',
  failed: 'bg-destructive',
  sending: 'bg-sending animate-pulse-glow',
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
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono uppercase tracking-wider',
      variantStyles[variant],
      className,
    )}>
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />}
      {label}
    </span>
  );
}
