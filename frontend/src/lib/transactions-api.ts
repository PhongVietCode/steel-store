import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type TransactionType = 'IMPORT' | 'SALE';

export interface Transaction {
  id: number;
  type: TransactionType;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  costBasisPerUnit: number | null;
  total: number;
  occurredAt: string;
  idempotencyKey: string;
  correctionOfId: number | null;
  note: string | null;
}

export interface RecordImportInput {
  productId: number;
  quantity: number;
  unitPrice: number;
  note?: string | null;
}

export interface RecordSaleInput {
  productId: number;
  quantity: number;
  unitPrice: number;
  note?: string | null;
}

export interface TransactionsFilters {
  productId?: number | null;
  type?: TransactionType | null;
  from?: string | null; // ISO date (yyyy-mm-dd) — we'll convert on send
  to?: string | null;
  page?: number;
  size?: number;
}

interface SpringPage<T> {
  content: T[];
  number: number;
  numberOfElements: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

const TX_KEY = ['transactions'] as const;
const PRODUCTS_KEY = ['products'] as const;

export function useTransactions(filters: TransactionsFilters) {
  const { productId, type, from, to, page = 0, size = 20 } = filters;
  return useQuery({
    queryKey: [...TX_KEY, { productId, type, from, to, page, size }] as const,
    queryFn: () =>
      api<SpringPage<Transaction>>('/transactions', {
        query: {
          productId: productId ?? undefined,
          type: type ?? undefined,
          from: from ? toIsoStart(from) : undefined,
          to: to ? toIsoEndExclusive(to) : undefined,
          page,
          size,
          sort: 'occurredAt,desc',
        },
      }),
  });
}

export function useRecordImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordImportInput) =>
      api<Transaction>('/transactions/imports', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useRecordSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordSaleInput) =>
      api<Transaction>('/transactions/sales', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useReverseTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      api<Transaction>(`/transactions/${id}/reverse`, {
        method: 'POST',
        body: { note: note ?? null },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

/** YYYY-MM-DD -> ISO instant at midnight Asia/Ho_Chi_Minh (UTC+7). */
function toIsoStart(date: string): string {
  return `${date}T00:00:00+07:00`;
}
function toIsoEndExclusive(date: string): string {
  // Backend uses < to; pass start-of-next-day for an inclusive "to" UX.
  const d = new Date(`${date}T00:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}
