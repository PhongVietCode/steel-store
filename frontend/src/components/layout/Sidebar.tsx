import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { BrandMark } from './BrandMark';

type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Nghiệp vụ',
    items: [
      { to: '/sales', label: 'Bán hàng', Icon: ShoppingCart },
      { to: '/imports', label: 'Nhập hàng', Icon: Truck },
    ],
  },
  {
    label: 'Theo dõi',
    items: [
      { to: '/', label: 'Tổng quan', Icon: LayoutDashboard, end: true },
      { to: '/bills', label: 'Lịch sử', Icon: ClipboardList },
    ],
  },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex w-[236px] shrink-0 flex-col bg-ink text-[#aeb4ba]">
      <div className="flex items-center gap-[11px] px-[22px] pt-[22px] pb-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-ink-2 text-accent">
          <BrandMark size={22} />
        </span>
        <div>
          <div className="text-[16px] leading-none font-bold tracking-[0.03em] whitespace-nowrap text-white">
            Đức Phong
          </div>
          <div className="mt-[3px] text-[10px] font-medium tracking-[0.16em] text-[#7b828a] uppercase">
            Quản lý kho thép
          </div>
        </div>
      </div>

      <nav className="flex-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-[22px] pt-[18px] pb-2 text-[10px] font-medium tracking-[0.14em] text-[#5f666e] uppercase">
              {group.label}
            </div>
            {group.items.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-[13px] border-l-[3px] px-[22px] py-[11px] text-[14px] font-medium transition-colors',
                    isActive
                      ? 'border-accent bg-white/[0.045] text-white [&_svg]:stroke-accent'
                      : 'border-transparent text-[#a3a9b0] hover:bg-white/[0.025] hover:text-white [&_svg]:stroke-[#8a9098]',
                  ].join(' ')
                }
              >
                <Icon size={18} strokeWidth={1.6} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-white/[0.07] px-[22px] py-[18px]">
        <NavLink
          to="/products"
          className={({ isActive }) =>
            [
              'flex items-center gap-[10px] text-[13px] font-medium transition-colors',
              isActive
                ? 'text-white [&_svg]:stroke-accent'
                : 'text-[#8a9098] hover:text-white',
            ].join(' ')
          }
        >
          <Package size={16} strokeWidth={1.6} />
          <span>Quản lý sản phẩm</span>
        </NavLink>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-[10px] text-left text-[13px] font-medium text-[#8a9098] transition-colors hover:text-white"
        >
          <LogOut size={16} strokeWidth={1.6} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
