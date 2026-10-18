import { AppShell } from '../layout/AppShell';

export function PagePlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <AppShell title={title}>
      <div className="rounded-3xl border border-dashed border-line bg-white px-8 py-16 text-center shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mute">Coming next</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-mute">{note}</p>
      </div>
    </AppShell>
  );
}
