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
    LOOKUP_BRANCHES: '/inventory/lookup/branches',
    LOOKUP_WAREHOUSES: '/inventory/lookup/warehouses',
    LOOKUP_BUSINESS_SEGMENTS: '/inventory/lookup/business-segments',
  },
  
  PRODUCTION_PLANNING: {
    KPIS: '/production-planning/kpis',
    SHORTAGES: '/production-planning/shortages',
    BATCH_EXPIRY: '/production-planning/batch-expiry',
    HISTORY: '/production-planning/history',
    TREND: '/production-planning/trend',
    RECOMMENDATIONS: '/production-planning/recommendations',
    OPEN_ORDERS: '/production-planning/open-orders',
    GET_MACHINES: '/production-planning/machines',
    GET_PLANS: '/production-planning/plans',
    CREATE_PLAN: '/production-planning/plan',
    UPDATE_PLAN: '/production-planning/plan',
    MAN_EFFICIENCY: '/production-planning/man-efficiency',
    MACHINE_EFFICIENCY_API: '/production-planning/machine-efficiency',
  },

  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    ALERTS: '/dashboard/alerts',
    PLAN_VS_ACTUAL: '/dashboard/plan-vs-actual',
    COST_SUMMARY: '/dashboard/cost-summary',
    COST_VARIANCE: '/dashboard/cost-variance',
    MATERIAL_SHORTAGES: '/dashboard/material-shortages',
    EFFICIENCY: '/dashboard/efficiency',
    DOWNTIME: '/dashboard/downtime',
    OEE: '/dashboard/oee',
    QUALITY: '/dashboard/quality',
    ORDER_SUMMARY: '/dashboard/order-summary',
    WAREHOUSES: '/dashboard/warehouses'
  },

  PRODUCTION_TEMPLATE: {
    ORDERS: '/production-template/orders',
  },

  PRODUCTION_ORDERS: {
    CREATE_ORDER: '/production-orders/create',
    PRODUCTS: '/production-orders/products',
    WAREHOUSES: '/production-orders/warehouses',
    BRANCHES: '/production-orders/branches',
    PROJECTS: '/production-orders/projects',
    SALES_ORDERS: '/production-orders/sales-orders',
    OPEN_PRODUCTION_ORDERS: '/production-orders/open',
    CUSTOMERS: '/production-orders/customers',
    PAGINATED_ORDERS: (page, limit, search = '') => `/production-orders/paginated?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    DETAILS: (itemCode) => `/production-orders/${encodeURIComponent(itemCode)}`,
    DETAILS_BY_DOCNUM: (docNum) => `/production-orders/details-by-docnum/${docNum}`,
    BOM_DETAILS: (itemCode) => `/production-orders/bom/${encodeURIComponent(itemCode)}`,
  },

  COMPLAINTS: {
    LOOKUP_ITEMS: '/complain/lookup/items',
    CREATE_COMPLAINT: '/complain',
    GET_COMPLAINTS: '/complain',
    UPDATE_COMPLAINT: '/complain',
    COA_PRODUCT_DETAILS: (itemCode) => `/complain/coa/product-details/${encodeURIComponent(itemCode)}`,
  },
  
  ACL: {
    EMPLOYEES: '/acl/employees',
    EMPLOYEE_BY_ID: (id) => `/acl/employees/${id}`,
    PERMISSIONS: '/acl/permissions',
    PERMISSION_BY_ID: (id) => `/acl/permissions/${id}`,
    USER_PERMISSIONS: (id) => `/acl/user-permissions/${id}`
  },

  PREVENTIVE_MAINTENANCE: {
    FILTERS: '/pms/filters',
    SUMMARY: '/pms/summary',
    CHARTS: '/pms/charts',
    UPCOMING: '/pms/upcoming',
    YEARLY_SCHEDULE: '/pms/yearly-schedule',
    INSTRUMENT_CRUD: '/pms/instrument'
  },

  MACHINE: {
    GET_MACHINES_LIST: '/machine'
  },

  PURCHASE_ORDER: {
    REQUESTS: '/purchase-order/requests',
    DETAILS: (docEntry) => `/purchase-order/requests/${docEntry}`,
    CREATE_REQUEST: '/purchase-order/requests/create',
  },

  STAFF: {
    GET_STAFF: '/staff',
    ADD_STAFF: '/staff',
    UPDATE_STAFF: (id) => `/staff/${id}`
  },

  QC: {
    CREATE_TEMPLATE: '/coa-template',
    GET_ALL_TEMPLATES: '/coa-template',
    GET_TEMPLATE: (itemCode) => `/coa-template/${encodeURIComponent(itemCode)}`
  }
};