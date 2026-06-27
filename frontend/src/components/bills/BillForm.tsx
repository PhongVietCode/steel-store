import { Check } from 'lucide-react';
import { formatNumber, formatVnd } from '@/lib/format';
import type { Product } from '@/lib/products-api';
import { BillLineItem } from './BillLineItem';

export type DraftLine = {
  lineId: string;
  productId: number;
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  mode: 'sale' | 'import';
  partyName: string;
  lines: DraftLine[];
  productsById: Map<number, Product>;
  submitting: boolean;
  hasOversold: boolean;
  onPartyChange: (name: string) => void;
  onLineChange: (lineId: string, patch: Partial<Pick<DraftLine, 'quantity' | 'unitPrice'>>) => void;
  onRemoveLine: (lineId: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

function formatToday() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function BillForm({
  mode,
  partyName,
  lines,
  productsById,
  submitting,
  hasOversold,
  onPartyChange,
  onLineChange,
  onRemoveLine,
  onSubmit,
  onClear,
}: Props) {
  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const unitCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const partyLabel = mode === 'sale' ? 'Khách hàng' : 'Nhà cung cấp';
  const partyPlaceholder = mode === 'sale' ? 'Tên khách (tùy chọn)' : 'Tên nhà cung cấp (tùy chọn)';
  const title = mode === 'sale' ? 'Đơn bán mới' : 'Đơn nhập mới';
  const dateLine = mode === 'sale'
    ? `Hôm nay · ${formatToday()}`
    : `Đơn mua · ${formatToday()}`;
  const submitLabel = mode === 'sale' ? 'Tạo đơn bán' : 'Phát hành đơn mua';
  const emptyTitle = mode === 'sale' ? 'Đơn bán trống' : 'Đơn nhập trống';
  const emptyHint = mode === 'sale'
    ? 'Chọn sản phẩm từ danh mục bên trái để bắt đầu lập hóa đơn.'
    : 'Chọn sản phẩm từ danh mục bên trái để lập đơn mua hàng loạt.';
  const totalsLabel = mode === 'sale' ? 'Tổng cộng' : 'Tổng chi phí';
  const priceColLabel = mode === 'sale' ? 'Đơn giá' : 'Giá nhập';

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-line border-t-[3px] border-t-[var(--theme,var(--color-accent))] bg-card">
      <header className="flex items-start justify-between gap-5 border-b border-line px-[22px] py-[18px]">
        <div className="min-w-0">
          <div className="text-[18px] leading-none font-bold tracking-tight text-ink">
            {title}
          </div>
          <div className="mt-1 text-[12px] text-muted">{dateLine}</div>
        </div>
        <div className="min-w-[240px]">
          <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.05em] text-muted uppercase">
            {partyLabel}
          </label>
          <input
            value={partyName}
            onChange={(e) => onPartyChange(e.target.value)}
            placeholder={partyPlaceholder}
            maxLength={200}
            className="w-full rounded-md border border-line bg-bg px-3 py-2.5 text-[13px] font-medium text-ink placeholder:font-normal placeholder:text-muted focus:border-accent focus:bg-card focus:outline-none"
          />
        </div>
      </header>

      {lines.length > 0 ? (
        <>
          <div className="grid grid-cols-[1fr_104px_118px_124px_30px] gap-2.5 border-b border-line bg-[#fafbfb] px-5 py-[11px] text-[11px] font-semibold tracking-[0.05em] text-muted uppercase">
            <div>Sản phẩm</div>
            <div className="text-right">{priceColLabel}</div>
            <div className="text-center">Số lượng</div>
            <div className="text-right">Thành tiền</div>
            <div></div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {lines.map((line) => {
              const product = productsById.get(line.productId);
              return (
                <BillLineItem
                  key={line.lineId}
                  line={line}
                  mode={mode}
                  maxQuantity={mode === 'sale' ? product?.currentStock : undefined}
                  onChange={(patch) => onLineChange(line.lineId, patch)}
                  onRemove={() => onRemoveLine(line.lineId)}
                />
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-[22px] py-14 text-center">
          <div>
            <div className="text-[14px] font-semibold text-[#9aa1a8]">{emptyTitle}</div>
            <div className="mt-1.5 text-[12.5px] text-muted">{emptyHint}</div>
          </div>
        </div>
      )}

      <footer className="mt-auto flex items-end justify-between gap-6 rounded-b-lg border-t border-line bg-[#fafbfb] px-[22px] py-[18px]">
        <div className="flex items-center gap-2.5">
          {lines.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              disabled={submitting}
              className="rounded-md border border-line bg-card px-[18px] py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || lines.length === 0 || hasOversold}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--theme,var(--color-accent))] px-[18px] py-2.5 text-[13px] font-semibold text-[var(--theme-ink,#1a1206)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={15} strokeWidth={2} />
            {submitting ? 'Đang lưu…' : submitLabel}
          </button>
        </div>

        <div className="w-[280px]">
          <TotalRow label="Số mặt hàng" value={String(lines.length)} />
          <TotalRow label="Tổng số lượng" value={`${formatNumber(unitCount)} đơn vị`} />
          <TotalRow
            label={totalsLabel}
            value={formatVnd(total)}
            grand
          />
          {hasOversold ? (
            <p className="mt-2 text-right text-[11px] font-medium text-status-danger">
              Có dòng vượt tồn kho — điều chỉnh trước khi lưu.
            </p>
          ) : null}
        </div>
      </footer>
    </section>
  );
}

function TotalRow({
  label,
  value,
  grand,
}: {
  label: string;
  value: string;
  grand?: boolean;
}) {
  return (
    <div
      className={
        grand
          ? 'mt-2 flex items-baseline justify-between border-t border-line pt-3 text-[15px] font-semibold text-ink'
          : 'flex items-baseline justify-between py-1 text-[13px] text-muted'
      }
    >
      <span>{label}</span>
      <span
        className={
          grand
            ? 'mono text-[21px] font-semibold text-ink'
            : 'mono font-semibold text-ink'
        }
      >
        {value}
      </span>
    </div>
  );
}
