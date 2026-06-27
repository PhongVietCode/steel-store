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
import { ApiError } from '@/lib/api';
import { useReverseBill, type Bill } from '@/lib/bills-api';
import { formatVnd } from '@/lib/format';

type Props = {
  bill: Bill | null;
  onClose: () => void;
};

export function ReverseBillDialog({ bill, onClose }: Props) {
  const mutation = useReverseBill();
  const open = bill !== null;

  async function onConfirm() {
    if (!bill) return;
    try {
      await mutation.mutateAsync(bill.id);
      toast.success(`Đã hoàn hóa đơn #${bill.id}. Một hóa đơn đối ứng đã được tạo.`);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError && err.problem?.detail
          ? err.problem.detail
          : 'Hoàn hóa đơn thất bại';
      toast.error(msg);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hoàn hóa đơn</AlertDialogTitle>
          <AlertDialogDescription>
            Một hóa đơn đối ứng (số lượng âm trên mọi dòng) sẽ được tạo và liên kết tới hóa
            đơn gốc. Tồn kho và lợi nhuận sẽ được hoàn về trạng thái trước hóa đơn.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {bill ? (
          <div className="rounded-md border border-line bg-bg px-3 py-2 text-[12.5px]">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">
                {bill.partyName ?? (bill.type === 'SALE' ? 'Khách lẻ' : 'Nhà cung cấp')}
                <span className="mono ml-2 text-[11px] text-muted">#{bill.id}</span>
              </span>
              <span className="text-muted">{bill.type === 'SALE' ? 'Bán' : 'Nhập'}</span>
            </div>
            <div className="mono mt-1 flex items-center justify-between text-ink">
              <span>{bill.lines.length} mặt hàng</span>
              <span className="font-semibold">{formatVnd(bill.total)}</span>
            </div>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={mutation.isPending}
            onClick={onConfirm}
          >
            {mutation.isPending ? 'Đang hoàn…' : 'Hoàn hóa đơn'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
