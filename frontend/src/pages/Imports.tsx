import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { useTransactions } from '@/lib/transactions-api';

export function ImportsPage() {
  const recent = useTransactions({ type: 'IMPORT', size: 10 });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nhập hàng</h1>
        <p className="text-sm text-neutral-500">Ghi nhận các lần nhập kho mới.</p>
      </div>

      <TransactionForm kind="import" />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-700">10 lần nhập gần nhất</h2>
        <TransactionsTable
          rows={recent.data?.content}
          loading={recent.isPending}
          hideTypeColumn
          emptyText="Chưa ghi nhận lần nhập nào."
        />
      </section>
    </div>
  );
}
