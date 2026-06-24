import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth-context';
import { DashboardPage } from '@/pages/Dashboard';
import { ImportsPage } from '@/pages/Imports';
import { LoginPage } from '@/pages/Login';
import { NotFoundPage } from '@/pages/NotFound';
import { ProductsPage } from '@/pages/Products';
import { SalesPage } from '@/pages/Sales';
import { TransactionsPage } from '@/pages/Transactions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000 },
    mutations: { retry: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/imports" element={<ImportsPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </ErrorBoundary>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
