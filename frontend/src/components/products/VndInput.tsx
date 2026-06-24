import { useEffect, useState } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const VND_FORMAT = new Intl.NumberFormat('vi-VN');

interface VndInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  value: number;
  onChange: (next: number) => void;
}

/**
 * Numeric input formatted with vi-VN thousand separators (e.g. "1.000.000")
 * and `tabular-nums` (JetBrains Mono) so digit widths stay aligned. Stores
 * the value as a plain number for the form layer; emits 0 when empty.
 */
export function VndInput({ value, onChange, className, onBlur, ...rest }: VndInputProps) {
  const [text, setText] = useState<string>(() => (value > 0 ? VND_FORMAT.format(value) : ''));

  // Keep displayed text in sync when the form resets externally.
  useEffect(() => {
    setText(value > 0 ? VND_FORMAT.format(value) : '');
  }, [value]);

  return (
    <div className="relative">
      <Input
        inputMode="numeric"
        className={cn('tabular-nums pr-9 text-right', className)}
        value={text}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          const next = digits ? Number(digits) : 0;
          setText(digits ? VND_FORMAT.format(next) : '');
          onChange(next);
        }}
        onBlur={(e) => {
          // Re-format on blur in case the user typed extra zeros or letters.
          setText(value > 0 ? VND_FORMAT.format(value) : '');
          onBlur?.(e);
        }}
        {...rest}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
        ₫
      </span>
    </div>
  );
}
