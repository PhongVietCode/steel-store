import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Panel } from '@/components/ui/panel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNumber, formatVnd } from '@/lib/format';
import { useProducts, type Product } from '@/lib/products-api';

type SortKey = 'name' | 'currentStock';
type SortDir = 'asc' | 'desc';

const LOW_STOCK = 10;

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const productsQuery = useProducts(deferredSearch.trim() || undefined);

  const sorted = useMemo(() => {
    const rows = productsQuery.data ?? [];
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'vi') * factor;
      return (a.currentStock - b.currentStock) * factor;
    });
  }, [productsQuery.data, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            placeholder="Tìm theo tên…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-line bg-card pr-3 pl-9 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </Button>
      </div>

      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">
                <SortButton active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')}>
                  Tên
                </SortButton>
              </TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead className="text-right">Giá nhập</TableHead>
              <TableHead className="text-right">Giá bán</TableHead>
              <TableHead className="text-right">
                <SortButton
                  active={sortKey === 'currentStock'}
                  dir={sortDir}
                  onClick={() => toggleSort('currentStock')}
                >
                  Tồn kho
                </SortButton>
              </TableHead>
              <TableHead className="w-[120px] text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsQuery.isPending ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted">
                  Đang tải…
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted">
                  {deferredSearch
                    ? 'Không tìm thấy sản phẩm phù hợp.'
                    : 'Chưa có sản phẩm nào. Bấm "Thêm sản phẩm" để bắt đầu.'}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((p) => {
                const low = p.currentStock <= LOW_STOCK;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted">{p.unit}</TableCell>
                    <TableCell className="mono text-right">
                      {formatVnd(p.currentImportPrice)}
                    </TableCell>
                    <TableCell className="mono text-right">
                      {formatVnd(p.currentSellingPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <span className="mono">{formatNumber(p.currentStock)}</span>
                        {low ? <Chip tone="warn">Sắp hết</Chip> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Sửa ${p.name}`}
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Xóa ${p.name}`}
                        onClick={() => setPendingDelete(p)}
                      >
                        <Trash2 className="h-4 w-4 text-status-danger" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Panel>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />
      <DeleteProductDialog product={pendingDelete} onClose={() => setPendingDelete(null)} />
    </div>
  );
}

function SortButton({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink"
    >
      {children}
      {active ? (
        dir === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : null}
    </button>
  );
}
