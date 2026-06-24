import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNumber, formatVnd } from '@/lib/format';
import { useProfitReport, type ProfitReport } from '@/lib/reports-api';
import { cn } from '@/lib/utils';

const REPORT_TZ = 'Asia/Ho_Chi_Minh';

type Preset = '7d' | '30d' | 'mtd' | 'ytd';

export function DashboardPage() {
  const [{ from, to }, setRange] = useState(() => defaultRange());

  const report = useProfitReport(from, to);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bảng điều khiển</h1>
          <p className="text-sm text-neutral-500">
            Doanh thu, giá vốn và lợi nhuận theo khoảng ngày (giờ Việt Nam).
          </p>
        </div>
        <DateRangeBar
          from={from}
          to={to}
          onChange={(next) => setRange(next)}
        />
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label="Doanh thu"
          value={report.data?.revenue ?? 0}
          loading={report.isPending}
          tone="neutral"
        />
        <KpiCard
          label="Giá vốn"
          value={report.data?.cost ?? 0}
          loading={report.isPending}
          tone="neutral"
        />
        <KpiCard
          label="Lợi nhuận"
          value={report.data?.profit ?? 0}
          loading={report.isPending}
          tone={(report.data?.profit ?? 0) >= 0 ? 'positive' : 'negative'}
        />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">Lợi nhuận theo ngày</h2>
          {report.data ? (
            <span className="text-xs text-neutral-500">
              {report.data.daily.length === 0
                ? 'Chưa có dữ liệu'
                : `${report.data.daily.length} ngày có giao dịch`}
            </span>
          ) : null}
        </div>
        <DailyProfitChart report={report.data} loading={report.isPending} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-700">Lợi nhuận theo sản phẩm</h2>
        <ByProductTable report={report.data} loading={report.isPending} />
      </section>
    </div>
  );
}

interface DateRange {
  from: string;
  to: string;
}

function DateRangeBar({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (r: DateRange) => void;
}) {
  function applyPreset(p: Preset) {
    onChange(rangeForPreset(p));
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="space-y-1">
        <Label className="text-xs uppercase tracking-wide">Từ</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs uppercase tracking-wide">Đến</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
        />
      </div>
      <div className="flex gap-1.5">
        <PresetButton onClick={() => applyPreset('7d')}>7 ngày</PresetButton>
        <PresetButton onClick={() => applyPreset('30d')}>30 ngày</PresetButton>
        <PresetButton onClick={() => applyPreset('mtd')}>Tháng này</PresetButton>
        <PresetButton onClick={() => applyPreset('ytd')}>Năm nay</PresetButton>
      </div>
    </div>
  );
}

function PresetButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}

function KpiCard({
  label,
  value,
  loading,
  tone,
}: {
  label: string;
  value: number;
  loading: boolean;
  tone: 'neutral' | 'positive' | 'negative';
}) {
  const colorClass =
    tone === 'positive'
      ? 'text-emerald-600'
      : tone === 'negative'
        ? 'text-red-600'
        : 'text-neutral-900';
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div
        className={cn('mt-2 text-2xl font-semibold tabular-nums', colorClass, loading && 'opacity-50')}
      >
        {loading ? '—' : formatVnd(value)}
      </div>
    </div>
  );
}

function DailyProfitChart({
  report,
  loading,
}: {
  report: ProfitReport | undefined;
  loading: boolean;
}) {
  const data = useMemo(() => {
    if (!report) return [];
    return report.daily.map((d) => ({ ...d, label: shortDate(d.date) }));
  }, [report]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-md bg-neutral-100" />;
  }
  if (!data.length) {
    return (
      <div className="grid h-64 place-items-center text-sm text-neutral-500">
        Không có giao dịch nào trong khoảng đã chọn.
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#737373' }} tickMargin={6} />
          <YAxis
            tick={{ fontSize: 12, fill: '#737373' }}
            tickFormatter={(v: number) => compactNumber(v)}
            width={64}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e5e5',
              fontSize: 12,
            }}
            formatter={(value) => [formatVnd(Number(value)), 'Lợi nhuận']}
            labelFormatter={(label, items) => {
              const row = items?.[0]?.payload as { date?: string } | undefined;
              return row?.date ? formatLongDate(row.date) : String(label);
            }}
          />
          <Bar dataKey="profit" radius={[4, 4, 0, 0]} fill="#0a0a0a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ByProductTable({
  report,
  loading,
}: {
  report: ProfitReport | undefined;
  loading: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sản phẩm</TableHead>
          <TableHead className="text-right">Số lượng</TableHead>
          <TableHead className="text-right">Doanh thu</TableHead>
          <TableHead className="text-right">Giá vốn</TableHead>
          <TableHead className="text-right">Lợi nhuận</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={5} className="py-10 text-center text-neutral-500">
              Đang tải…
            </TableCell>
          </TableRow>
        ) : !report || report.byProduct.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-10 text-center text-neutral-500">
              Không có sản phẩm bán ra trong khoảng đã chọn.
            </TableCell>
          </TableRow>
        ) : (
          report.byProduct.map((row) => (
            <TableRow key={row.productId}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="text-right tabular-nums">{formatNumber(row.qtySold)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatVnd(row.revenue)}</TableCell>
              <TableCell className="text-right tabular-nums text-neutral-600">
                {formatVnd(row.cost)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right tabular-nums font-medium',
                  row.profit >= 0 ? 'text-emerald-700' : 'text-red-700',
                )}
              >
                {formatVnd(row.profit)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

// --- helpers (all dates handled in Asia/Ho_Chi_Minh) ---

function defaultRange(): DateRange {
  return rangeForPreset('30d');
}

function rangeForPreset(p: Preset): DateRange {
  const today = todayInZone();
  switch (p) {
    case '7d': {
      const start = addDays(today, -6); // 7 days inclusive of today
      return { from: toIso(start), to: toIso(today) };
    }
    case '30d': {
      const start = addDays(today, -29);
      return { from: toIso(start), to: toIso(today) };
    }
    case 'mtd':
      return { from: toIso({ ...today, d: 1 }), to: toIso(today) };
    case 'ytd':
      return { from: toIso({ y: today.y, m: 1, d: 1 }), to: toIso(today) };
  }
}

type Ymd = { y: number; m: number; d: number };

function todayInZone(): Ymd {
  // Use Intl to get the date parts in Asia/Ho_Chi_Minh regardless of host TZ.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  return { y, m, d };
}

function toIso({ y, m, d }: Ymd): string {
  return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d
    .toString()
    .padStart(2, '0')}`;
}

function addDays(ymd: Ymd, days: number): Ymd {
  const date = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  date.setUTCDate(date.getUTCDate() + days);
  return {
    y: date.getUTCFullYear(),
    m: date.getUTCMonth() + 1,
    d: date.getUTCDate(),
  };
}

function shortDate(iso: string): string {
  // 2026-06-24 -> 24/6
  const [, m, d] = iso.split('-').map(Number);
  return `${d}/${m}`;
}

function formatLongDate(iso: string): string {
  // 2026-06-24 -> 24/06/2026
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function compactNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'tỷ';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'tr';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return String(n);
}
