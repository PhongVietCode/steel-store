import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VndInput } from '@/components/products/VndInput';
import { ApiError } from '@/lib/api';
import {
  useCreateProduct,
  useUpdateProduct,
  type Product,
  type ProductFormValues,
} from '@/lib/products-api';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên sản phẩm').max(255),
  unit: z.string().min(1, 'Vui lòng nhập đơn vị').max(32),
  currentImportPrice: z.number().int().min(0, 'Giá nhập phải ≥ 0'),
  currentSellingPrice: z.number().int().min(0, 'Giá bán phải ≥ 0'),
  currentStock: z.number().int().min(0, 'Số lượng phải ≥ 0'),
});

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing existing product; omit for create. */
  product?: Product;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const isEdit = product !== undefined;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(product),
  });

  // Reset when the dialog opens with a different product (edit) or for a fresh create.
  useEffect(() => {
    if (open) form.reset(defaultValues(product));
  }, [open, product, form]);

  async function onSubmit(values: ProductFormValues) {
    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync({
          id: product.id,
          input: {
            name: values.name.trim(),
            unit: values.unit.trim(),
            currentImportPrice: values.currentImportPrice,
            currentSellingPrice: values.currentSellingPrice,
          },
        });
        toast.success(`Đã cập nhật "${values.name}".`);
      } else {
        await createMutation.mutateAsync({
          ...values,
          name: values.name.trim(),
          unit: values.unit.trim(),
        });
        toast.success(`Đã thêm sản phẩm "${values.name}".`);
      }
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.problem?.detail
          ? err.problem.detail
          : 'Lưu sản phẩm thất bại';
      toast.error(msg);
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Cập nhật tên, đơn vị và giá bán/nhập hiện hành. Tồn kho thay đổi qua nhập / bán.'
                : 'Tạo mới một mặt hàng kèm số lượng tồn kho ban đầu.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Field label="Tên sản phẩm" error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} autoFocus />
            </Field>

            <Field label="Đơn vị" error={form.formState.errors.unit?.message}>
              <Input placeholder="kg, m, bao…" {...form.register('unit')} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Giá nhập"
                error={form.formState.errors.currentImportPrice?.message}
              >
                <Controller
                  control={form.control}
                  name="currentImportPrice"
                  render={({ field }) => (
                    <VndInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                  )}
                />
              </Field>

              <Field
                label="Giá bán"
                error={form.formState.errors.currentSellingPrice?.message}
              >
                <Controller
                  control={form.control}
                  name="currentSellingPrice"
                  render={({ field }) => (
                    <VndInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                  )}
                />
              </Field>
            </div>

            {!isEdit ? (
              <Field
                label="Tồn kho ban đầu"
                error={form.formState.errors.currentStock?.message}
              >
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="tabular-nums"
                  {...form.register('currentStock', { valueAsNumber: true })}
                />
              </Field>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function defaultValues(product?: Product): ProductFormValues {
  return {
    name: product?.name ?? '',
    unit: product?.unit ?? '',
    currentImportPrice: product?.currentImportPrice ?? 0,
    currentSellingPrice: product?.currentSellingPrice ?? 0,
    currentStock: product?.currentStock ?? 0,
  };
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <div className="text-[11px] font-medium text-status-danger">{error}</div> : null}
    </div>
  );
}
