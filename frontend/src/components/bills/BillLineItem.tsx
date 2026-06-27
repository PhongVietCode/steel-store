import { useEffect, useState } from 'react';
import { formatNumber, formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';

type LineState = {
  lineId: string;
  productId: number;
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  line: LineState;
  mode: 'sale' | 'import';
  /** SALE only: max sellable for this line (the product's currentStock). */
  maxQuantity?: number;
  onChange: (patch: Partial<Pick<LineState, 'quantity' | 'unitPrice'>>) => void;
  onRemove: () => void;
};

const VND_FORMAT = new Intl.NumberFormat('vi-VN');

export function BillLineItem({ line, mode, maxQuantity, onChange, onRemove }: Props) {
  const oversold = mode === 'sale' && maxQuantity != null && line.quantity > maxQuantity;
  const total = line.quantity * line.unitPrice;

  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_104px_118px_124px_30px] items-center gap-2.5 border-b border-line px-5 py-3 last:border-b-0',
        oversold && 'bg-status-danger/[0.04]',
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-ink">{line.productName}</div>
        <div className="mt-0.5 truncate text-[11.5px] text-muted">
          Đơn vị: {line.productUnit}
          {mode === 'sale' && maxQuantity != null ? (
            <>
              {' · Còn '}
              <span className={oversold ? 'mono text-status-danger' : 'mono text-ink'}>
                {formatNumber(maxQuantity)}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <PriceCell value={line.unitPrice} onChange={(v) => onChange({ unitPrice: v })} />

      <QtyStepper
        value={line.quantity}
        onChange={(q) => onChange({ quantity: q })}
        oversold={oversold}
      />

      <div className="mono text-right text-[13px] font-semibold text-ink">
        {formatVnd(total)}
      </div>

      <button
        type="button"
        onClick={onRemove}
        title="Xóa khỏi hóa đơn"
        aria-label="Xóa khỏi hóa đơn"
        className="flex h-[27px] w-[27px] items-center justify-center rounded-md text-[18px] leading-none text-[#b4bac0] transition-colors hover:bg-status-danger/10 hover:text-status-danger"
      >
        ×
      </button>
    </div>
  );
}

function PriceCell({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const [text, setText] = useState<string>(() => (value > 0 ? VND_FORMAT.format(value) : ''));

  useEffect(() => {
    setText(value > 0 ? VND_FORMAT.format(value) : '');
  }, [value]);

  return (
    <input
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        const next = digits ? Number(digits) : 0;
        setText(digits ? VND_FORMAT.format(next) : '');
        onChange(next);
      }}
      onBlur={() => setText(value > 0 ? VND_FORMAT.format(value) : '')}
      className="mono w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right text-[13px] text-ink hover:border-line focus:border-accent focus:bg-card focus:outline-none"
    />
  );
}

function QtyStepper({
  value,
  onChange,
  oversold,
}: {
  value: number;
  onChange: (next: number) => void;
  oversold: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center overflow-hidden rounded-md border bg-bg',
        oversold ? 'border-status-danger/50' : 'border-line',
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Giảm số lượng"
        className="h-8 w-[30px] shrink-0 text-[16px] leading-none text-muted transition-colors hover:bg-card hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-bg disabled:hover:text-muted"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        step={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="mono min-w-0 flex-1 border-x border-line bg-card px-1 py-1.5 text-center text-[13px] font-medium text-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="Tăng số lượng"
        className="h-8 w-[30px] shrink-0 text-[16px] leading-none text-muted transition-colors hover:bg-card hover:text-accent"
      >
        +
      </button>
    </div>
  );
}
