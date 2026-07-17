import { Link } from 'react-router-dom';
import { KeystoneMark } from '../components/KeystoneMark';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
      <KeystoneMark size={40} />
      <h1 className="font-display text-3xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink2">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-gold">Back to dashboard</Link>
    </div>
  );
}
