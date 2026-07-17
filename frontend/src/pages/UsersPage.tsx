import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, ShieldOff } from 'lucide-react';
import * as api from '../api/endpoints';
import type { Customer, Role, UserRow } from '../types';
import { PageLoading, EmptyState, ErrorBanner, Modal, Spinner } from '../components/Primitives';
import { extractErrorMessage } from '../api/client';

const ROLE_LABEL: Record<Role, string> = {
  DISPATCHER: 'Dispatcher',
  TECHNICIAN: 'Technician',
  MANAGER: 'Manager',
  CUSTOMER: 'Customer',
};

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');

  function load() {
    api.fetchUsers().then(setUsers).catch((e) => setError(extractErrorMessage(e)));
  }

  useEffect(load, []);

  async function toggleActive(u: UserRow) {
    await api.setUserActive(u.id, !u.active);
    load();
  }

  if (error) return <ErrorBanner message={error} />;
  if (!users) return <PageLoading />;

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-eyebrow">{users.length} accounts</p>
          <h1 className="page-title mt-1">Team &amp; Users</h1>
        </div>
        <button className="btn-gold" onClick={() => setShowNew(true)}>
          <Plus size={16} /> New user
        </button>
      </div>

      <div className="flex gap-2">
        {(['', 'DISPATCHER', 'TECHNICIAN', 'MANAGER', 'CUSTOMER'] as (Role | '')[]).map((r) => (
          <button
            key={r || 'all'}
            onClick={() => setRoleFilter(r)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              roleFilter === r ? 'border-gold bg-gold/15 text-ink' : 'border-border text-ink2 hover:bg-paper'
            }`}
          >
            {r ? ROLE_LABEL[r] : 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No users found" description="Try a different role filter, or add a new user." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-paper/60 text-left text-xs uppercase tracking-wide text-ink2">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Open jobs</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink2">{u.email}</td>
                  <td className="px-4 py-3 text-ink2">{ROLE_LABEL[u.role]}</td>
                  <td className="px-4 py-3 text-ink2">{u.customerName ?? '—'}</td>
                  <td className="px-4 py-3 text-ink2">{u.role === 'TECHNICIAN' ? u.openJobCount : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${u.active ? 'text-status-completed' : 'text-status-cancelled'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-secondary !py-1 !px-2.5 text-xs" onClick={() => toggleActive(u)}>
                      {u.active ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && <NewUserModal onClose={() => setShowNew(false)} onCreated={load} />}
    </div>
  );
}

function NewUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('TECHNICIAN');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role === 'CUSTOMER') {
      api.fetchCustomers().then((res) => setCustomers(res.content)).catch(() => {});
    }
  }, [role]);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await api.createUser({
        name,
        email,
        password,
        role,
        customerId: role === 'CUSTOMER' ? (customerId || null) : null,
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const valid = name.trim() && email.trim() && password.length >= 8 && (role !== 'CUSTOMER' || customerId);

  return (
    <Modal title="New user" onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label className="label">Full name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Temporary password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="TECHNICIAN">Technician</option>
            <option value="DISPATCHER">Dispatcher</option>
            <option value="MANAGER">Manager</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </div>
        {role === 'CUSTOMER' && (
          <div>
            <label className="label">Customer organisation</label>
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-gold" disabled={submitting || !valid} onClick={handleSubmit}>
            {submitting ? <Spinner size={16} /> : 'Create user'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
