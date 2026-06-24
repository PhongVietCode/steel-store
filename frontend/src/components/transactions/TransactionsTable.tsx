import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNumber, formatVnd } from '@/lib/format';
import type { Transaction } from '@/lib/transactions-api';

const DATE_TIME = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

interface TransactionsTableProps {
  rows: Transaction[] | undefined;
  loading?: boolean;
  emptyText?: string;
  /** When provided, shows a Reverse action on eligible rows. */
  onReverse?: (t: Transaction) => void;
  /** Hide the Type column when the table is already filtered to one kind. */
  hideTypeColumn?: boolean;
}

export function TransactionsTable({
  rows,
  loading,
  emptyText = 'Chưa có giao dịch nào.',
  onReverse,
  hideTypeColumn,
}: TransactionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[170px]">Thời điểm</TableHead>
          {!hideTypeColumn ? <TableHead className="w-[90px]">Loại</TableHead> : null}
          <TableHead>Sản phẩm</TableHead>
          <TableHead className="text-right">Số lượng</TableHead>
          <TableHead className="text-right">Đơn giá</TableHead>
          <TableHead className="text-right">Giá vốn</TableHead>
          <TableHead className="text-right">Thành tiền</TableHead>
          {onReverse ? <TableHead className="w-[120px] text-right">Hành động</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={8} className="py-10 text-center text-neutral-500">
              Đang tải…
            </TableCell>
          </TableRow>
        ) : !rows || rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="py-10 text-center text-neutral-500">
              {emptyText}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((t) => {
            const isCorrection = t.correctionOfId !== null || t.quantity < 0;
            return (
              <TableRow key={t.id}>
                <TableCell className="tabular-nums text-neutral-600">
                  {DATE_TIME.format(new Date(t.occurredAt))}
                </TableCell>
                {!hideTypeColumn ? (
                  <TableCell>
                    <TypeBadge type={t.type} correction={isCorrection} />
                  </TableCell>
                ) : null}
                <TableCell className="font-medium">
                  {t.productName}
                  {t.correctionOfId !== null ? (
                    <span className="ml-2 text-xs text-neutral-500">
                      ↩ điều chỉnh giao dịch #{t.correctionOfId}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(t.quantity)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(t.unitPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-neutral-600">
                  {t.costBasisPerUnit !== null ? formatVnd(t.costBasisPerUnit) : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatVnd(t.total)}
                </TableCell>
                {onReverse ? (
                  <TableCell className="text-right">
                    {!isCorrection ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReverse(t)}
                        aria-label={`Đảo giao dịch ${t.id}`}
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Đảo
                      </Button>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

function TypeBadge({ type, correction }: { type: 'IMPORT' | 'SALE'; correction: boolean }) {
  const base =
    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset';
  if (correction) {
    return <span className={`${base} bg-amber-50 text-amber-700 ring-amber-200`}>Đảo</span>;
  }
  return type === 'IMPORT' ? (
    <span className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200`}>Nhập</span>
  ) : (
    <span className={`${base} bg-sky-50 text-sky-700 ring-sky-200`}>Bán</span>
  );
}
