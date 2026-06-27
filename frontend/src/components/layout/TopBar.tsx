import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const TITLES: Array<{ match: RegExp; title: string; sub?: string }> = [
  { match: /^\/$/, title: 'Tổng quan', sub: 'Theo dõi doanh thu, tồn kho và hoạt động gần đây' },
  { match: /^\/sales(\/|$)/, title: 'Bán hàng', sub: 'Tạo hóa đơn bán với nhiều mặt hàng' },
  { match: /^\/imports(\/|$)/, title: 'Nhập hàng', sub: 'Ghi nhận lô hàng nhập từ nhà cung cấp' },
  { match: /^\/bills(\/|$)/, title: 'Lịch sử hóa đơn', sub: 'Tra cứu, lọc và hoàn hóa đơn' },
  { match: /^\/products(\/|$)/, title: 'Sản phẩm', sub: 'Quản lý danh mục mặt hàng và giá' },
];

function initials(name: string | null | undefined) {
  if (!name) return 'AD';
  const trimmed = name.trim();
  if (!trimmed) return 'AD';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function TopBar() {
  const { pathname } = useLocation();
  const { username } = useAuth();
  const meta = TITLES.find((t) => t.match.test(pathname));

  return (
    <header className="flex h-[66px] shrink-0 items-center gap-6 border-b border-line bg-card px-8">
      <div className="min-w-0">
        <div className="text-[17px] font-semibold leading-tight tracking-tight text-ink">
          {meta?.title ?? 'Đức Phong'}
        </div>
        {meta?.sub ? (
          <div className="mt-0.5 truncate text-[11.5px] text-muted">{meta.sub}</div>
        ) : null}
      </div>

      <div className="relative ml-auto hidden w-[280px] md:block">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          placeholder="Tìm mặt hàng, hóa đơn…"
          className="h-9 w-full rounded-md border border-line bg-bg pr-3 pl-9 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-[10px]">
        <div className="text-right">
          <div className="text-[13px] leading-tight font-semibold text-ink">
            {username ?? 'admin'}
          </div>
          <div className="text-[11px] font-medium text-muted">
            Quản trị viên
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-[13px] font-semibold text-white">
          {initials(username)}
        </div>
      </div>
    </header>
  );
}
