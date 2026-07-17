import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Package, Pencil } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import * as api from '../api/endpoints';
import type { Part, Priority, WorkOrderDetail, WorkOrderStatus } from '../types';
import { PageLoading, ErrorBanner, Spinner, Modal } from '../components/Primitives';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';
import { AssignModal } from '../components/AssignModal';
import { extractErrorMessage } from '../api/client';
import { format } from 'date-fns';

export function WorkOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [detail, setDetail] = useState<WorkOrderDetail | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPartsForm, setShowPartsForm] = useState(false);
  const [showTimeForm, setShowTimeForm] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api
      .fetchWorkOrder(Number(id))
      .then(setDetail)
      .catch((e) => setError(extractErrorMessage(e)));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorBanner message={error} />;
  if (!detail || !user) return <PageLoading />;

  const isOwnJob = user.role === 'TECHNICIAN' && detail.assignedToId === user.userId;
  const canDispatch = user.role === 'DISPATCHER' || user.role === 'MANAGER';
  const canEdit = canDispatch && !['CLOSED', 'CANCELLED'].includes(detail.status);
  const canLog = (isOwnJob || user.role === 'MANAGER') && ['IN_PROGRESS', 'ON_HOLD'].includes(detail.status);

  async function changeStatus(toStatus: WorkOrderStatus, note?: string) {
    setActionError('');
    try {
      await api.changeWorkOrderStatus(detail!.id, toStatus, note);
      load();
    } catch (e) {
      setActionError(extractErrorMessage(e));
    }
  }

  const lifecycleActions: { label: string; onClick: () => void; variant?: 'primary' | 'danger' }[] = [];
  if (canDispatch) {
    if (detail.status === 'NEW') {
      lifecycleActions.push({ label: 'Assign technician', onClick: () => setShowAssign(true), variant: 'primary' });
      lifecycleActions.push({ label: 'Cancel', onClick: () => changeStatus('CANCELLED'), variant: 'danger' });
    } else if (detail.status === 'ASSIGNED') {
      lifecycleActions.push({ label: 'Reassign', onClick: () => setShowAssign(true) });
      lifecycleActions.push({ label: 'Cancel', onClick: () => changeStatus('CANCELLED'), variant: 'danger' });
    } else if (detail.status === 'IN_PROGRESS' || detail.status === 'ON_HOLD') {
      lifecycleActions.push({ label: 'Reassign', onClick: () => setShowAssign(true) });
    } else if (detail.status === 'COMPLETED' && user.role === 'MANAGER') {
      lifecycleActions.push({ label: 'Close work order', onClick: () => changeStatus('CLOSED'), variant: 'primary' });
      lifecycleActions.push({ label: 'Reopen', onClick: () => changeStatus('IN_PROGRESS') });
    }
  }
  if (isOwnJob) {
    if (detail.status === 'ASSIGNED') lifecycleActions.push({ label: 'Start work', onClick: () => changeStatus('IN_PROGRESS'), variant: 'primary' });
    if (detail.status === 'IN_PROGRESS') {
      lifecycleActions.push({ label: 'Put on hold', onClick: () => changeStatus('ON_HOLD') });
      lifecycleActions.push({ label: 'Mark complete', onClick: () => changeStatus('COMPLETED'), variant: 'primary' });
    }
    if (detail.status === 'ON_HOLD') lifecycleActions.push({ label: 'Resume', onClick: () => changeStatus('IN_PROGRESS'), variant: 'primary' });
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-ink2 hover:text-ink">
        <ArrowLeft size={15} /> Back
      </button>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium text-ink2">{detail.code}</p>
            <h1 className="page-title mt-1">{detail.title}</h1>
            <p className="mt-2 text-sm text-ink2">{detail.siteName} &middot; {detail.customerName}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <PriorityBadge priority={detail.priority} />
              <StatusBadge status={detail.status} />
            </div>
            <SlaBadge status={detail.slaStatus} />
          </div>
        </div>

        {detail.description && <p className="mt-4 max-w-2xl text-sm text-ink2">{detail.description}</p>}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-ink2">Assigned to</p>
            <p className="mt-0.5 font-medium text-ink">{detail.assignedToName ?? 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs text-ink2">Raised by</p>
            <p className="mt-0.5 font-medium text-ink">{detail.createdByName ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-ink2">SLA due</p>
            <p className="mt-0.5 font-medium text-ink">{detail.slaDueAt ? format(new Date(detail.slaDueAt), 'MMM d, HH:mm') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-ink2">Created</p>
            <p className="mt-0.5 font-medium text-ink">{format(new Date(detail.createdAt), 'MMM d, HH:mm')}</p>
          </div>
        </div>

        {actionError && <div className="mt-4"><ErrorBanner message={actionError} /></div>}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          {lifecycleActions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={a.variant === 'primary' ? 'btn-gold' : a.variant === 'danger' ? 'btn-danger' : 'btn-secondary'}
            >
              {a.label}
            </button>
          ))}
          {canEdit && (
            <button className="btn-secondary" onClick={() => setShowEdit(true)}>
              <Pencil size={14} /> Edit details
            </button>
          )}
          {canLog && (
            <>
              <button className="btn-secondary" onClick={() => setShowPartsForm(true)}>
                <Package size={14} /> Log parts
              </button>
              <button className="btn-secondary" onClick={() => setShowTimeForm(true)}>
                <Clock size={14} /> Log time
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card p-5">
          <p className="mb-4 font-display text-sm font-semibold text-ink">Status history</p>
          <ol className="space-y-4 border-l border-border pl-4">
            {detail.history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gold" />
                <div className="flex items-center gap-2 text-sm">
                  {h.fromStatus && <StatusBadge status={h.fromStatus} />}
                  {h.fromStatus && <span className="text-ink2">→</span>}
                  <StatusBadge status={h.toStatus} />
                </div>
                <p className="mt-1 text-xs text-ink2">
                  {h.changedByName} &middot; {format(new Date(h.changedAt), 'MMM d, HH:mm')}
                </p>
                {h.note && <p className="mt-1 text-sm text-ink">{h.note}</p>}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-sm font-semibold text-ink">Parts used</p>
              <p className="text-xs font-semibold text-ink">${detail.totalPartsCost.toFixed(2)}</p>
            </div>
            {detail.partsUsed.length === 0 ? (
              <p className="text-sm text-ink2">No parts logged yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {detail.partsUsed.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-ink">{p.partName}</p>
                      <p className="font-mono text-xs text-ink2">{p.sku} &middot; qty {p.qtyUsed}</p>
                    </div>
                    <p className="font-medium text-ink">${p.lineCost.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-sm font-semibold text-ink">Time logged</p>
              <p className="text-xs font-semibold text-ink">{detail.totalMinutesLogged} min</p>
            </div>
            {detail.timeLogs.length === 0 ? (
              <p className="text-sm text-ink2">No time logged yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {detail.timeLogs.map((t) => (
                  <div key={t.id} className="py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-ink">{t.technicianName}</p>
                      <p className="font-medium text-ink">{t.minutes} min</p>
                    </div>
                    {t.note && <p className="text-xs text-ink2">{t.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssign && (
        <AssignModal
          onClose={() => setShowAssign(false)}
          onAssigned={async (techId) => {
            await api.assignWorkOrder(detail.id, techId);
            load();
          }}
        />
      )}
      {showEdit && <EditWorkOrderModal detail={detail} onClose={() => setShowEdit(false)} onSaved={load} />}
      {showPartsForm && <LogPartsModal workOrderId={detail.id} onClose={() => setShowPartsForm(false)} onLogged={load} />}
      {showTimeForm && <LogTimeModal workOrderId={detail.id} onClose={() => setShowTimeForm(false)} onLogged={load} />}
    </div>
  );
}

function EditWorkOrderModal({ detail, onClose, onSaved }: { detail: WorkOrderDetail; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(detail.title);
  const [description, setDescription] = useState(detail.description ?? '');
  const [priority, setPriority] = useState<Priority>(detail.priority);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await api.updateWorkOrder(detail.id, { title, description: description || undefined, priority });
      onSaved();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Edit work order" onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${priority === p ? 'border-gold bg-gold/15 text-ink' : 'border-border text-ink2 hover:bg-paper'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-gold" disabled={submitting || !title.trim()} onClick={handleSubmit}>
            {submitting ? <Spinner size={16} /> : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function LogPartsModal({ workOrderId, onClose, onLogged }: { workOrderId: number; onClose: () => void; onLogged: () => void }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [partId, setPartId] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.fetchParts().then(setParts).catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!partId) return;
    setSubmitting(true);
    setError('');
    try {
      await api.logPartUsage(workOrderId, Number(partId), qty);
      onLogged();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedPart = parts.find((p) => p.id === partId);

  return (
    <Modal title="Log parts used" onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label className="label">Part</label>
          <select className="input" value={partId} onChange={(e) => setPartId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Select a part…</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.stockQty} in stock</option>
            ))}
          </select>
          {selectedPart && selectedPart.stockQty < qty && (
            <p className="mt-1.5 text-xs font-medium text-status-cancelled">Only {selectedPart.stockQty} in stock.</p>
          )}
        </div>
        <div>
          <label className="label">Quantity</label>
          <input type="number" min={1} className="input" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-gold" disabled={submitting || !partId || qty < 1} onClick={handleSubmit}>
            {submitting ? <Spinner size={16} /> : 'Log part'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function LogTimeModal({ workOrderId, onClose, onLogged }: { workOrderId: number; onClose: () => void; onLogged: () => void }) {
  const [minutes, setMinutes] = useState(30);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await api.logTime(workOrderId, minutes, note || undefined);
      onLogged();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Log time" onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label className="label">Minutes spent</label>
          <input type="number" min={1} className="input" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <textarea className="input min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do?" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-gold" disabled={submitting || minutes < 1} onClick={handleSubmit}>
            {submitting ? <Spinner size={16} /> : 'Log time'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
