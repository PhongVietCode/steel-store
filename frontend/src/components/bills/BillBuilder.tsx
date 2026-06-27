import type { CSSProperties } from 'react';
import { useMemo, useReducer, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';
import { useCreateImportBill, useCreateSaleBill } from '@/lib/bills-api';
import { formatNumber } from '@/lib/format';
import { useProducts, type Product } from '@/lib/products-api';
import { BillForm, type DraftLine } from './BillForm';
import { PageBanner } from './PageBanner';
import { ProductCatalog } from './ProductCatalog';

type Mode = 'sale' | 'import';

const THEMES: Record<Mode, CSSProperties> = {
  sale: { '--theme': '#ff6a1a', '--theme-ink': '#1a1206' } as CSSProperties,
  import: { '--theme': '#0e7c86', '--theme-ink': '#ffffff' } as CSSProperties,
};

type State = {
  partyName: string;
  lines: DraftLine[];
};

type Action =
  | { type: 'ADD'; product: Product; mode: Mode }
  | { type: 'UPDATE'; lineId: string; patch: Partial<Pick<DraftLine, 'quantity' | 'unitPrice'>> }
  | { type: 'REMOVE'; lineId: string }
  | { type: 'SET_PARTY'; name: string }
  | { type: 'CLEAR' };

function init(): State {
  return { partyName: '', lines: [] };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD': {
      const existing = state.lines.find((l) => l.productId === action.product.id);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.lineId === existing.lineId ? { ...l, quantity: l.quantity + 1 } : l,
          ),
        };
      }
      const unitPrice =
        action.mode === 'sale'
          ? action.product.currentSellingPrice
          : action.product.currentImportPrice;
      return {
        ...state,
        lines: [
          ...state.lines,
          {
            lineId: uuidv4(),
            productId: action.product.id,
            productName: action.product.name,
            productUnit: action.product.unit,
            quantity: 1,
            unitPrice,
          },
        ],
      };
    }
    case 'UPDATE':
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.lineId === action.lineId ? { ...l, ...action.patch } : l,
        ),
      };
    case 'REMOVE':
      return { ...state, lines: state.lines.filter((l) => l.lineId !== action.lineId) };
    case 'SET_PARTY':
      return { ...state, partyName: action.name };
    case 'CLEAR':
      return init();
  }
}

export function BillBuilder({ mode }: { mode: Mode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const products = useProducts();
  const createSale = useCreateSaleBill();
  const createImport = useCreateImportBill();

  // Persist the idempotency key across retries of the SAME bill attempt.
  // Regenerated only after a successful save or an explicit clear.
  const idempotencyKey = useRef<string | null>(null);
  function ensureKey(): string {
    if (!idempotencyKey.current) idempotencyKey.current = uuidv4();
    return idempotencyKey.current;
  }

  const productsById = useMemo(() => {
    const map = new Map<number, Product>();
    for (const p of products.data ?? []) map.set(p.id, p);
    return map;
  }, [products.data]);

  const inCart = useMemo(() => {
    const map = new Map<number, number>();
    for (const l of state.lines) {
      map.set(l.productId, (map.get(l.productId) ?? 0) + l.quantity);
    }
    return map;
  }, [state.lines]);

  const hasOversold =
    mode === 'sale' &&
    state.lines.some((l) => {
      const p = productsById.get(l.productId);
      return p != null && l.quantity > p.currentStock;
    });

  async function handleSubmit() {
    const key = ensureKey();
    const input = {
      partyName: state.partyName.trim() ? state.partyName.trim() : null,
      lines: state.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    };
    const mutation = mode === 'sale' ? createSale : createImport;
    try {
      await mutation.mutateAsync({ input, idempotencyKey: key });
      toast.success(
        mode === 'sale'
          ? `Đã lưu hóa đơn bán (${state.lines.length} mặt hàng).`
          : `Đã lưu hóa đơn nhập (${state.lines.length} mặt hàng).`,
      );
      idempotencyKey.current = null;
      dispatch({ type: 'CLEAR' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.problem) {
        const currentStock = err.problem.currentStock as number | undefined;
        const requested = err.problem.requested as number | undefined;
        const productId = err.problem.productId as number | undefined;
        if (currentStock !== undefined && requested !== undefined) {
          const productName = productId
            ? productsById.get(productId)?.name ?? `#${productId}`
            : 'sản phẩm';
          toast.error(
            `Không đủ tồn kho cho ${productName}: cần ${formatNumber(requested)}, còn ${formatNumber(currentStock)}. Hóa đơn KHÔNG được lưu.`,
          );
          return;
        }
        toast.error(err.problem.detail ?? 'Xung đột (409). Hóa đơn KHÔNG được lưu.');
        return;
      }
      const msg =
        err instanceof ApiError && err.problem?.detail
          ? err.problem.detail
          : mode === 'sale'
            ? 'Lưu hóa đơn bán thất bại'
            : 'Lưu hóa đơn nhập thất bại';
      toast.error(msg);
    }
  }

  function handleClear() {
    idempotencyKey.current = null;
    dispatch({ type: 'CLEAR' });
  }

  const submitting = createSale.isPending || createImport.isPending;

  return (
    <div style={THEMES[mode]} className="flex h-full min-h-0 flex-col">
      <PageBanner mode={mode} />
      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-[18px] lg:grid-cols-[330px_minmax(0,1fr)]">
        <ProductCatalog
          mode={mode}
          inCart={inCart}
          onAdd={(product) => dispatch({ type: 'ADD', product, mode })}
        />
        <BillForm
          mode={mode}
          partyName={state.partyName}
          lines={state.lines}
          productsById={productsById}
          submitting={submitting}
          hasOversold={hasOversold}
          onPartyChange={(name) => dispatch({ type: 'SET_PARTY', name })}
          onLineChange={(lineId, patch) => dispatch({ type: 'UPDATE', lineId, patch })}
          onRemoveLine={(lineId) => dispatch({ type: 'REMOVE', lineId })}
          onSubmit={handleSubmit}
          onClear={handleClear}
        />
      </div>
    </div>
  );
}
