import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { useProducts, type Product } from '@/lib/products-api';
import { cn } from '@/lib/utils';

interface ProductPickerProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  value: number | null;
  onChange: (id: number | null) => void;
  /** Optional renderer for the option label (defaults to product name). */
  renderLabel?: (p: Product) => string;
  placeholder?: string;
}

/**
 * Native <select> bound to the products list. Native is enough for a
 * single-admin MVP with O(tens) of products; we can swap for a Combobox
 * later if catalog grows.
 */
export const ProductPicker = forwardRef<HTMLSelectElement, ProductPickerProps>(
  ({ value, onChange, className, renderLabel, placeholder, ...rest }, ref) => {
    const productsQuery = useProducts();
    return (
      <select
        ref={ref}
        value={value ?? ''}
        onChange={(e) => {
          const next = e.target.value === '' ? null : Number(e.target.value);
          onChange(Number.isFinite(next) ? next : null);
        }}
        className={cn(
          'flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...rest}
      >
        <option value="">{placeholder ?? '— Chọn sản phẩm —'}</option>
        {productsQuery.data?.map((p) => (
          <option key={p.id} value={p.id}>
            {renderLabel ? renderLabel(p) : p.name}
          </option>
        ))}
      </select>
    );
  },
);
ProductPicker.displayName = 'ProductPicker';
