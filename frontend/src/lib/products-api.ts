import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Product {
  id: number;
  name: string;
  unit: string;
  currentImportPrice: number;
  currentSellingPrice: number;
  currentStock: number;
  latestImportDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormValues {
  name: string;
  unit: string;
  currentImportPrice: number;
  currentSellingPrice: number;
  currentStock: number;
}

const PRODUCTS_KEY = ['products'] as const;

export function useProducts(nameFilter?: string) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, { name: nameFilter ?? '' }] as const,
    queryFn: () =>
      api<Product[]>('/products', { query: nameFilter ? { name: nameFilter } : undefined }),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductFormValues) =>
      api<Product>('/products', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Omit<ProductFormValues, 'currentStock'> }) =>
      api<Product>(`/products/${id}`, { method: 'PUT', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
