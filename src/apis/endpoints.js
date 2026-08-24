export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  MACHINE_EFFICIENCY: {
    MACHINE_EFFICIENCY: '/machine-efficiency/machine-efficiency',
    FILTER_OPTIONS: '/machine-efficiency/filter-options',
    MACHINE_DRILLDOWN: (machineId) => `/machine-efficiency/machine/${machineId}`,
    ORDER_DRILLDOWN: (orderNum) => `/machine-efficiency/order/${orderNum}`,
  },

  PRODUCTION_TREND: {
    SUMMARY: '/production-trend/summary',
    MONTHLY: '/production-trend/monthly',
    YEARLY: '/production-trend/yearly',
    PRODUCT_SHARE: '/production-trend/product-share',
    YEAR_COMPARISON: '/production-trend/year-comparison',
    TABLE: '/production-trend/table',
    FILTERS: '/production-trend/filters',
  },

  INVENTORY: {
    FILTERS: '/inventory/filters',
    DASHBOARD_CARDS: '/inventory/dashboard/cards',
    DASHBOARD_ITEMS: '/inventory/dashboard/items',
    ITEMS: '/inventory/items',
    ITEM_DETAIL: (itemCode) => `/inventory/items/${encodeURIComponent(itemCode)}/details`,
    ITEM_HISTORY: (itemCode) => `/inventory/items/${encodeURIComponent(itemCode)}/history`,
  },
  
  PRODUCTION_PLANNING: {
    KPIS: '/production-planning/kpis',
    SHORTAGES: '/production-planning/shortages',
    BATCH_EXPIRY: '/production-planning/batch-expiry',
    HISTORY: '/production-planning/history',
    TREND: '/production-planning/trend',
    RECOMMENDATIONS: '/production-planning/recommendations',
  },

  DASHBOARD: {
    OVERVIEW: '/dashboard'
  },

  PRODUCTION_ORDERS: {
    PRODUCTS: '/production-orders/products',
    WAREHOUSES: '/production-orders/warehouses',
    SALES_ORDERS: '/production-orders/sales-orders',
    OPEN_PRODUCTION_ORDERS: '/production-orders/open',
    CUSTOMERS: '/production-orders/customers',
    DETAILS: (itemCode) => `/production-orders/${encodeURIComponent(itemCode)}`,
    BOM_DETAILS: (itemCode) => `/production-orders/bom/${encodeURIComponent(itemCode)}`,
  }
};