import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import type { ReportsOverview } from '../../types/reports';

type AppShellProps = {
  title: string;
  compactKpis?: ReportsOverview['kpis'] | null;
  children: ReactNode;
};

export function AppShell({ title, compactKpis, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[248px_1fr]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0">
        <Topbar title={title} compactKpis={compactKpis} onMenu={() => setOpen(true)} />
        <main className="px-4 pb-10 md:px-8">{children}</main>
      </div>
    </div>
  );
}
