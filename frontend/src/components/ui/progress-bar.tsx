import { cn } from '@/lib/utils';

type ProgressBarProps = {
  value: number;
  max?: number;
  tone?: 'normal' | 'low';
  className?: string;
};

export function ProgressBar({ value, max = 100, tone = 'normal', className }: ProgressBarProps) {
  const safeMax = max <= 0 ? 1 : max;
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100));
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-line', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all',
          tone === 'low' ? 'bg-status-warn' : 'bg-ink',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
