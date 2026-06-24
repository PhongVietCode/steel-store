import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ProductPicker } from '@/components/transactions/ProductPicker';
import { ReverseConfirmDialog } from '@/components/transactions/ReverseConfirmDialog';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  useTransactions,
  type Transaction,
  type TransactionType,
} from '@/lib/transactions-api';

const PAGE_SIZE = 20;

export function TransactionsPage() {
  const [productId, setProductId] = useState<number | null>(null);
  const [type, setType] = useState<TransactionType | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const [pendingReverse, setPendingReverse] = useState<Transaction | null>(null);

  const query = useTransactions({
    productId,
    type,
    from: from || null,
    to: to || null,
    page,
    size: PAGE_SIZE,
  });

  const totalElements = query.data?.totalElements ?? 0;
  const totalPages = query.data?.totalPages ?? 0;

  function resetFilters() {
    setProductId(null);
    setType(null);
    setFrom('');
    setTo('');
    setPage(0);
  }

  function applyFilterChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(0);
      setter(v);
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lịch sử giao dịch</h1>
        <p className="text-sm text-neutral-500">
          Toàn bộ ghi nhận nhập / bán và các giao dịch điều chỉnh, mới nhất trước.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-5">
        <div className="space-y-1.5">
          <Label>Sản phẩm</Label>
          <ProductPicker
            value={productId}
            onChange={applyFilterChange<number | null>(setProductId)}
            placeholder="— Tất cả —"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Loại</Label>
          <TypeSelect value={type} onChange={applyFilterChange<TransactionType | null>(setType)} />
        </div>
        <div className="space-y-1.5">
          <Label>Từ ngày</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setPage(0);
              setFrom(e.target.value);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Đến ngày</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setPage(0);
              setTo(e.target.value);
            }}
          />
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={resetFilters} className="w-full">
            Xóa bộ lọc
          </Button>
        </div>
      </section>

      <TransactionsTable
        rows={query.data?.content}
        loading={query.isPending}
        onReverse={setPendingReverse}
      />

      <div className="flex items-center justify-between text-sm text-neutral-600">
        <div className="tabular-nums">
          {query.data
            ? `Trang ${page + 1} / ${Math.max(totalPages, 1)} • ${totalElements} dòng`
            : '—'}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || query.isPending}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={query.isPending || query.data?.last !== false}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ReverseConfirmDialog
        transaction={pendingReverse}
        onClose={() => setPendingReverse(null)}
      />
    </div>
  );
}

function TypeSelect({
  value,
  onChange,
}: {
  value: TransactionType | null;
  onChange: (v: TransactionType | null) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : (e.target.value as TransactionType))}
      className={cn(
        'flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1',
      )}
    >
      <option value="">— Tất cả —</option>
      <option value="IMPORT">Nhập</option>
      <option value="SALE">Bán</option>
    </select>
  );
}
