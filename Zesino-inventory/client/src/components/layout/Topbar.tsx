import { Link } from 'react-router-dom';
import { IconBell, IconCalendar, IconMenu } from '../icons';
import { formatMoney, formatTodayLabel } from '../../utils/format';
import type { ReportsOverview } from '../../types/reports';

type TopbarProps = {
  title: string;
  compactKpis?: ReportsOverview['kpis'] | null;
  onMenu: () => void;
};

export function Topbar({ title, compactKpis, onMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-transparent bg-canvas/90 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink lg:hidden"
            onClick={onMenu}
            aria-label="Open navigation"
          >
            <IconMenu />
          </button>
          <nav className="truncate text-sm text-mute">
            <Link to="/reports" className="hover:text-ink">
              Zesino
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-ink">{title}</span>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-mute">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white" aria-label="Notifications">
            <IconBell />
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <IconCalendar className="h-4 w-4" />
            <span className="text-sm">{formatTodayLabel()}</span>
          </div>
        </div>
      </div>

      {compactKpis && (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CompactKpi value={formatMoney(compactKpis.weeklySales)} hint={`${compactKpis.livePosCount} live POS transactions included`} />
          <CompactKpi value={String(compactKpis.productsInStock)} hint={`${compactKpis.distinctAvailable} of ${compactKpis.productsInStock} distinct products available`} />
          <CompactKpi value={String(compactKpis.lowStockCount)} hint="At or below reorder threshold" warn />
          <CompactKpi value={formatMoney(compactKpis.stockValue)} hint="Current inventory valuation" />
        </div>
      )}
    </header>
  );
}

function CompactKpi({ value, hint, warn }: { value: string; hint: string; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white px-4 py-3 ${warn ? 'border-amber-300' : 'border-line'}`}>
      <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-mute">{hint}</p>
    </div>
  );
}
