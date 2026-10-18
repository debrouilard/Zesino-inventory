import type { ReportsOverview } from '../types/reports';
import { api, getToken } from './http';

export function fetchReportsOverview(weekOffset = 0) {
  return api<ReportsOverview>(`/api/reports/overview?weekOffset=${weekOffset}`);
}

export async function downloadReport(weekOffset = 0) {
  const response = await fetch(`/api/reports/export?weekOffset=${weekOffset}`, {
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
  });
  if (!response.ok) throw new Error('Unable to export report');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'zesino-report.csv';
  link.click();
  URL.revokeObjectURL(url);
}
