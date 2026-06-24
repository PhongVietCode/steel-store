import { useAuth } from '@/lib/auth-context';

export function DashboardPage() {
  const { username } = useAuth();
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Bảng điều khiển</h1>
      <p className="text-neutral-600">
        Xin chào <span className="font-medium text-neutral-900">{username}</span>.
      </p>
      <p className="text-sm text-neutral-500">
        Các báo cáo doanh thu / lợi nhuận sẽ xuất hiện ở đây khi giai đoạn 9 được triển khai.
      </p>
    </div>
  );
}
