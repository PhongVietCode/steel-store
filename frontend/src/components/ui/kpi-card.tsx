import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; tone?: 'ok' | 'warn' | 'danger' | 'muted' };
  className?: string;
};

export function KpiCard({ label, value, hint, delta, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-line bg-card px-5 py-4',
        className,
      )}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </div>
      <div className="mono text-[26px] font-semibold leading-none text-ink">{value}</div>
      <div className="flex items-end justify-between">
        <div className="text-[11.5px] text-muted">{hint ?? ' '}</div>
        {delta ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-semibold',
              delta.tone === 'danger' && 'text-status-danger',
              delta.tone === 'warn' && 'text-status-warn',
              delta.tone === 'muted' && 'text-muted',
              (delta.tone === 'ok' || !delta.tone) && 'text-status-ok',
            )}
          >
            {delta.direction === 'up' && <ArrowUpRight size={12} />}
            {delta.direction === 'down' && <ArrowDownRight size={12} />}
            <span className="mono">{delta.value}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
