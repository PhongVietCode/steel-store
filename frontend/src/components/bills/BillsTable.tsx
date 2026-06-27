import { Eye, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVnd } from '@/lib/format';
import type { Bill } from '@/lib/bills-api';

const DATE_TIME = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

type Props = {
  rows: Bill[] | undefined;
  loading?: boolean;
  emptyText?: string;
  onView: (bill: Bill) => void;
  onReverse: (bill: Bill) => void;
};

export function BillsTable({ rows, loading, emptyText = 'Chưa có hóa đơn nào.', onView, onReverse }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[160px]">Thời điểm</TableHead>
          <TableHead className="w-[90px]">Loại</TableHead>
          <TableHead className="w-[80px]">#</TableHead>
          <TableHead>Đối tác</TableHead>
          <TableHead className="text-right">Số mặt hàng</TableHead>
          <TableHead className="text-right">Tổng cộng</TableHead>
          <TableHead className="w-[80px]">Trạng thái</TableHead>
          <TableHead className="w-[140px] text-right">Hành động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={8} className="py-10 text-center text-muted">
              Đang tải…
            </TableCell>
          </TableRow>
        ) : !rows || rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="py-10 text-center text-muted">
              {emptyText}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((b) => {
            const isCounter = b.correctionOfBillId != null;
            const isReversed = b.reversedByBillId != null;
            return (
              <TableRow key={b.id}>
                <TableCell className="mono text-muted">
                  {DATE_TIME.format(new Date(b.occurredAt))}
                </TableCell>
                <TableCell>
                  {isCounter ? (
                    <Chip tone="warn">Hoàn</Chip>
                  ) : b.type === 'SALE' ? (
                    <Chip tone="ok">Bán</Chip>
                  ) : (
                    <Chip tone="info">Nhập</Chip>
                  )}
                </TableCell>
                <TableCell className="mono text-ink">#{b.id}</TableCell>
                <TableCell className="font-medium">
                  {b.partyName ?? (b.type === 'SALE' ? 'Khách lẻ' : 'Nhà cung cấp')}
                  {isCounter ? (
                    <span className="mono ml-2 text-[11px] text-muted">
                      ↩ #{b.correctionOfBillId}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="mono text-right">{b.lines.length}</TableCell>
                <TableCell className="mono text-right font-semibold">
                  {formatVnd(b.total)}
                </TableCell>
                <TableCell>
                  {isReversed ? <Chip tone="muted">Đã hoàn</Chip> : <span className="text-muted">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onView(b)}>
                      <Eye className="h-3.5 w-3.5" /> Chi tiết
                    </Button>
                    {!isCounter && !isReversed ? (
                      <Button variant="ghost" size="sm" onClick={() => onReverse(b)}>
                        <Undo2 className="h-3.5 w-3.5" /> Hoàn
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
