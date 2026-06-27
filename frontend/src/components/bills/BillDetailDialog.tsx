import { Chip } from '@/components/ui/chip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBill, type Bill } from '@/lib/bills-api';
import { formatNumber, formatVnd } from '@/lib/format';

const DATE_TIME = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

type Props = {
  bill: Bill | null;
  onClose: () => void;
};

export function BillDetailDialog({ bill, onClose }: Props) {
  // The list response already carries lines, but we refetch for fresh
  // reversed/counter state when opening.
  const detail = useBill(bill?.id);
  const data = detail.data ?? bill;
  const open = bill !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {data?.correctionOfBillId != null ? (
              <Chip tone="warn">Hoàn</Chip>
            ) : data?.type === 'SALE' ? (
              <Chip tone="ok">Bán</Chip>
            ) : (
              <Chip tone="info">Nhập</Chip>
            )}
            <DialogTitle>
              Hóa đơn <span className="mono">#{data?.id}</span>
            </DialogTitle>
          </div>
          <DialogDescription>
            {data?.partyName ?? (data?.type === 'SALE' ? 'Khách lẻ' : 'Nhà cung cấp')}
            {' · '}
            {data ? DATE_TIME.format(new Date(data.occurredAt)) : ''}
            {data?.correctionOfBillId != null ? (
              <span className="ml-2 text-muted">
                ↩ hoàn hóa đơn <span className="mono">#{data.correctionOfBillId}</span>
              </span>
            ) : null}
            {data?.reversedByBillId != null ? (
              <span className="ml-2 text-muted">
                · đã hoàn bởi <span className="mono">#{data.reversedByBillId}</span>
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 border-y border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Giá vốn</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.lines ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">
                    {l.productName}
                    <span className="ml-2 text-[11px] text-muted">{l.productUnit}</span>
                  </TableCell>
                  <TableCell className="mono text-right">{formatNumber(l.quantity)}</TableCell>
                  <TableCell className="mono text-right">{formatVnd(l.unitPrice)}</TableCell>
                  <TableCell className="mono text-right text-muted">
                    {l.costBasisPerUnit != null ? formatVnd(l.costBasisPerUnit) : '—'}
                  </TableCell>
                  <TableCell className="mono text-right font-semibold">
                    {formatVnd(l.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-baseline justify-between pt-2">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
            Tổng cộng
          </div>
          <div className="mono text-[20px] font-semibold tracking-tight text-ink">
            {formatVnd(data?.total ?? 0)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
