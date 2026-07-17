import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-ink2"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoading() {
  return (
    <div className="flex h-full min-h-[40vh] w-full items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/50 px-6 py-14 text-center animate-fade-in">
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink2">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  width = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 animate-fade-in" onClick={onClose}>
      <div
        className={`w-full ${width} rounded-xl bg-white shadow-pop`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-ink2 hover:bg-paper" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-status-cancelled/30 bg-status-cancelled/5 px-3.5 py-2.5 text-sm text-status-cancelled">
      {message}
    </div>
  );
}
