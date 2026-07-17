import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../api/client';
import { KeystoneMark } from '../components/KeystoneMark';
import { ErrorBanner } from '../components/Primitives';
import { Spinner } from '../components/Primitives';

const DEMO_ACCOUNTS = [
  { role: 'Dispatcher', email: 'dispatcher@keystone.dev' },
  { role: 'Technician', email: 'tech1@keystone.dev' },
  { role: 'Manager', email: 'manager@keystone.dev' },
  { role: 'Customer', email: 'customer@keystone.dev' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-paper">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink px-14 py-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative flex items-center gap-3">
          <KeystoneMark size={36} />
          <div>
            <p className="font-display text-xl font-semibold tracking-tight">KEYSTONE</p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">Field Service Platform</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight">
            Every work order, one system of record.
          </p>
          <p className="mt-4 text-white/60">
            Dispatch technicians, track SLAs from request to close-out, and give every
            role — dispatcher, technician, manager, customer — exactly the view they need.
          </p>
        </div>

        <p className="relative font-mono text-xs text-white/30">
          Built for Meridian Facilities Management &middot; v1.0
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <KeystoneMark size={30} />
            <p className="font-display text-lg font-semibold">KEYSTONE</p>
          </div>

          <h1 className="page-title">Sign in</h1>
          <p className="mt-1.5 text-sm text-ink2">Enter your KEYSTONE credentials to continue.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && <ErrorBanner message={error} />}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@keystone.dev"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-gold w-full">
              {submitting ? <Spinner size={16} /> : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-border bg-white p-4">
            <p className="section-eyebrow">Demo logins</p>
            <p className="mt-1 text-xs text-ink2">
              Password for every seed account: <span className="font-mono font-medium text-ink">Password123!</span>
            </p>
            <ul className="mt-3 space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <li key={acc.email}>
                  <button
                    type="button"
                    onClick={() => setEmail(acc.email)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-paper"
                  >
                    <span className="font-medium text-ink">{acc.role}</span>
                    <span className="font-mono text-ink2">{acc.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
