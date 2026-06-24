import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { formatNumber, formatVnd } from '@/lib/format';
import { useReverseTransaction, type Transaction } from '@/lib/transactions-api';

interface ReverseConfirmDialogProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function ReverseConfirmDialog({ transaction, onClose }: ReverseConfirmDialogProps) {
  const mutation = useReverseTransaction();
  const open = transaction !== null;
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  async function onConfirm() {
    if (!transaction) return;
    try {
      await mutation.mutateAsync({ id: transaction.id, note: note.trim() || undefined });
      toast.success(`Đã đảo giao dịch #${transaction.id}.`);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError && err.problem?.detail
          ? err.problem.detail
          : 'Đảo giao dịch thất bại';
      toast.error(msg);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Đảo giao dịch</AlertDialogTitle>
          <AlertDialogDescription>
            Một dòng đối ứng (số lượng âm) sẽ được tạo, liên kết tới giao dịch gốc.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {transaction ? (
          <div className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{transaction.productName}</span>
              <span className="text-neutral-500">
                {transaction.type === 'IMPORT' ? 'Nhập' : 'Bán'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between tabular-nums text-neutral-700">
              <span>Số lượng: {formatNumber(transaction.quantity)}</span>
              <span>{formatVnd(transaction.total)}</span>
            </div>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="reverse-note">Lý do (tùy chọn)</Label>
          <Input
            id="reverse-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Khách trả hàng"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={mutation.isPending}
            onClick={onConfirm}
          >
            {mutation.isPending ? 'Đang đảo…' : 'Đảo giao dịch'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
