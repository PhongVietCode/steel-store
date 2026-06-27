import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ChipTone = 'ok' | 'warn' | 'info' | 'danger' | 'muted' | 'accent';

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
};

const TONE_STYLES: Record<ChipTone, string> = {
  ok: 'bg-status-ok/10 text-status-ok',
  warn: 'bg-status-warn/12 text-status-warn',
  info: 'bg-status-info/10 text-status-info',
  danger: 'bg-status-danger/10 text-status-danger',
  muted: 'bg-bg text-status-muted',
  accent: 'bg-accent/12 text-accent',
};

export function Chip({ tone = 'muted', className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]',
        TONE_STYLES[tone],
        className,
      )}
      {...props}
    />
  );
}
