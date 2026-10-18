import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogoMark } from '../components/icons';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('amara@zesino.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/reports" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[420px_1fr]">
      <aside className="hidden flex-col justify-between bg-navy-900 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="text-2xl font-semibold">Zesino</span>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-white/40">Inventory operations</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Sales and stock analytics, ready for the floor.</h1>
          <p className="mt-4 max-w-sm text-white/60">
            Track weekly performance, low-stock risk, and live POS activity from one workspace.
          </p>
        </div>
        <p className="text-sm text-white/40">Demo: amara@zesino.com / Password123!</p>
      </aside>
      <main className="grid place-items-center bg-canvas px-6 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-card">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark />
            <span className="text-xl font-semibold">Zesino</span>
          </div>
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-2 text-sm text-mute">Use your operations account to open Reports.</p>
          {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <label className="mt-6 block text-sm font-medium text-ink">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
              required
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-ink">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
              required
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </main>
    </div>
  );
}
