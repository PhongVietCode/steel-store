import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ProductProfitRow {
  productId: number;
  name: string;
  qtySold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface DailyProfitRow {
  date: string; // YYYY-MM-DD
  revenue: number;
  cost: number;
  profit: number;
}

export interface ProfitReport {
  from: string; // YYYY-MM-DD
  to: string;
  revenue: number;
  cost: number;
  profit: number;
  byProduct: ProductProfitRow[];
  daily: DailyProfitRow[];
}

export function useProfitReport(from: string, to: string) {
  return useQuery({
    enabled: Boolean(from && to),
    queryKey: ['profit', { from, to }] as const,
    queryFn: () => api<ProfitReport>('/reports/profit', { query: { from, to } }),
  });
}
