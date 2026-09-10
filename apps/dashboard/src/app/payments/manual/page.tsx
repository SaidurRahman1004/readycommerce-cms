'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Breadcrumbs, PageHeader } from '../../../components/ui/page-header';
import { ErrorState } from '../../../components/ui/primitives';
import { adminManualPaymentService, AdminManualPaymentRequest } from '../../../services/api-service';
import { DataTable, Column } from '../../../components/ui/data-table';
import { CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { ConfirmModal } from '../../../components/ui/confirm-modal';

type Action = 'approved' | 'rejected';

export default function ManualPaymentRequestsPage() {
  const [requests, setRequests] = useState<AdminManualPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [actionReq, setActionReq] = useState<{ req: AdminManualPaymentRequest; action: Action } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchRequests(page = 1, status = statusFilter) {
    setLoading(true);
    try {
      const res = await adminManualPaymentService.list({ page, limit: pagination.limit, status });
      setRequests(res.data);
      setPagination(res.pagination);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchRequests();
  }, []);

  async function handleAction() {
    if (!actionReq) return;
    setActionLoading(true);
    try {
      await adminManualPaymentService.updateStatus(
        actionReq.req._id,
        actionReq.action,
        actionReq.action === 'rejected' ? rejectReason : undefined,
      );
      toast.success(actionReq.action === 'approved' ? 'Payment approved.' : 'Payment rejected.');
      setActionReq(null);
      setRejectReason('');
      await fetchRequests(pagination.page);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  }

  const columns: Column<AdminManualPaymentRequest>[] = [
    { key: 'order', label: 'Order', render: (row) => <a href={`/orders/${row.order?._id}`} className="font-bold text-primary hover:underline">{row.order?.orderNumber}</a> },
    { key: 'method', label: 'Method', render: (row) => <span className="font-semibold text-slate-700">{row.method}</span> },
    { key: 'amount', label: 'Amount', render: (row) => `৳${row.amount.toLocaleString()}` },
    { key: 'senderNumber', label: 'Sender', render: (row) => row.senderNumber || '-' },
    { key: 'transactionId', label: 'TxID', render: (row) => <span className="rounded bg-slate-100 px-2 py-1 font-mono text-sm">{row.transactionId}</span> },
    { key: 'status', label: 'Status', render: (row) => {
      if (row.status === 'approved') return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>;
      if (row.status === 'rejected') return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"><XCircle className="h-3.5 w-3.5" /> Rejected</span>;
      if (row.status === 'under_review') return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"><Eye className="h-3.5 w-3.5" /> Reviewing</span>;
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"><Clock className="h-3.5 w-3.5" /> Submitted</span>;
    } },
    { key: 'actions', label: '', render: (row) => (
      <div className="flex justify-end gap-2">
        {['submitted', 'under_review'].includes(row.status) && <>
          <button onClick={() => setActionReq({ req: row, action: 'approved' })} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100">Approve</button>
          <button onClick={() => setActionReq({ req: row, action: 'rejected' })} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">Reject</button>
        </>}
      </div>
    ) },
  ];

  if (error) return <ErrorState title="Failed to load requests" retry={() => void fetchRequests()} />;

  return <section className="mx-auto max-w-7xl">
    <Breadcrumbs items={[{ label: 'Payments' }, { label: 'Manual Requests' }]} />
    <div className="flex flex-wrap items-center justify-between gap-4">
      <PageHeader eyebrow="Transactions" title="Manual Payment Requests" description="Review and verify manual payments submitted by customers." />
      <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); void fetchRequests(1, event.target.value); }} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary">
        <option value="">All Statuses</option><option value="submitted">Submitted</option><option value="under_review">Under Review</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
      </select>
    </div>
    <div className="mt-8 rounded-2xl border border-border bg-white shadow-sm">
      <DataTable<AdminManualPaymentRequest> keyExtractor={(row) => row._id} columns={columns} data={requests} isLoading={loading} emptyState={<div className="py-20 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" /><h3 className="mt-4 text-lg font-bold">No payment requests</h3><p className="mt-2 text-sm text-slate-500">You&apos;re all caught up! There are no pending manual payments to review.</p></div>} />
      {pagination.pages > 1 && <div className="flex items-center justify-between border-t border-border bg-slate-50/50 px-6 py-4"><span className="text-sm font-medium text-slate-500">Page {pagination.page} of {pagination.pages}</span><div className="flex gap-2"><button disabled={pagination.page <= 1} onClick={() => void fetchRequests(pagination.page - 1)} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Previous</button><button disabled={pagination.page >= pagination.pages} onClick={() => void fetchRequests(pagination.page + 1)} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Next</button></div></div>}
    </div>
    {actionReq && <ConfirmModal isOpen title={actionReq.action === 'approved' ? 'Approve Payment' : 'Reject Payment'} description={actionReq.action === 'approved' ? `Approve this payment of ৳${actionReq.req.amount.toLocaleString()}? This will mark the order as paid.` : 'Please provide a reason for rejecting this payment. The customer will be notified.'} onConfirm={() => void handleAction()} onClose={() => { setActionReq(null); setRejectReason(''); }} confirmText={actionReq.action === 'approved' ? 'Yes, Approve' : 'Reject Payment'} isDestructive={actionReq.action === 'rejected'} isLoading={actionLoading}>
      {actionReq.action === 'rejected' && <div className="mt-4"><label className="block text-sm font-bold text-slate-700">Rejection Reason</label><input type="text" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="e.g. Invalid Transaction ID, Amount mismatch" className="mt-2 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-red-500" /></div>}
    </ConfirmModal>}
  </section>;
}
