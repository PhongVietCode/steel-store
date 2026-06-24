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
import { useDeleteProduct, type Product } from '@/lib/products-api';

interface DeleteProductDialogProps {
  product: Product | null;
  onClose: () => void;
}

export function DeleteProductDialog({ product, onClose }: DeleteProductDialogProps) {
  const mutation = useDeleteProduct();
  const open = product !== null;

  async function onConfirm() {
    if (!product) return;
    try {
      await mutation.mutateAsync(product.id);
      toast.success(`Đã xóa "${product.name}".`);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError && err.problem?.detail
          ? err.problem.detail
          : 'Xóa sản phẩm thất bại';
      toast.error(msg);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa sản phẩm</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa <span className="font-medium">{product?.name}</span>? Hành
            động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={mutation.isPending}
            onClick={onConfirm}
          >
            {mutation.isPending ? 'Đang xóa…' : 'Xóa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
