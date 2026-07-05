import { LogOut } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth';

export function DashboardPage() {
  const { logout, user } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">TeamFlow</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-lg text-slate-200">Welcome, {user?.name}.</p>
      </section>
    </main>
  );
}
