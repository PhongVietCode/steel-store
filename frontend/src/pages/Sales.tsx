import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { useTransactions } from '@/lib/transactions-api';

export function SalesPage() {
  const recent = useTransactions({ type: 'SALE', size: 10 });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bán hàng</h1>
        <p className="text-sm text-neutral-500">
          Mỗi lần bán giảm tồn kho và chốt giá vốn theo giá nhập hiện tại.
        </p>
      </div>

      <TransactionForm kind="sale" />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-700">10 lần bán gần nhất</h2>
        <TransactionsTable
          rows={recent.data?.content}
          loading={recent.isPending}
          hideTypeColumn
          emptyText="Chưa ghi nhận lần bán nào."
        />
      </section>
    </div>
  );
}
