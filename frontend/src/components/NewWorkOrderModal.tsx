import { useEffect, useState } from 'react';
import { Modal, Spinner, ErrorBanner } from './Primitives';
import * as api from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import type { Customer, Priority, Site } from '../types';
import { extractErrorMessage } from '../api/client';

export function NewWorkOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>(isCustomer ? user!.customerId! : '');
  const [siteId, setSiteId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isCustomer) {
      api.fetchCustomers().then((res) => setCustomers(res.content)).catch(() => {});
    }
  }, [isCustomer]);

  useEffect(() => {
    if (customerId) {
      api.fetchSites(Number(customerId)).then(setSites).catch(() => {});
    } else {
      setSites([]);
    }
    setSiteId('');
  }, [customerId]);

  async function handleSubmit() {
    if (!customerId || !siteId || !title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createWorkOrder({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        customerId: Number(customerId),
        siteId: Number(siteId),
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isCustomer ? 'Raise a service request' : 'New work order'} onClose={onClose} width="max-w-xl">
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AC unit not cooling" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[90px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's happening, and where?"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!isCustomer && (
            <div>
              <label className="label">Customer</label>
              <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className={isCustomer ? 'col-span-2' : ''}>
            <label className="label">Site</label>
            <select
              className="input"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value ? Number(e.target.value) : '')}
              disabled={!customerId}
            >
              <option value="">Select site…</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                  priority === p ? 'border-gold bg-gold/15 text-ink' : 'border-border text-ink2 hover:bg-paper'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-gold"
            disabled={submitting || !customerId || !siteId || !title.trim()}
            onClick={handleSubmit}
          >
            {submitting ? <Spinner size={16} /> : isCustomer ? 'Submit request' : 'Create work order'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
