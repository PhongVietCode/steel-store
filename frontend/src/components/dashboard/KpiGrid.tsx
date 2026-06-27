import { KpiCard } from '@/components/ui/kpi-card';
import { formatNumber, formatVnd } from '@/lib/format';
import type { ProfitReport } from '@/lib/reports-api';

type Props = {
  report: ProfitReport | undefined;
  billCount: number | undefined;
  loading: boolean;
};

export function KpiGrid({ report, billCount, loading }: Props) {
  const profit = report?.profit ?? 0;
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Doanh thu"
        value={loading ? '—' : formatVnd(report?.revenue ?? 0)}
        hint="Tổng giá trị bán ra"
      />
      <KpiCard
        label="Giá vốn"
        value={loading ? '—' : formatVnd(report?.cost ?? 0)}
        hint="Chi phí nhập hàng tương ứng"
      />
      <KpiCard
        label="Lợi nhuận"
        value={loading ? '—' : formatVnd(profit)}
        hint="Doanh thu − giá vốn"
        delta={
          loading
            ? undefined
            : {
                value: profit >= 0 ? 'Dương' : 'Âm',
                direction: profit >= 0 ? 'up' : 'down',
                tone: profit >= 0 ? 'ok' : 'danger',
              }
        }
      />
      <KpiCard
        label="Số hóa đơn"
        value={loading || billCount == null ? '—' : formatNumber(billCount)}
        hint="Trong khoảng đã chọn"
      />
    </section>
  );
}
