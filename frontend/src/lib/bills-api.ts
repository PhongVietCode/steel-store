import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type BillType = 'IMPORT' | 'SALE';

export interface BillLine {
  id: number;
  productId: number;
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
  costBasisPerUnit: number | null;
  total: number;
  note: string | null;
}

export interface Bill {
  id: number;
  type: BillType;
  partyName: string | null;
  occurredAt: string;
  idempotencyKey: string;
  correctionOfBillId: number | null;
  reversedByBillId: number | null;
  createdAt: string;
  total: number;
  lines: BillLine[];
}

export interface CreateBillLineInput {
  productId: number;
  quantity: number;
  unitPrice: number;
  note?: string | null;
}

export interface CreateBillInput {
  partyName?: string | null;
  occurredAt?: string | null;
  lines: CreateBillLineInput[];
}

export interface BillsFilters {
  type?: BillType | null;
  productId?: number | null;
  partyName?: string | null;
  from?: string | null; // YYYY-MM-DD
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

const BILLS_KEY = ['bills'] as const;
const PRODUCTS_KEY = ['products'] as const;

export function useBills(filters: BillsFilters) {
  const { type, productId, partyName, from, to, page = 0, size = 20 } = filters;
  return useQuery({
    queryKey: [...BILLS_KEY, { type, productId, partyName, from, to, page, size }] as const,
    queryFn: () =>
      api<SpringPage<Bill>>('/bills', {
        query: {
          type: type ?? undefined,
          productId: productId ?? undefined,
          partyName: partyName ?? undefined,
          from: from ? toIsoStart(from) : undefined,
          to: to ? toIsoEndExclusive(to) : undefined,
          page,
          size,
          sort: 'occurredAt,desc',
        },
      }),
  });
}

export function useBill(id: number | null | undefined) {
  return useQuery({
    queryKey: [...BILLS_KEY, 'detail', id] as const,
    enabled: id != null,
    queryFn: () => api<Bill>(`/bills/${id}`),
  });
}

export interface CreateBillArgs {
  input: CreateBillInput;
  idempotencyKey?: string;
}

export function useCreateSaleBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: CreateBillArgs) =>
      api<Bill>('/bills/sale', { method: 'POST', body: input, idempotencyKey }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BILLS_KEY });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useCreateImportBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: CreateBillArgs) =>
      api<Bill>('/bills/import', { method: 'POST', body: input, idempotencyKey }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BILLS_KEY });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useReverseBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<Bill>(`/bills/${id}/reverse`, { method: 'POST', body: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BILLS_KEY });
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

/** YYYY-MM-DD -> ISO instant at midnight Asia/Ho_Chi_Minh (UTC+7). */
function toIsoStart(date: string): string {
  return `${date}T00:00:00+07:00`;
}
function toIsoEndExclusive(date: string): string {
  const d = new Date(`${date}T00:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}
