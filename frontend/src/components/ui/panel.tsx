import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-card shadow-[0_1px_0_rgba(21,24,28,0.02)]',
        className,
      )}
      {...props}
    />
  );
}

type PanelHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
};

export function PanelHeader({
  title,
  subtitle,
  action,
  className,
  ...props
}: PanelHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-line px-5 py-4',
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-ink">{title}</div>
        {subtitle ? <div className="mt-0.5 text-[11.5px] text-muted">{subtitle}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}
