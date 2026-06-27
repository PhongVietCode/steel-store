import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { formatNumber, formatVnd } from '@/lib/format';
import { useProducts, type Product } from '@/lib/products-api';

type Props = {
  mode: 'sale' | 'import';
  /** For SALE: the qty of each product currently in the bill (so we can disable "Add" when it hits stock). */
  inCart: Map<number, number>;
  onAdd: (product: Product) => void;
};

export function ProductCatalog({ mode, inCart, onAdd }: Props) {
  const { data: products = [], isPending } = useProducts();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [query, products]);

  const subtitle = mode === 'sale' ? 'Bấm để thêm vào đơn bán' : 'Bấm để thêm vào đơn nhập';

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-card">
      <div className="px-4 pt-4 pb-1">
        <div className="text-[14px] font-semibold text-ink">Danh mục sản phẩm</div>
        <div className="mt-[3px] text-[12px] text-muted">{subtitle}</div>
      </div>
      <div className="mt-1 mb-1.5 flex items-center gap-[9px] rounded-md border border-line bg-bg px-3 py-2 mx-4">
        <Search size={14} className="shrink-0 text-muted" strokeWidth={1.8} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm sản phẩm..."
          className="w-full border-0 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pt-1 pb-3">
        {isPending ? (
          <div className="px-3 py-6 text-[12.5px] text-muted">Đang tải…</div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-6 text-[12.5px] text-muted">
            {products.length === 0
              ? 'Chưa có sản phẩm nào. Hãy thêm tại trang Sản phẩm.'
              : 'Không có sản phẩm khớp.'}
          </div>
        ) : (
          <ul>
            {filtered.map((p) => {
              const qtyInCart = inCart.get(p.id) ?? 0;
              const atLimit = mode === 'sale' && qtyInCart >= p.currentStock;
              const price = mode === 'sale' ? p.currentSellingPrice : p.currentImportPrice;
              const lowStock = mode === 'sale' && p.currentStock <= 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={atLimit}
                    onClick={() => onAdd(p)}
                    title={atLimit ? 'Đã đạt tồn kho' : 'Thêm vào hóa đơn'}
                    className="group flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-ink">{p.name}</div>
                      <div className="mt-0.5 text-[11.5px] text-muted">
                        {p.unit} · Tồn:{' '}
                        <span className={`mono ${lowStock ? 'text-status-danger' : 'text-ink'}`}>
                          {formatNumber(p.currentStock)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="mono text-[12.5px] font-semibold text-ink">
                        {formatVnd(price)}
                      </div>
                      <span
                        aria-hidden
                        className="flex h-[27px] w-[27px] items-center justify-center rounded-md border border-line bg-bg text-[18px] leading-none font-semibold text-[var(--theme,var(--color-accent))] transition-colors group-hover:border-[var(--theme,var(--color-accent))] group-hover:bg-[var(--theme,var(--color-accent))] group-hover:text-[var(--theme-ink,#1a1206)] group-disabled:bg-bg group-disabled:text-muted"
                      >
                        +
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
