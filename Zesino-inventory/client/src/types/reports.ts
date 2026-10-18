export type ReportsOverview = {
  period: {
    from: string;
    to: string;
    label: string;
    weekOffset: number;
  };
  kpis: {
    weeklySales: string;
    weeklySalesNumber: number;
    livePosCount: number;
    productsInStock: number;
    distinctAvailable: number;
    lowStockCount: number;
    stockValue: string;
    stockValueNumber: number;
  };
  salesPerformance: {
    vsLastWeekPercent: number;
    daily: Array<{
      date: string;
      label: string;
      total: string;
      totalNumber: number;
    }>;
  };
  stockHealth: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    threshold: number;
    depleted: boolean;
    fillPercent: number;
  }>;
  recentSales: Array<{
    id: string;
    transactionNumber: string;
    customer: string;
    itemsSold: string;
    recordedAt: string;
    total: string;
  }>;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  jobTitle?: string;
};
