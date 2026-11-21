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
    PLANNED_RELEASED_ORDERS: '/production-planning/planned-released-orders',
    TODAY_WORKING_PLANS: '/production-planning/today-working-plans',
    MONTH_WORKING_POS: '/production-planning/month-working-pos',
    GET_MACHINES: '/production-planning/machines',
    GET_PLANS: '/production-planning/plans',
    LINE_CLEARANCE: '/production-planning/line-clearance',
    CREATE_PLAN: '/production-planning/plan',
    STAFF_GROUPS: '/production-planning/staff-groups',
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
    WAREHOUSES: '/dashboard/warehouses',
    OPEN_PRODUCTION_ORDERS: '/dashboard/open-production-orders',
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
    PAGINATED_ORDERS: (page, limit, search = '', filters = {}, sortConfig = null) => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (search && search.trim()) params.append('search', search.trim());
      if (filters.status) params.append('status', filters.status);
      if (filters.lifecycle) params.append('lifecycle', filters.lifecycle);
      if (filters.project) params.append('project', filters.project);
      if (filters.product) params.append('product', filters.product);
      if (filters.productLine) params.append('productLine', filters.productLine);
      if (filters.warehouse) params.append('warehouse', filters.warehouse);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
      if (filters.createdTo) params.append('createdTo', filters.createdTo);
      if (sortConfig && sortConfig.key) {
        params.append('sortBy', sortConfig.key);
        params.append('sortOrder', sortConfig.direction === 'ascending' || sortConfig.direction === 'asc' ? 'asc' : 'desc');
      }
      return `/production-orders/paginated?${params.toString()}`;
    },
    DETAILS: (itemCode) => `/production-orders/${encodeURIComponent(itemCode)}`,
    DETAILS_BY_DOCNUM: (docNum) => `/production-orders/details-by-docnum/${docNum}`,
    BOM_DETAILS: (itemCode) => `/production-orders/bom/${encodeURIComponent(itemCode)}`,
    MATERIAL_CAPACITY: '/production-orders/material-capacity',
  },

  COMPLAINTS: {
    LOOKUP_ITEMS: '/complain/lookup/items',
    CREATE_COMPLAINT: '/complain',
    GET_COMPLAINTS: '/complain',
    TREND: '/complain/trend',
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
    GET_TEMPLATE: (itemCode) => `/coa-template/${encodeURIComponent(itemCode)}`,
    GET_TEMPLATE_BY_LINE: '/coa-template/by-line',
    LIST_COA_REPORTS: '/coa-report',
    USED_COA_BATCHES: '/coa-report/used-batches',
    GET_COA_REPORT: (coaNo) => `/coa-report/${coaNo}`,
    SAVE_COA_REPORT: '/coa-report',
    UPDATE_COA_STATUS: (coaNo) => `/coa-report/${coaNo}/status`
  },

  SAMPLING: {
    POSTED_GRNS: '/sampling/posted-grns',
  },

  LDS_DX: {
    DASHBOARD: '/lds-dx/dashboard',
  },

  TICKETS: {
    LIST: '/tickets',
    CREATE: '/tickets',
    DETAIL: (id) => `/tickets/${id}`,
    UPDATE: (id) => `/tickets/${id}`,
    REMARKS: (id) => `/tickets/${id}/remarks`,
    EMPLOYEES: '/tickets/employees',
  },

  STANDARD_UNIT_MAN_HOURS: {
    LIST: '/standard-unit-man-hours',
    CREATE: '/standard-unit-man-hours',
    UPDATE: (id) => `/standard-unit-man-hours/${id}`,
    ITEMS: '/standard-unit-man-hours/items',
  },

  INVENTORY_PLANNING: {
    RAW_MATERIALS: '/inventory-planning/raw-materials',
  },

  POLICIES: {
    LIST: '/policies',
    CREATE: '/policies',
    FILE_URL: (id) => `/policies/${id}/file-url`,
    DELETE: (id) => `/policies/${id}`,
  },
};