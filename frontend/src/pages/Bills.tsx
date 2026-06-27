import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { BillDetailDialog } from '@/components/bills/BillDetailDialog';
import { BillsTable } from '@/components/bills/BillsTable';
import { ReverseBillDialog } from '@/components/bills/ReverseBillDialog';
import { ProductPicker } from '@/components/transactions/ProductPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Panel, PanelBody } from '@/components/ui/panel';
import { useBills, type Bill, type BillType } from '@/lib/bills-api';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

export function BillsPage() {
  const [productId, setProductId] = useState<number | null>(null);
  const [type, setType] = useState<BillType | null>(null);
  const [partyName, setPartyName] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const [viewing, setViewing] = useState<Bill | null>(null);
  const [pendingReverse, setPendingReverse] = useState<Bill | null>(null);

  const query = useBills({
    productId,
    type,
    partyName: partyName || null,
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
    setPartyName('');
    setFrom('');
    setTo('');
    setPage(0);
  }

  function withPageReset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(0);
      setter(v);
    };
  }

  return (
    <div className="space-y-6">
      <Panel>
        <PanelBody className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="space-y-1.5">
            <Label>Sản phẩm</Label>
            <ProductPicker
              value={productId}
              onChange={withPageReset<number | null>(setProductId)}
              placeholder="— Tất cả —"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Loại</Label>
            <TypeSelect value={type} onChange={withPageReset<BillType | null>(setType)} />
          </div>
          <div className="space-y-1.5">
            <Label>Đối tác</Label>
            <Input
              placeholder="Tên khách / NCC"
              value={partyName}
              onChange={(e) => {
                setPage(0);
                setPartyName(e.target.value);
              }}
            />
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
        </PanelBody>
      </Panel>

      <Panel>
        <BillsTable
          rows={query.data?.content}
          loading={query.isPending}
          onView={setViewing}
          onReverse={setPendingReverse}
        />
      </Panel>

      <div className="flex items-center justify-between text-[12.5px] text-muted">
        <div className="mono">
          {query.data
            ? `Trang ${page + 1} / ${Math.max(totalPages, 1)} · ${totalElements} hóa đơn`
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

      <BillDetailDialog bill={viewing} onClose={() => setViewing(null)} />
      <ReverseBillDialog
        bill={pendingReverse}
        onClose={() => setPendingReverse(null)}
      />
    </div>
  );
}

function TypeSelect({
  value,
  onChange,
}: {
  value: BillType | null;
  onChange: (v: BillType | null) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : (e.target.value as BillType))}
      className={cn(
        'flex h-9 w-full rounded-md border border-line bg-card px-3 py-1 text-[13px] text-ink',
        'focus:border-accent focus:outline-none',
      )}
    >
      <option value="">— Tất cả —</option>
      <option value="IMPORT">Nhập</option>
      <option value="SALE">Bán</option>
    </select>
  );
}
