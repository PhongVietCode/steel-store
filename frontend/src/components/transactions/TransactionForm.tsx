import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { VndInput } from '@/components/products/VndInput';
import { ProductPicker } from '@/components/transactions/ProductPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { useProducts } from '@/lib/products-api';
import { formatNumber, formatVnd } from '@/lib/format';
import { useRecordImport, useRecordSale } from '@/lib/transactions-api';

const schema = z.object({
  productId: z.number({ message: 'Vui lòng chọn sản phẩm' }).int().positive(),
  quantity: z.number().int().positive('Số lượng phải > 0'),
  unitPrice: z.number().int().min(0, 'Đơn giá phải ≥ 0'),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TransactionFormProps {
  kind: 'import' | 'sale';
}

export function TransactionForm({ kind }: TransactionFormProps) {
  const products = useProducts();
  const recordImport = useRecordImport();
  const recordSale = useRecordSale();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { productId: 0 as unknown as number, quantity: 1, unitPrice: 0, note: '' },
  });

  const productId = form.watch('productId');
  const quantity = form.watch('quantity');

  const selectedProduct = useMemo(
    () => products.data?.find((p) => p.id === productId) ?? null,
    [products.data, productId],
  );

  // For the SALE form, pre-fill unit price from the product's current selling
  // price the first time a product is picked (operator can still override).
  useEffect(() => {
    if (!selectedProduct) return;
    const current = form.getValues('unitPrice');
    if (current !== 0) return;
    const suggested =
      kind === 'sale' ? selectedProduct.currentSellingPrice : selectedProduct.currentImportPrice;
    if (suggested > 0) form.setValue('unitPrice', suggested);
  }, [selectedProduct, form, kind]);

  const oversold =
    kind === 'sale' &&
    selectedProduct !== null &&
    quantity > selectedProduct.currentStock;

  async function onSubmit(values: FormValues) {
    try {
      const body = {
        productId: values.productId,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        note: values.note?.trim() ? values.note.trim() : null,
      };
      if (kind === 'import') {
        await recordImport.mutateAsync(body);
        toast.success(
          `Đã nhập ${formatNumber(values.quantity)} × ${selectedProduct?.name ?? ''}.`,
        );
      } else {
        await recordSale.mutateAsync(body);
        toast.success(
          `Đã bán ${formatNumber(values.quantity)} × ${selectedProduct?.name ?? ''}.`,
        );
      }
      form.reset({ productId: values.productId, quantity: 1, unitPrice: 0, note: '' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.problem) {
        const currentStock = err.problem.currentStock as number | undefined;
        const requested = err.problem.requested as number | undefined;
        if (currentStock !== undefined && requested !== undefined) {
          toast.error(
            `Không đủ tồn kho: yêu cầu ${formatNumber(requested)}, còn ${formatNumber(currentStock)}.`,
          );
          return;
        }
        toast.error(err.problem.detail ?? 'Xung đột (409).');
        return;
      }
      const msg =
        err instanceof ApiError && err.problem?.detail
          ? err.problem.detail
          : kind === 'import'
            ? 'Ghi nhận nhập hàng thất bại'
            : 'Ghi nhận bán hàng thất bại';
      toast.error(msg);
    }
  }

  const submitting = recordImport.isPending || recordSale.isPending;
  const ctaLabel = kind === 'import' ? 'Nhập kho' : 'Ghi nhận bán';
  const heading = kind === 'import' ? 'Nhập hàng' : 'Bán hàng';

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
        <p className="text-sm text-neutral-500">
          {kind === 'import'
            ? 'Mỗi lần nhập tăng tồn kho và cập nhật giá nhập hiện hành của sản phẩm.'
            : 'Mỗi lần bán giảm tồn kho. Giá vốn được chốt theo giá nhập hiện hành tại thời điểm bán.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Sản phẩm" error={form.formState.errors.productId?.message}>
          <Controller
            control={form.control}
            name="productId"
            render={({ field }) => (
              <ProductPicker value={field.value || null} onChange={(id) => field.onChange(id ?? 0)} />
            )}
          />
          {selectedProduct ? (
            <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
              <span>
                Đơn vị: <span className="text-neutral-900">{selectedProduct.unit}</span>
              </span>
              <span aria-hidden>•</span>
              <span>
                Tồn kho:{' '}
                <span
                  className={
                    kind === 'sale' && oversold
                      ? 'tabular-nums font-semibold text-red-600'
                      : 'tabular-nums font-medium text-neutral-900'
                  }
                >
                  {formatNumber(selectedProduct.currentStock)}
                </span>
              </span>
              <span aria-hidden>•</span>
              <span>
                Giá {kind === 'sale' ? 'bán' : 'nhập'} hiện tại:{' '}
                <span className="tabular-nums text-neutral-900">
                  {formatVnd(
                    kind === 'sale'
                      ? selectedProduct.currentSellingPrice
                      : selectedProduct.currentImportPrice,
                  )}
                </span>
              </span>
            </div>
          ) : null}
        </Field>

        <Field label="Số lượng" error={form.formState.errors.quantity?.message}>
          <Input
            type="number"
            min={1}
            step={1}
            className="tabular-nums"
            {...form.register('quantity', { valueAsNumber: true })}
          />
        </Field>

        <Field label="Đơn giá" error={form.formState.errors.unitPrice?.message}>
          <Controller
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <VndInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
        </Field>

        <Field label="Ghi chú">
          <Input placeholder="Tùy chọn" {...form.register('note')} />
        </Field>
      </div>

      {oversold ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Yêu cầu vượt tồn kho hiện tại ({formatNumber(selectedProduct?.currentStock ?? 0)}). Giảm số
          lượng hoặc nhập thêm hàng trước khi bán.
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || oversold || !selectedProduct}>
          {submitting ? 'Đang lưu…' : ctaLabel}
        </Button>
      </div>
    </form>
  );
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
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
