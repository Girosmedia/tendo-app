import { type ModuleKey } from './modules';

interface RouteModuleRule {
  prefix: string;
  modules: ModuleKey[];
}

const DASHBOARD_ROUTE_RULES: RouteModuleRule[] = [
  { prefix: '/dashboard/services/projects', modules: ['PROJECTS'] },
  { prefix: '/dashboard/services/quotes', modules: ['QUOTES'] },
  { prefix: '/dashboard/cash-register', modules: ['CASH_REGISTER', 'FINANCE'] },
  { prefix: '/dashboard/mi-caja', modules: ['CASH_REGISTER', 'FINANCE'] },
  { prefix: '/dashboard/contabilidad', modules: ['ACCOUNTING', 'FINANCE'] },
  { prefix: '/dashboard/por-pagar', modules: ['ACCOUNTING', 'FINANCE'] },
  { prefix: '/dashboard/fiados', modules: ['CREDITS', 'CRM'] },
  { prefix: '/dashboard/customers', modules: ['CUSTOMERS', 'CRM'] },
  { prefix: '/dashboard/products', modules: ['INVENTORY'] },
  { prefix: '/dashboard/pos', modules: ['POS'] },
  { prefix: '/dashboard/documents', modules: ['DOCUMENTS', 'POS'] },
];

const API_ROUTE_RULES: RouteModuleRule[] = [
  { prefix: '/api/services/alerts', modules: ['PROJECTS'] },
  { prefix: '/api/services/projects', modules: ['PROJECTS'] },
  { prefix: '/api/services/quotes', modules: ['QUOTES'] },
  { prefix: '/api/cash-register', modules: ['CASH_REGISTER', 'FINANCE'] },
  { prefix: '/api/accounting', modules: ['ACCOUNTING', 'FINANCE'] },
  { prefix: '/api/accounts-payable', modules: ['ACCOUNTING', 'FINANCE'] },
  { prefix: '/api/operational-expenses', modules: ['ACCOUNTING', 'FINANCE'] },
  { prefix: '/api/treasury-movements', modules: ['ACCOUNTING', 'FINANCE'] },
  { prefix: '/api/customers', modules: ['CUSTOMERS', 'CRM'] },
  { prefix: '/api/credits', modules: ['CREDITS', 'CRM'] },
  { prefix: '/api/payments', modules: ['CREDITS', 'CRM'] },
  { prefix: '/api/suppliers', modules: ['SUPPLIERS'] },
  { prefix: '/api/products', modules: ['INVENTORY'] },
  { prefix: '/api/categories', modules: ['INVENTORY'] },
  { prefix: '/api/documents', modules: ['DOCUMENTS', 'POS'] },
];

export function getRequiredModulesForDashboardPath(pathname: string): ModuleKey[] {
  const rule = DASHBOARD_ROUTE_RULES.find((candidate) => pathname.startsWith(candidate.prefix));
  return rule?.modules ?? [];
}

export function getRequiredModulesForApiPath(pathname: string): ModuleKey[] {
  const rule = API_ROUTE_RULES.find((candidate) => pathname.startsWith(candidate.prefix));
  return rule?.modules ?? [];
}
