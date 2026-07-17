import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import * as api from '../api/endpoints';
import type { Part } from '../types';
import { PageLoading, EmptyState, ErrorBanner, Modal, Spinner } from '../components/Primitives';
import { extractErrorMessage } from '../api/client';

export function PartsPage() {
  const [parts, setParts] = useState<Part[] | null>(null);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editTarget, setEditTarget] = useState<Part | null>(null);

  function load() {
    api.fetchParts().then(setParts).catch((e) => setError(extractErrorMessage(e)));
  }

  useEffect(load, []);

  if (error) return <ErrorBanner message={error} />;
  if (!parts) return <PageLoading />;

  const lowStock = parts.filter((p) => p.stockQty < 10);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-eyebrow">{parts.length} parts tracked</p>
          <h1 className="page-title mt-1">Parts Inventory</h1>
        </div>
        <button className="btn-gold" onClick={() => setShowNew(true)}>
          <Plus size={16} /> New part
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-lg border border-status-hold/30 bg-status-hold/5 px-4 py-3 text-sm text-status-hold">
          {lowStock.length} part{lowStock.length === 1 ? '' : 's'} running low on stock: {lowStock.map((p) => p.name).join(', ')}
        </div>
      )}

      {parts.length === 0 ? (
        <EmptyState title="No parts yet" description="Add spare parts technicians can log against jobs." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-paper/60 text-left text-xs uppercase tracking-wide text-ink2">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Unit cost</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parts.map((p) => (
                <tr key={p.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink2">{p.sku}</td>
                  <td className="px-4 py-3 text-ink">${p.unitCost.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.stockQty < 10 ? 'text-status-hold' : 'text-ink'}`}>{p.stockQty}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-secondary !py-1 !px-2.5 text-xs" onClick={() => setEditTarget(p)}>
                      <Pencil size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && <PartFormModal onClose={() => setShowNew(false)} onSaved={load} />}
      {editTarget && <PartFormModal part={editTarget} onClose={() => setEditTarget(null)} onSaved={load} />}
    </div>
  );
}

function PartFormModal({ part, onClose, onSaved }: { part?: Part; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(part?.name ?? '');
  const [sku, setSku] = useState(part?.sku ?? '');
  const [unitCost, setUnitCost] = useState(part?.unitCost ?? 0);
  const [stockQty, setStockQty] = useState(part?.stockQty ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      if (part) {
        await api.updatePart(part.id, { name, sku, unitCost, stockQty });
      } else {
        await api.createPart({ name, sku, unitCost, stockQty });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={part ? 'Edit part' : 'New part'} onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HVAC Air Filter 20x25" />
        </div>
        <div>
          <label className="label">SKU</label>
          <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. SKU-HVAC-002" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Unit cost ($)</label>
            <input type="number" min={0} step="0.01" className="input" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Stock qty</label>
            <input type="number" min={0} className="input" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-gold" disabled={submitting || !name.trim() || !sku.trim()} onClick={handleSubmit}>
            {submitting ? <Spinner size={16} /> : part ? 'Save changes' : 'Create part'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
