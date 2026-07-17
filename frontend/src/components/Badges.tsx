import type { Priority, SlaStatus, WorkOrderStatus } from '../types';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_META: Record<WorkOrderStatus, { label: string; bg: string; dot: string }> = {
  NEW: { label: 'New', bg: 'bg-status-new/10 text-status-new', dot: 'bg-status-new' },
  ASSIGNED: { label: 'Assigned', bg: 'bg-status-assigned/10 text-status-assigned', dot: 'bg-status-assigned' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-status-progress/15 text-[#8a6115]', dot: 'bg-status-progress' },
  ON_HOLD: { label: 'On Hold', bg: 'bg-status-hold/10 text-status-hold', dot: 'bg-status-hold' },
  COMPLETED: { label: 'Completed', bg: 'bg-status-completed/10 text-status-completed', dot: 'bg-status-completed' },
  CLOSED: { label: 'Closed', bg: 'bg-status-closed/10 text-status-closed', dot: 'bg-status-closed' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-status-cancelled/10 text-status-cancelled', dot: 'bg-status-cancelled' },
};

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

const PRIORITY_META: Record<Priority, { label: string; classes: string }> = {
  LOW: { label: 'Low', classes: 'bg-ink2/10 text-ink2' },
  MEDIUM: { label: 'Medium', classes: 'bg-steel/10 text-steel-dark' },
  HIGH: { label: 'High', classes: 'bg-status-hold/10 text-status-hold' },
  URGENT: { label: 'Urgent', classes: 'bg-status-cancelled/10 text-status-cancelled' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${meta.classes}`}>
      {meta.label}
    </span>
  );
}

export function SlaBadge({ status }: { status: SlaStatus }) {
  if (status === 'NONE') return <span className="text-xs text-ink2">—</span>;
  if (status === 'MET') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-completed">
        <CheckCircle2 size={13} /> Met SLA
      </span>
    );
  }
  if (status === 'BREACHED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-cancelled">
        <AlertTriangle size={13} /> Breached
      </span>
    );
  }
  if (status === 'AT_RISK') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-hold">
        <Clock size={13} /> At risk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-ink2">
      <Clock size={13} /> On track
    </span>
  );
}
