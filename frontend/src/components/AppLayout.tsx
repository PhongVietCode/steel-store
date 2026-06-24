import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { to: '/', label: 'Bảng điều khiển', end: true },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/imports', label: 'Nhập hàng' },
  { to: '/sales', label: 'Bán hàng' },
  { to: '/transactions', label: 'Lịch sử giao dịch' },
];

export function AppLayout() {
  const { username, logout } = useAuth();
  return (
    <div className="flex h-full">
      <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-6">
        <div className="mb-8 px-2">
          <div className="text-lg font-semibold tracking-tight">Steel Store</div>
          <div className="text-xs text-neutral-500">Bảng quản trị</div>
        </div>
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-neutral-200 pt-4 text-sm">
          <div className="px-2 pb-2 text-neutral-600">
            Đăng nhập:{' '}
            <span className="font-medium text-neutral-900">{username ?? '—'}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
