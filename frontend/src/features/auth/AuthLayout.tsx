import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="hidden border-r border-white/10 bg-slate-900 px-12 py-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="text-lg font-semibold text-white">
            TeamFlow
          </Link>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
              Work orchestration
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold tracking-normal">
              Keep projects, tasks, and root-cause reviews moving together.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Sign in to continue to the operational dashboard.
            </p>
          </div>
          <p className="text-sm text-slate-400">Production scaffold for TeamFlow.</p>
        </section>
        <section className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Link to="/" className="text-lg font-semibold text-white">
                TeamFlow
              </Link>
            </div>
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
}
