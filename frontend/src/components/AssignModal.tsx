import { useEffect, useState } from 'react';
import { Modal, Spinner, ErrorBanner } from './Primitives';
import * as api from '../api/endpoints';
import type { UserRow } from '../types';
import { extractErrorMessage } from '../api/client';

export function AssignModal({
  onClose,
  onAssigned,
}: {
  onClose: () => void;
  onAssigned: (technicianId: number) => Promise<void>;
}) {
  const [technicians, setTechnicians] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.fetchTechnicians().then(setTechnicians).catch((e) => setError(extractErrorMessage(e)));
  }, []);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      await onAssigned(selected);
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Assign technician" onClose={onClose}>
      <div className="space-y-3">
        {error && <ErrorBanner message={error} />}
        {technicians.length === 0 ? (
          <p className="text-sm text-ink2">No technicians available yet.</p>
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {technicians.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  selected === t.id ? 'border-gold bg-gold/10' : 'border-border hover:bg-paper'
                }`}
              >
                <span className="font-medium text-ink">{t.name}</span>
                <span className="text-xs text-ink2">{t.openJobCount} open jobs</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-gold" disabled={!selected || submitting} onClick={handleSubmit}>
            {submitting ? <Spinner size={16} /> : 'Assign'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
