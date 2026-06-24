import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { formatNumber, formatVnd } from '@/lib/format';
import { useProducts, type Product } from '@/lib/products-api';

type SortKey = 'name' | 'currentStock';
type SortDir = 'asc' | 'desc';

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
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-neutral-500">
            Quản lý danh mục mặt hàng, đơn giá nhập / bán hiện hành và tồn kho.
          </p>
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

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Tìm theo tên…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

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
            <TableHead className="w-[140px] text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productsQuery.isPending ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-neutral-500">
                Đang tải…
              </TableCell>
            </TableRow>
          ) : sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-neutral-500">
                {deferredSearch
                  ? 'Không tìm thấy sản phẩm phù hợp.'
                  : 'Chưa có sản phẩm nào. Bấm "Thêm sản phẩm" để bắt đầu.'}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-neutral-600">{p.unit}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(p.currentImportPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(p.currentSellingPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(p.currentStock)}
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
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500 hover:text-neutral-900"
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
