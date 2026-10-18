import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';
import {
  IconCredit,
  IconCustomer,
  IconHelp,
  IconInventory,
  IconPos,
  IconReconciliation,
  IconReports,
  LogoMark,
} from '../icons';

const NAV = [
  { to: '/reports', label: 'Reports', icon: IconReports },
  { to: '/inventory', label: 'Inventory', icon: IconInventory },
  { to: '/point-of-sale', label: 'Point of Sale', icon: IconPos },
  { to: '/reconciliation', label: 'Reconciliation', icon: IconReconciliation },
  { to: '/credit', label: 'Credit', icon: IconCredit },
  { to: '/customers', label: 'Customer', icon: IconCustomer },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-navy-950/50 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-navy-900 text-white transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-5 pb-6 pt-6">
          <LogoMark />
          <span className="text-[22px] font-semibold tracking-tight">Zesino</span>
        </div>

        <p className="px-6 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Workspace
        </p>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition ${
                  isActive
                    ? 'bg-white/10 font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]'
                    : 'text-white/65 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-brand/20 text-brand">
              <IconHelp className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold">Need assistance?</p>
            <p className="mt-1 text-xs leading-5 text-white/55">Visit the operations help center.</p>
            <NavLink
              to="/help"
              onClick={onClose}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-300 hover:text-white"
            >
              Open help center →
            </NavLink>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl px-1 py-2 text-left hover:bg-white/5"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d8dee8] text-sm font-semibold text-navy-900">
              {initials(user?.name ?? 'AO')}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user?.name}</span>
              <span className="block truncate text-xs text-white/50">{user?.jobTitle ?? 'Operations Admin'}</span>
            </span>
            <span className="text-white/40">▾</span>
          </button>
        </div>
      </aside>
    </>
  );
}
