import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-[60vh] place-items-center p-8">
          <div className="max-w-md space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <h1 className="text-lg font-semibold text-red-900">Đã xảy ra lỗi không mong muốn</h1>
            <p className="text-sm text-red-700">
              Vui lòng tải lại trang. Nếu vẫn tiếp diễn, hãy kiểm tra kết nối máy chủ.
            </p>
            <pre className="overflow-auto rounded-md bg-white p-3 text-left text-xs text-neutral-700">
              {this.state.error.message}
            </pre>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => window.location.assign('/')}>
                Về trang chủ
              </Button>
              <Button onClick={this.reset}>Thử lại</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
