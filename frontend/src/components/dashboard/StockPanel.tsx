import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatNumber } from '@/lib/format';
import { useProducts } from '@/lib/products-api';

const LOW_THRESHOLD = 0.25;

export function StockPanel() {
  const { data: products = [], isPending } = useProducts();
  const sorted = [...products].sort((a, b) => b.currentStock - a.currentStock).slice(0, 6);
  const max = sorted.reduce((m, p) => Math.max(m, p.currentStock), 0);

  return (
    <Panel>
      <PanelHeader
        title="Tồn kho"
        subtitle="Tỷ lệ so với sản phẩm có tồn kho cao nhất"
      />
      <PanelBody className="space-y-3.5">
        {isPending ? (
          <div className="text-[12.5px] text-muted">Đang tải…</div>
        ) : sorted.length === 0 ? (
          <div className="text-[12.5px] text-muted">Chưa có sản phẩm nào.</div>
        ) : (
          sorted.map((p) => {
            const ratio = max > 0 ? p.currentStock / max : 0;
            const low = ratio < LOW_THRESHOLD;
            return (
              <div key={p.id}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <div className="text-[12.5px] font-medium text-ink">{p.name}</div>
                  <div className="mono text-[12px] text-muted">
                    {formatNumber(p.currentStock)} {p.unit}
                  </div>
                </div>
                <ProgressBar
                  value={p.currentStock}
                  max={max || 1}
                  tone={low ? 'low' : 'normal'}
                />
              </div>
            );
          })
        )}
      </PanelBody>
    </Panel>
  );
}
