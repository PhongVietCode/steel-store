import { Link } from 'react-router-dom';
import { Chip } from '@/components/ui/chip';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel';
import { useBills } from '@/lib/bills-api';
import { formatVnd } from '@/lib/format';

export function RecentActivityPanel() {
  const { data, isPending } = useBills({ page: 0, size: 8 });
  const bills = data?.content ?? [];

  return (
    <Panel>
      <PanelHeader
        title="Hoạt động gần đây"
        subtitle="8 hóa đơn mới nhất"
        action={
          <Link
            to="/bills"
            className="text-[12px] font-semibold text-accent hover:underline"
          >
            Xem tất cả →
          </Link>
        }
      />
      <PanelBody className="p-0">
        {isPending ? (
          <div className="px-5 py-6 text-[12.5px] text-muted">Đang tải…</div>
        ) : bills.length === 0 ? (
          <div className="px-5 py-6 text-[12.5px] text-muted">Chưa có hóa đơn nào.</div>
        ) : (
          <ul className="divide-y divide-line">
            {bills.map((b) => {
              const isCounter = b.correctionOfBillId != null;
              const isReversed = b.reversedByBillId != null;
              return (
                <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <Chip tone={b.type === 'SALE' ? 'ok' : 'info'}>
                    {b.type === 'SALE' ? 'Bán' : 'Nhập'}
                  </Chip>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium text-ink">
                      {b.partyName ?? (b.type === 'SALE' ? 'Khách lẻ' : 'Nhà cung cấp')}
                      <span className="mono ml-2 text-[11px] text-muted">#{b.id}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {formatTime(b.occurredAt)} · {b.lines.length} mặt hàng
                    </div>
                  </div>
                  {isCounter ? (
                    <Chip tone="warn">Hoàn</Chip>
                  ) : isReversed ? (
                    <Chip tone="muted">Đã hoàn</Chip>
                  ) : null}
                  <div className="mono w-32 shrink-0 text-right text-[13px] font-semibold text-ink">
                    {formatVnd(b.total)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}
