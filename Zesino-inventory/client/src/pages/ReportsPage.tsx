import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { downloadReport, fetchReportsOverview } from '../api/reports';
import { AppShell } from '../components/layout/AppShell';
import { IconAlert, IconBox, IconCalendar, IconCheck, IconDownload, IconEmptyChart } from '../components/icons';
import type { ReportsOverview } from '../types/reports';
import { formatCompactMoney, formatMoney } from '../utils/format';

export function ReportsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<ReportsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [compact, setCompact] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchReportsOverview(weekOffset)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [weekOffset]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), {
      rootMargin: '-80px 0px 0px 0px',
      threshold: 0,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [data]);

  async function onExport() {
    setExporting(true);
    try {
      await downloadReport(weekOffset);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell title="Reports" compactKpis={compact ? data?.kpis : null}>
      <div ref={sentinelRef} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Weekly performance</p>
          <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-tight text-ink">Reports</h1>
          <p className="mt-3 text-sm text-mute">
            Sales and stock analytics for {data?.period.label ?? 'this week'}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm"
          >
            <IconCalendar className="h-4 w-4 text-mute" />
            {weekOffset === 0 ? 'This week' : 'Jump to this week'}
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_18px_rgba(59,109,255,.28)] hover:bg-brand-dark disabled:opacity-60"
          >
            <IconDownload className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Weekly sales"
          value={data ? formatMoney(data.kpis.weeklySales) : '—'}
          hint={`${data?.kpis.livePosCount ?? 0} live POS transactions included`}
          tone="ok"
        />
        <KpiCard
          label="Products in stock"
          value={data ? String(data.kpis.productsInStock) : '—'}
          hint={`${data?.kpis.distinctAvailable ?? 0} of ${data?.kpis.productsInStock ?? 0} distinct products available`}
          tone="ok"
        />
        <KpiCard
          label="Low stock items"
          value={data ? String(data.kpis.lowStockCount) : '—'}
          hint="At or below reorder threshold"
          tone="warn"
        />
        <KpiCard
          label="Stock value"
          value={data ? formatMoney(data.kpis.stockValue) : '—'}
          hint="Current inventory valuation"
          tone="ok"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card md:p-6">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Sales performance</h2>
              <p className="mt-1 text-sm text-mute">Daily gross sales</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
              {data && data.salesPerformance.vsLastWeekPercent >= 0 ? '+' : ''}
              {data?.salesPerformance.vsLastWeekPercent ?? 0}% vs last week
            </span>
          </div>
          <SalesChart days={data?.salesPerformance.daily ?? []} />
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 shadow-card md:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Stock health</h2>
              <p className="mt-1 text-sm text-mute">Items nearing depletion</p>
            </div>
            <Link to="/inventory" className="text-sm font-medium text-brand hover:underline">
              View inventory →
            </Link>
          </div>
          <ul className="space-y-5">
            {(data?.stockHealth ?? []).map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-50 text-mute">
                  <IconBox className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-mute">{item.sku}</p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-ink">
                      {item.quantity} <span className="font-normal text-mute">units</span>
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.depleted ? 'bg-red-400' : 'bg-amber-400'}`}
                      style={{ width: `${item.fillPercent}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-5 rounded-3xl border border-line bg-white p-5 shadow-card md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Recent sales activity</h2>
            <p className="mt-1 text-sm text-mute">Source transactions update this report instantly</p>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
                <th className="pb-3 pr-4 font-semibold">Transaction</th>
                <th className="pb-3 pr-4 font-semibold">Customer</th>
                <th className="pb-3 pr-4 font-semibold">Items sold</th>
                <th className="pb-3 pr-4 font-semibold">Recorded</th>
                <th className="pb-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentSales ?? []).map((sale) => (
                <tr key={sale.id} className="border-t border-line">
                  <td className="py-3 pr-4 font-medium">{sale.transactionNumber}</td>
                  <td className="py-3 pr-4">{sale.customer}</td>
                  <td className="py-3 pr-4">{sale.itemsSold}</td>
                  <td className="py-3 pr-4 text-mute">
                    {new Date(sale.recordedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 text-right font-medium">{formatMoney(sale.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.recentSales.length && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconEmptyChart className="h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm text-mute">No live sales yet. Synced POS transactions will appear here.</p>
            </div>
          )}
        </div>
      </section>

      {weekOffset !== 0 && (
        <div className="mt-4 flex justify-end gap-2 text-sm">
          <button type="button" className="rounded-lg px-3 py-1 text-mute hover:text-ink" onClick={() => setWeekOffset((v) => v - 1)}>
            Previous week
          </button>
          <button type="button" className="rounded-lg px-3 py-1 text-mute hover:text-ink" onClick={() => setWeekOffset((v) => v + 1)}>
            Next week
          </button>
        </div>
      )}
    </AppShell>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'ok' | 'warn';
}) {
  return (
    <article
      className={`rounded-3xl border bg-white p-5 shadow-card ${tone === 'warn' ? 'border-amber-300' : 'border-line'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-mute">{label}</p>
        <span
          className={`grid h-7 w-7 place-items-center rounded-full ${tone === 'warn' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}
        >
          {tone === 'warn' ? <IconAlert className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
        </span>
      </div>
      <p className="mt-5 text-[34px] font-semibold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-3 text-sm text-mute">{hint}</p>
    </article>
  );
}

function SalesChart({ days }: { days: ReportsOverview['salesPerformance']['daily'] }) {
  const max = Math.max(...days.map((day) => day.totalNumber), 1);
  return (
    <div className="grid grid-cols-7 items-end gap-3 md:gap-4">
      {days.map((day) => (
        <div key={day.date} className="flex min-w-0 flex-col items-center">
          <p className="mb-2 text-xs font-medium text-mute">{formatCompactMoney(day.totalNumber)}</p>
          <div className="flex h-44 w-full items-end rounded-xl bg-[#eef1f6] md:h-52">
            <div
              className="w-full rounded-xl bg-gradient-to-b from-[#6d8bff] to-[#3b6dff]"
              style={{ height: `${Math.max(8, (day.totalNumber / max) * 100)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-mute">{day.label}</p>
        </div>
      ))}
    </div>
  );
}
