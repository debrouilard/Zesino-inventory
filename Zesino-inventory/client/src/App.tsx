import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ReportsPage } from './pages/ReportsPage';
import {
  CreditPage,
  CustomersPage,
  HelpPage,
  InventoryPage,
  PosPage,
  ReconciliationPage,
} from './pages/placeholders';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="grid min-h-screen place-items-center text-mute">Loading workspace…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/reports" replace />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/point-of-sale" element={<PosPage />} />
        <Route path="/reconciliation" element={<ReconciliationPage />} />
        <Route path="/credit" element={<CreditPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>
    </Routes>
  );
}
