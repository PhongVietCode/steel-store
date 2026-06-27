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
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { RecentActivityPanel } from '@/components/dashboard/RecentActivityPanel';
import { StockPanel } from '@/components/dashboard/StockPanel';
import { Button } from '@/components/ui/button';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBills } from '@/lib/bills-api';
import { formatNumber, formatVnd } from '@/lib/format';
import { useProfitReport, type ProfitReport } from '@/lib/reports-api';
import { cn } from '@/lib/utils';

const REPORT_TZ = 'Asia/Ho_Chi_Minh';

type Preset = '7d' | '30d' | 'mtd' | 'ytd';

export function DashboardPage() {
  const [{ from, to, preset }, setRange] = useState(() => ({
    ...rangeForPreset('30d'),
    preset: '30d' as Preset,
  }));

  const report = useProfitReport(from, to);
  const billsInRange = useBills({
    from,
    to,
    type: 'SALE',
    page: 0,
    size: 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
            Khoảng: {from} → {to}
          </div>
          <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-ink">
            Doanh số & tồn kho
          </h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['7d', '30d', 'mtd', 'ytd'] as const).map((p) => (
            <Button
              key={p}
              variant={preset === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange({ ...rangeForPreset(p), preset: p })}
            >
              {presetLabel(p)}
            </Button>
          ))}
        </div>
      </div>

      <KpiGrid
        report={report.data}
        billCount={billsInRange.data?.totalElements}
        loading={report.isPending}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel>
            <PanelHeader
              title="Lợi nhuận theo ngày"
              subtitle={
                report.data
                  ? `${report.data.daily.length} ngày có doanh thu`
                  : ' '
              }
            />
            <PanelBody>
              <DailyProfitChart report={report.data} loading={report.isPending} />
            </PanelBody>
          </Panel>
        </div>
        <StockPanel />
      </div>

      <RecentActivityPanel />

      <Panel>
        <PanelHeader title="Lợi nhuận theo sản phẩm" />
        <PanelBody className="p-0">
          <ByProductTable report={report.data} loading={report.isPending} />
        </PanelBody>
      </Panel>
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
    return <div className="h-64 animate-pulse rounded-md bg-bg" />;
  }
  if (!data.length) {
    return (
      <div className="grid h-64 place-items-center text-[12.5px] text-muted">
        Không có giao dịch nào trong khoảng đã chọn.
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e3e5e7" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6a7178' }} tickMargin={6} />
          <YAxis
            tick={{ fontSize: 11, fill: '#6a7178' }}
            tickFormatter={(v: number) => compactNumber(v)}
            width={56}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e3e5e7',
              fontSize: 12,
            }}
            formatter={(value) => [formatVnd(Number(value)), 'Lợi nhuận']}
            labelFormatter={(label, items) => {
              const row = items?.[0]?.payload as { date?: string } | undefined;
              return row?.date ? formatLongDate(row.date) : String(label);
            }}
          />
          <Bar dataKey="profit" radius={[3, 3, 0, 0]} fill="#ff6a1a" />
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
            <TableCell colSpan={5} className="py-10 text-center text-muted">
              Đang tải…
            </TableCell>
          </TableRow>
        ) : !report || report.byProduct.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-10 text-center text-muted">
              Không có sản phẩm bán ra trong khoảng đã chọn.
            </TableCell>
          </TableRow>
        ) : (
          report.byProduct.map((row) => (
            <TableRow key={row.productId}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="mono text-right">{formatNumber(row.qtySold)}</TableCell>
              <TableCell className="mono text-right">{formatVnd(row.revenue)}</TableCell>
              <TableCell className="mono text-right text-muted">{formatVnd(row.cost)}</TableCell>
              <TableCell
                className={cn(
                  'mono text-right font-semibold',
                  row.profit >= 0 ? 'text-status-ok' : 'text-status-danger',
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

// --- helpers ---

function presetLabel(p: Preset): string {
  switch (p) {
    case '7d': return '7 ngày';
    case '30d': return '30 ngày';
    case 'mtd': return 'Tháng này';
    case 'ytd': return 'Năm nay';
  }
}

interface DateRange { from: string; to: string }

function rangeForPreset(p: Preset): DateRange {
  const today = todayInZone();
  switch (p) {
    case '7d': return { from: toIso(addDays(today, -6)), to: toIso(today) };
    case '30d': return { from: toIso(addDays(today, -29)), to: toIso(today) };
    case 'mtd': return { from: toIso({ ...today, d: 1 }), to: toIso(today) };
    case 'ytd': return { from: toIso({ y: today.y, m: 1, d: 1 }), to: toIso(today) };
  }
}

type Ymd = { y: number; m: number; d: number };

function todayInZone(): Ymd {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return {
    y: Number(parts.find((p) => p.type === 'year')?.value),
    m: Number(parts.find((p) => p.type === 'month')?.value),
    d: Number(parts.find((p) => p.type === 'day')?.value),
  };
}

function toIso({ y, m, d }: Ymd): string {
  return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
}

function addDays(ymd: Ymd, days: number): Ymd {
  const date = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  date.setUTCDate(date.getUTCDate() + days);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d}/${m}`;
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function compactNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'tỷ';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'tr';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return String(n);
}
