import { useEffect, useState } from 'react';
import { Building2, Plus, MapPin } from 'lucide-react';
import * as api from '../api/endpoints';
import type { Customer, Site } from '../types';
import { PageLoading, EmptyState, ErrorBanner, Modal, Spinner } from '../components/Primitives';
import { extractErrorMessage } from '../api/client';

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [sitesByCustomer, setSitesByCustomer] = useState<Record<number, Site[]>>({});
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewSiteFor, setShowNewSiteFor] = useState<number | null>(null);

  function load() {
    api
      .fetchCustomers(search || undefined)
      .then((res) => setCustomers(res.content))
      .catch((e) => setError(extractErrorMessage(e)));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search]);

  async function toggleExpand(id: number) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!sitesByCustomer[id]) {
      const sites = await api.fetchSites(id);
      setSitesByCustomer((prev) => ({ ...prev, [id]: sites }));
    }
  }

  async function refreshSites(id: number) {
    const sites = await api.fetchSites(id);
    setSitesByCustomer((prev) => ({ ...prev, [id]: sites }));
  }

  if (error) return <ErrorBanner message={error} />;
  if (!customers) return <PageLoading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-eyebrow">{customers.length} organisations</p>
          <h1 className="page-title mt-1">Customers &amp; Sites</h1>
        </div>
        <button className="btn-gold" onClick={() => setShowNewCustomer(true)}>
          <Plus size={16} /> New customer
        </button>
      </div>

      <input className="input max-w-sm" placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Add the organisations Meridian services." />
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <button onClick={() => toggleExpand(c.id)} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-paper/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-steel/10 text-steel">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-ink2">{c.contactEmail ?? 'No contact email'} &middot; {c.siteCount} site{c.siteCount === 1 ? '' : 's'}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-steel">{expanded === c.id ? 'Hide sites' : 'View sites'}</span>
              </button>

              {expanded === c.id && (
                <div className="border-t border-border bg-paper/40 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink2">Sites</p>
                    <button className="btn-secondary !py-1 !px-2.5 text-xs" onClick={() => setShowNewSiteFor(c.id)}>
                      <Plus size={13} /> Add site
                    </button>
                  </div>
                  {!sitesByCustomer[c.id] ? (
                    <Spinner size={16} />
                  ) : sitesByCustomer[c.id].length === 0 ? (
                    <p className="text-sm text-ink2">No sites yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sitesByCustomer[c.id].map((s) => (
                        <div key={s.id} className="flex items-start gap-2 rounded-lg border border-border bg-white px-3 py-2.5">
                          <MapPin size={14} className="mt-0.5 shrink-0 text-ink2" />
                          <div>
                            <p className="text-sm font-medium text-ink">{s.name}</p>
                            {s.address && <p className="text-xs text-ink2">{s.address}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewCustomer && (
        <NewCustomerModal onClose={() => setShowNewCustomer(false)} onCreated={load} />
      )}
      {showNewSiteFor != null && (
        <NewSiteModal
          customerId={showNewSiteFor}
          onClose={() => setShowNewSiteFor(null)}
          onCreated={() => {
            refreshSites(showNewSiteFor);
            load();
          }}
        />
      )}
    </div>
  );
}

function NewCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await api.createCustomer({ name, contactEmail: contactEmail || undefined, phone: phone || undefined });
      onCreated();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New customer" onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label className="label">Organisation name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lakeside Retail Group" />
        </div>
        <div>
          <label className="label">Contact email</label>
          <input className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="ops@example.com" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1-555-0100" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-gold" disabled={submitting || !name.trim()} onClick={handleSubmit}>
            {submitting ? <Spinner size={16} /> : 'Create customer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function NewSiteModal({ customerId, onClose, onCreated }: { customerId: number; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await api.createSite({ customerId, name, address: address || undefined });
      onCreated();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New site" onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label className="label">Site name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Building C - West Wing" />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-gold" disabled={submitting || !name.trim()} onClick={handleSubmit}>
            {submitting ? <Spinner size={16} /> : 'Add site'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
