import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardList, Wrench } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import * as api from '../api/endpoints';
import type { DashboardSummary, WorkOrderRow } from '../types';
import { PageLoading, ErrorBanner } from '../components/Primitives';
import { extractErrorMessage } from '../api/client';
import { StatusBadge, PriorityBadge, SlaBadge } from '../components/Badges';

const STATUS_COLORS: Record<string, string> = {
  NEW: '#8B93A7',
  ASSIGNED: '#3E6FA6',
  IN_PROGRESS: '#E8A73B',
  ON_HOLD: '#C1622C',
  COMPLETED: '#2E9E7C',
  CLOSED: '#2B2F45',
  CANCELLED: '#B94A48',
};

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: any; accent: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-eyebrow">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

function ManagerDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.fetchDashboardSummary().then(setSummary).catch((e) => setError(extractErrorMessage(e)));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!summary) return <PageLoading />;

  const chartData = Object.entries(summary.countsByStatus).map(([status, count]) => ({
    status: status.replace('_', ' '),
    count,
    fill: STATUS_COLORS[status] ?? '#8B93A7',
  }));

  const compliancePie = [
    { name: 'Met SLA', value: summary.slaCompliancePct },
    { name: 'Breached', value: Math.max(0, 100 - summary.slaCompliancePct) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="section-eyebrow">Operations overview</p>
        <h1 className="page-title mt-1">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open work orders" value={summary.totalOpen} icon={ClipboardList} accent="bg-steel/10 text-steel" />
        <KpiCard label="Overdue" value={summary.overdueCount} icon={AlertTriangle} accent="bg-status-cancelled/10 text-status-cancelled" />
        <KpiCard label="SLA compliance (all-time)" value={`${summary.slaCompliancePct}%`} icon={CheckCircle2} accent="bg-status-completed/10 text-status-completed" />
        <KpiCard label="Technicians in field" value={summary.byTechnician.length} icon={Wrench} accent="bg-gold/15 text-gold-dark" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <p className="mb-4 font-display text-sm font-semibold text-ink">Work orders by status</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E4EA" />
              <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#6B7080' }} tickLine={false} axisLine={{ stroke: '#E2E4EA' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7080' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#F4F5F7' }}
                contentStyle={{ borderRadius: 10, borderColor: '#E2E4EA', fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="mb-4 font-display text-sm font-semibold text-ink">SLA compliance (30 days)</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={compliancePie}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
              >
                <Cell fill="#2E9E7C" />
                <Cell fill="#EAEBEF" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="-mt-[124px] mb-[76px] text-center">
            <p className="font-display text-2xl font-bold text-ink">{summary.slaCompliancePct}%</p>
            <p className="text-xs text-ink2">SLA met</p>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-completed" /> Met</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#EAEBEF]" /> Breached</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <p className="mb-3 font-display text-sm font-semibold text-ink">Technician workload</p>
          {summary.byTechnician.length === 0 ? (
            <p className="text-sm text-ink2">No technicians yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {summary.byTechnician.map((t) => (
                <div key={t.technicianId} className="flex items-center justify-between py-2.5">
                  <p className="text-sm font-medium text-ink">{t.technicianName}</p>
                  <div className="flex gap-4 text-xs text-ink2">
                    <span>{t.openJobs} open</span>
                    <span>{t.completedJobs} done</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <p className="mb-3 font-display text-sm font-semibold text-ink">Open work by site</p>
          {summary.bySite.length === 0 ? (
            <p className="text-sm text-ink2">Nothing open right now.</p>
          ) : (
            <div className="divide-y divide-border">
              {summary.bySite.map((s) => (
                <div key={s.siteId} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.siteName}</p>
                    <p className="text-xs text-ink2">{s.customerName}</p>
                  </div>
                  <span className="text-xs font-semibold text-ink">{s.openJobs} open</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonalDashboard({ heading, subheading, emptyLabel, showRaiseButton }: {
  heading: string;
  subheading: string;
  emptyLabel: string;
  showRaiseButton?: boolean;
}) {
  const [rows, setRows] = useState<WorkOrderRow[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .fetchWorkOrders({ size: 100 })
      .then((res) => setRows(res.content))
      .catch((e) => setError(extractErrorMessage(e)));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!rows) return <PageLoading />;

  const open = rows.filter((r) => !['CLOSED', 'CANCELLED'].includes(r.status));
  const breached = rows.filter((r) => r.slaStatus === 'BREACHED').length;
  const completed = rows.filter((r) => ['COMPLETED', 'CLOSED'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-eyebrow">{subheading}</p>
          <h1 className="page-title mt-1">{heading}</h1>
        </div>
        {showRaiseButton && (
          <Link to="/work-orders?new=1" className="btn-gold">
            Raise a request
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Open" value={open.length} icon={ClipboardList} accent="bg-steel/10 text-steel" />
        <KpiCard label="Needs attention" value={breached} icon={AlertTriangle} accent="bg-status-cancelled/10 text-status-cancelled" />
        <KpiCard label="Completed" value={completed} icon={CheckCircle2} accent="bg-status-completed/10 text-status-completed" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-display text-sm font-semibold text-ink">Recent activity</p>
          <Link to="/work-orders" className="flex items-center gap-1 text-xs font-medium text-steel hover:underline">
            View all <ArrowUpRight size={13} />
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink2">{emptyLabel}</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                to={`/work-orders/${r.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-paper"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{r.title}</p>
                  <p className="font-mono text-xs text-ink2">{r.code} &middot; {r.siteName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                  <SlaBadge status={r.slaStatus} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === 'MANAGER' || user.role === 'DISPATCHER') {
    return <ManagerDashboard />;
  }

  if (user.role === 'TECHNICIAN') {
    return (
      <PersonalDashboard
        heading="My jobs"
        subheading="Field view"
        emptyLabel="You have no jobs assigned yet."
      />
    );
  }

  return (
    <PersonalDashboard
      heading="My requests"
      subheading="Customer portal"
      emptyLabel="You haven't raised any requests yet."
      showRaiseButton
    />
  );
}
