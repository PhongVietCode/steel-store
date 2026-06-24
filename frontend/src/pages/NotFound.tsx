import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="space-y-4 text-center">
        <div className="text-6xl font-semibold tabular-nums text-neutral-300">404</div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Không tìm thấy trang</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Liên kết có thể đã thay đổi hoặc trang chưa được triển khai.
          </p>
        </div>
        <Button asChild>
          <Link to="/">Về bảng điều khiển</Link>
        </Button>
      </div>
    </div>
  );
}
