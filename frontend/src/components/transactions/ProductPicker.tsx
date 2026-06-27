import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { useProducts, type Product } from '@/lib/products-api';
import { cn } from '@/lib/utils';

interface ProductPickerProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  value: number | null;
  onChange: (id: number | null) => void;
  renderLabel?: (p: Product) => string;
  placeholder?: string;
}

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
          'flex h-9 w-full rounded-md border border-line bg-card px-3 py-1 text-[13px] text-ink',
          'focus:border-accent focus:outline-none',
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
