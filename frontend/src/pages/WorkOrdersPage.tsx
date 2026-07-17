import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutGrid, List as ListIcon, Plus, Search } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import * as api from '../api/endpoints';
import type { Priority, WorkOrderRow, WorkOrderStatus } from '../types';
import { PageLoading, EmptyState, ErrorBanner, Spinner } from '../components/Primitives';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';
import { extractErrorMessage } from '../api/client';
import { NewWorkOrderModal } from '../components/NewWorkOrderModal';
import { AssignModal } from '../components/AssignModal';

const BOARD_COLUMNS: WorkOrderStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED'];
const STATUS_OPTIONS: WorkOrderStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED'];
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export function WorkOrdersPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canDispatch = user?.role === 'DISPATCHER' || user?.role === 'MANAGER';

  const [view, setView] = useState<'list' | 'board'>(canDispatch ? 'board' : 'list');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(searchParams.get('new') === '1');
  const [assignTarget, setAssignTarget] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const pageSize = view === 'board' ? 200 : 12;

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .fetchWorkOrders({
        status: status || undefined,
        priority: priority || undefined,
        search: search || undefined,
        page: view === 'board' ? 0 : page,
        size: pageSize,
      })
      .then((res) => {
        setRows(res.content);
        setTotalPages(res.totalPages);
      })
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [status, priority, search, page, view, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreate(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, WorkOrderRow[]> = {};
    BOARD_COLUMNS.forEach((s) => (map[s] = []));
    rows.forEach((r) => map[r.status]?.push(r));
    return map;
  }, [rows]);

  async function handleStatusChange(id: number, toStatus: WorkOrderStatus) {
    setActionError('');
    try {
      await api.changeWorkOrderStatus(id, toStatus);
      load();
    } catch (e) {
      setActionError(extractErrorMessage(e));
    }
  }

  async function handleAssigned(technicianId: number) {
    if (assignTarget == null) return;
    await api.assignWorkOrder(assignTarget, technicianId);
    load();
  }

  function quickActions(row: WorkOrderRow) {
    if (!user) return [];
    const actions: { label: string; onClick: () => void; variant?: 'primary' | 'danger' }[] = [];
    const isOwnJob = user.role === 'TECHNICIAN' && row.assignedToId === user.userId;

    if (canDispatch) {
      if (row.status === 'NEW') {
        actions.push({ label: 'Assign', onClick: () => setAssignTarget(row.id) });
        actions.push({ label: 'Cancel', onClick: () => handleStatusChange(row.id, 'CANCELLED'), variant: 'danger' });
      } else if (row.status === 'ASSIGNED') {
        actions.push({ label: 'Reassign', onClick: () => setAssignTarget(row.id) });
        actions.push({ label: 'Cancel', onClick: () => handleStatusChange(row.id, 'CANCELLED'), variant: 'danger' });
      } else if (row.status === 'IN_PROGRESS' || row.status === 'ON_HOLD') {
        actions.push({ label: 'Reassign', onClick: () => setAssignTarget(row.id) });
      } else if (row.status === 'COMPLETED' && user.role === 'MANAGER') {
        actions.push({ label: 'Close', onClick: () => handleStatusChange(row.id, 'CLOSED'), variant: 'primary' });
        actions.push({ label: 'Reopen', onClick: () => handleStatusChange(row.id, 'IN_PROGRESS') });
      }
    }

    if (isOwnJob) {
      if (row.status === 'ASSIGNED') actions.push({ label: 'Start', onClick: () => handleStatusChange(row.id, 'IN_PROGRESS'), variant: 'primary' });
      if (row.status === 'IN_PROGRESS') {
        actions.push({ label: 'Hold', onClick: () => handleStatusChange(row.id, 'ON_HOLD') });
        actions.push({ label: 'Complete', onClick: () => handleStatusChange(row.id, 'COMPLETED'), variant: 'primary' });
      }
      if (row.status === 'ON_HOLD') actions.push({ label: 'Resume', onClick: () => handleStatusChange(row.id, 'IN_PROGRESS'), variant: 'primary' });
    }

    return actions;
  }

  const heading = user?.role === 'TECHNICIAN' ? 'My Jobs' : user?.role === 'CUSTOMER' ? 'My Requests' : 'Work Orders';
  const canCreate = user?.role !== 'TECHNICIAN';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-eyebrow">{rows.length} shown</p>
          <h1 className="page-title mt-1">{heading}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canDispatch && (
            <div className="flex rounded-lg border border-border bg-white p-0.5">
              <button
                onClick={() => setView('board')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${view === 'board' ? 'bg-ink text-white' : 'text-ink2'}`}
              >
                <LayoutGrid size={14} /> Board
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${view === 'list' ? 'bg-ink text-white' : 'text-ink2'}`}
              >
                <ListIcon size={14} /> List
              </button>
            </div>
          )}
          {canCreate && (
            <button className="btn-gold" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> {user?.role === 'CUSTOMER' ? 'Raise request' : 'New work order'}
            </button>
          )}
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink2" />
          <input
            className="input pl-9"
            placeholder="Search title or code…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input w-auto" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(0); }}>
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      {loading ? (
        <PageLoading />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description={user?.role === 'CUSTOMER' ? "You haven't raised any requests." : 'No work orders match these filters.'}
        />
      ) : view === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {BOARD_COLUMNS.map((col) => (
            <div key={col} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <StatusBadge status={col} />
                <span className="text-xs font-medium text-ink2">{grouped[col].length}</span>
              </div>
              <div className="space-y-2.5">
                {grouped[col].map((row) => (
                  <WorkOrderCard key={row.id} row={row} actions={quickActions(row)} />
                ))}
                {grouped[col].length === 0 && (
                  <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-ink2">Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-paper/60 text-left text-xs uppercase tracking-wide text-ink2">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">SLA</th>
                <th className="px-4 py-3 font-medium">Assigned to</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <Link to={`/work-orders/${row.id}`} className="font-mono text-xs font-medium text-steel hover:underline">
                      {row.code}
                    </Link>
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-3">
                    <Link to={`/work-orders/${row.id}`} className="text-ink hover:underline">{row.title}</Link>
                    <p className="truncate text-xs text-ink2">{row.siteName}</p>
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={row.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3"><SlaBadge status={row.slaStatus} /></td>
                  <td className="px-4 py-3 text-ink2">{row.assignedToName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {quickActions(row).slice(0, 2).map((a) => (
                        <button
                          key={a.label}
                          onClick={a.onClick}
                          className={a.variant === 'primary' ? 'btn-gold !px-2.5 !py-1 text-xs' : a.variant === 'danger' ? 'btn-danger !px-2.5 !py-1 text-xs' : 'btn-secondary !px-2.5 !py-1 text-xs'}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <button className="btn-secondary !py-1.5 text-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="text-xs text-ink2">Page {page + 1} of {totalPages}</span>
              <button className="btn-secondary !py-1.5 text-xs" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {showCreate && <NewWorkOrderModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {assignTarget != null && (
        <AssignModal onClose={() => setAssignTarget(null)} onAssigned={handleAssigned} />
      )}
    </div>
  );
}

function WorkOrderCard({ row, actions }: { row: WorkOrderRow; actions: { label: string; onClick: () => void; variant?: 'primary' | 'danger' }[] }) {
  return (
    <div className="card p-3.5">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/work-orders/${row.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink hover:underline">{row.title}</p>
          <p className="font-mono text-xs text-ink2">{row.code}</p>
        </Link>
        <PriorityBadge priority={row.priority} />
      </div>
      <p className="mt-2 truncate text-xs text-ink2">{row.siteName} &middot; {row.customerName}</p>
      <div className="mt-2 flex items-center justify-between">
        <SlaBadge status={row.slaStatus} />
        <span className="text-xs text-ink2">{row.assignedToName ?? 'Unassigned'}</span>
      </div>
      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={a.variant === 'primary' ? 'btn-gold !px-2.5 !py-1 text-xs' : a.variant === 'danger' ? 'btn-danger !px-2.5 !py-1 text-xs' : 'btn-secondary !px-2.5 !py-1 text-xs'}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
