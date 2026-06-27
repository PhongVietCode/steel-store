import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from '@/components/layout/BrandMark';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.problem?.detail) setError(err.problem.detail);
      else setError('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full min-h-screen">
      <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink p-12 text-card lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #ff6a1a 0 10px, transparent 10px 28px)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-ink">
            <BrandMark size={24} />
          </span>
          <div>
            <div className="text-[15px] font-semibold leading-tight">Đức Phong</div>
            <div className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-card/60">
              Quản lý kho thép
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[36px] font-semibold leading-[1.1] tracking-tight">
            Theo dõi tồn kho, hóa đơn và lợi nhuận từ một bảng điều khiển.
          </h1>
          <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-card/70">
            Một hệ thống gọn nhẹ cho cửa hàng thép: ghi nhận nhập hàng, xuất bán nhiều
            mặt hàng trên cùng một hóa đơn, hoàn hóa đơn khi cần, và xem báo cáo lợi
            nhuận trong vài giây.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-6 border-t border-card/15 pt-6">
          <Stat label="Hóa đơn" value="Đa mặt hàng" />
          <Stat label="Báo cáo" value="Theo ngày" />
          <Stat label="Hoàn đơn" value="Toàn bộ" />
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-card px-6 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
              Đăng nhập
            </div>
            <h2 className="mt-1 text-[26px] font-semibold tracking-tight text-ink">
              Chào mừng trở lại
            </h2>
            <p className="mt-2 text-[12.5px] text-muted">
              Đăng nhập với tài khoản quản trị để tiếp tục.
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Tên đăng nhập
            </span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10 w-full rounded-md border border-line bg-card px-3 text-[13.5px] text-ink focus:border-accent focus:outline-none"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Mật khẩu
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-md border border-line bg-card px-3 text-[13.5px] text-ink focus:border-accent focus:outline-none"
              required
            />
          </label>

          {error ? (
            <div
              role="alert"
              className="rounded-md border border-status-danger/30 bg-status-danger/8 px-3 py-2 text-[12.5px] text-status-danger"
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="h-10 w-full rounded-md bg-accent text-[13px] font-semibold text-white transition-colors hover:bg-[#e85a0e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>

          <p className="text-center text-[11px] text-muted">
            © 2026 Đức Phong · v0.1
          </p>
        </form>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-card/55">
        {label}
      </div>
      <div className="mt-1.5 text-[15px] font-semibold tracking-tight text-card">
        {value}
      </div>
    </div>
  );
}
