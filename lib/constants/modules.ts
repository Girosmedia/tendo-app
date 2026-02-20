export type PlanId = 'BASIC' | 'PRO';
export type BusinessTrack = 'RETAIL' | 'SERVICES' | 'MIXED';

export type ModuleKey =
  | 'POS'
  | 'DOCUMENTS'
  | 'INVENTORY'
  | 'CUSTOMERS'
  | 'CREDITS'
  | 'CASH_REGISTER'
  | 'ACCOUNTING'
  | 'SUPPLIERS'
  | 'QUOTES'
  | 'PROJECTS'
  | 'CRM'
  | 'FINANCE';

export interface ModuleMeta {
  id: ModuleKey;
  label: string;
  description: string;
}

export const MODULE_CATALOG: Record<ModuleKey, ModuleMeta> = {
  POS: {
    id: 'POS',
    label: 'Punto de Venta',
    description: 'Ventas en mostrador y flujo de caja diaria',
  },
  DOCUMENTS: {
    id: 'DOCUMENTS',
    label: 'Documentos de Venta',
    description: 'Boletas y documentos comerciales',
  },
  INVENTORY: {
    id: 'INVENTORY',
    label: 'Inventario',
    description: 'Catálogo, stock y productos',
  },
  CUSTOMERS: {
    id: 'CUSTOMERS',
    label: 'Clientes',
    description: 'Gestión de clientes y cartera',
  },
  CREDITS: {
    id: 'CREDITS',
    label: 'Fiados y Pagos',
    description: 'Cuentas por cobrar, fiados y abonos',
  },
  CASH_REGISTER: {
    id: 'CASH_REGISTER',
    label: 'Caja',
    description: 'Apertura, cierre y control de caja',
  },
  ACCOUNTING: {
    id: 'ACCOUNTING',
    label: 'Contabilidad',
    description: 'Contabilidad, cuentas por pagar y tesorería',
  },
  SUPPLIERS: {
    id: 'SUPPLIERS',
    label: 'Proveedores',
    description: 'Gestión de proveedores',
  },
  QUOTES: {
    id: 'QUOTES',
    label: 'Cotizaciones',
    description: 'Cotizaciones para servicios y proyectos',
  },
  PROJECTS: {
    id: 'PROJECTS',
    label: 'Proyectos',
    description: 'Ejecución y seguimiento de proyectos',
  },
  CRM: {
    id: 'CRM',
    label: 'CRM (legacy)',
    description: 'Compatibilidad histórica para clientes/fiados',
  },
  FINANCE: {
    id: 'FINANCE',
    label: 'Finanzas (legacy)',
    description: 'Compatibilidad histórica para caja/contabilidad',
  },
};

export const MODULE_RELEVANCE_ORDER: ModuleKey[] = [
  'POS',
  'DOCUMENTS',
  'INVENTORY',
  'CUSTOMERS',
  'CREDITS',
  'CASH_REGISTER',
  'ACCOUNTING',
  'SUPPLIERS',
  'QUOTES',
  'PROJECTS',
  'CRM',
  'FINANCE',
];

export const MODULE_ADMIN_SELECTION_ORDER: ModuleKey[] = [
  'POS',
  'DOCUMENTS',
  'INVENTORY',
  'CUSTOMERS',
  'CREDITS',
  'CASH_REGISTER',
  'ACCOUNTING',
  'SUPPLIERS',
  'QUOTES',
  'PROJECTS',
];

const FULL_PLAN_MODULES: ModuleKey[] = [
  'POS',
  'DOCUMENTS',
  'INVENTORY',
  'CUSTOMERS',
  'CREDITS',
  'CASH_REGISTER',
  'ACCOUNTING',
  'SUPPLIERS',
  'QUOTES',
  'PROJECTS',
  'CRM',
  'FINANCE',
];

export const PLAN_MODULE_MATRIX: Record<PlanId, ModuleKey[]> = {
  BASIC: FULL_PLAN_MODULES,
  PRO: FULL_PLAN_MODULES,
};

export const PLAN_TRACK_MATRIX: Record<PlanId, BusinessTrack[]> = {
  BASIC: ['RETAIL', 'SERVICES'],
  PRO: ['RETAIL', 'SERVICES', 'MIXED'],
};

export const TRACK_MODULE_MATRIX: Record<BusinessTrack, ModuleKey[]> = {
  RETAIL: [
    'POS',
    'DOCUMENTS',
    'INVENTORY',
    'CUSTOMERS',
    'CREDITS',
    'CASH_REGISTER',
    'ACCOUNTING',
    'SUPPLIERS',
    'CRM',
    'FINANCE',
  ],
  SERVICES: [
    'QUOTES',
    'PROJECTS',
    'CUSTOMERS',
    'CREDITS',
    'ACCOUNTING',
    'SUPPLIERS',
    'CRM',
    'FINANCE',
  ],
  MIXED: FULL_PLAN_MODULES,
};

const MODULE_ALIAS_MAP: Record<string, ModuleKey> = {
  pos: 'POS',
  documents: 'DOCUMENTS',
  document: 'DOCUMENTS',
  inventory: 'INVENTORY',
  products: 'INVENTORY',
  categories: 'INVENTORY',
  customers: 'CUSTOMERS',
  customer: 'CUSTOMERS',
  credits: 'CREDITS',
  credit: 'CREDITS',
  payments: 'CREDITS',
  cash: 'CASH_REGISTER',
  cashregister: 'CASH_REGISTER',
  'cash-register': 'CASH_REGISTER',
  'mi-caja': 'CASH_REGISTER',
  accounting: 'ACCOUNTING',
  'accounts-payable': 'ACCOUNTING',
  'operational-expenses': 'ACCOUNTING',
  'treasury-movements': 'ACCOUNTING',
  suppliers: 'SUPPLIERS',
  supplier: 'SUPPLIERS',
  quotes: 'QUOTES',
  projects: 'PROJECTS',
  services: 'PROJECTS',

  crm: 'CRM',
  fiados: 'CRM',
  finance: 'FINANCE',

  POS: 'POS',
  DOCUMENTS: 'DOCUMENTS',
  INVENTORY: 'INVENTORY',
  CUSTOMERS: 'CUSTOMERS',
  CREDITS: 'CREDITS',
  CASH_REGISTER: 'CASH_REGISTER',
  ACCOUNTING: 'ACCOUNTING',
  SUPPLIERS: 'SUPPLIERS',
  QUOTES: 'QUOTES',
  PROJECTS: 'PROJECTS',
  CRM: 'CRM',
  FINANCE: 'FINANCE',
};

export function normalizeModuleKey(value: string): ModuleKey | null {
  return MODULE_ALIAS_MAP[value] ?? MODULE_ALIAS_MAP[value.toLowerCase()] ?? null;
}

export function normalizeModules(values: string[] = []): ModuleKey[] {
  const normalized = values
    .map((value) => normalizeModuleKey(value))
    .filter((value): value is ModuleKey => Boolean(value));

  return sortModulesByRelevance(Array.from(new Set(normalized)));
}

export function sortModulesByRelevance(values: ModuleKey[]): ModuleKey[] {
  const orderMap = new Map(MODULE_RELEVANCE_ORDER.map((module, index) => [module, index]));
  return [...values].sort((a, b) => (orderMap.get(a) ?? 999) - (orderMap.get(b) ?? 999));
}

export function toPlanId(value: string | null | undefined): PlanId {
  if (value === 'PRO' || value === 'ENTERPRISE') {
    return 'PRO';
  }
  return 'BASIC';
}

function hasRetailTrackSignals(modules: ModuleKey[]): boolean {
  return modules.includes('POS') || modules.includes('DOCUMENTS') || modules.includes('INVENTORY');
}

function hasServicesTrackSignals(modules: ModuleKey[]): boolean {
  return modules.includes('QUOTES') || modules.includes('PROJECTS');
}

export function resolveTrackForPlan(
  planId: PlanId,
  requestedTrack: BusinessTrack,
  currentModules: ModuleKey[] = []
): BusinessTrack {
  const allowedTracks = PLAN_TRACK_MATRIX[planId];
  if (allowedTracks.includes(requestedTrack)) {
    return requestedTrack;
  }

  const inferredTrack = inferTrackFromModules(currentModules);
  if (inferredTrack !== 'MIXED') {
    return inferredTrack;
  }

  return 'RETAIL';
}

export function buildModulesForTrack(
  track: BusinessTrack,
  additionalModules: string[] = []
): ModuleKey[] {
  const base = TRACK_MODULE_MATRIX[track] ?? [];
  const extras = normalizeModules(additionalModules);
  return sortModulesByRelevance(Array.from(new Set([...base, ...extras])));
}

export function inferTrackFromModules(modules: string[] = []): BusinessTrack {
  const normalized = normalizeModules(modules);

  const retailUniverse = new Set<ModuleKey>(
    TRACK_MODULE_MATRIX.RETAIL.filter((module) => module !== 'CRM' && module !== 'FINANCE')
  );
  const servicesUniverse = new Set<ModuleKey>(
    TRACK_MODULE_MATRIX.SERVICES.filter((module) => module !== 'CRM' && module !== 'FINANCE')
  );

  const retailScore = normalized.filter((module) => retailUniverse.has(module)).length;
  const servicesScore = normalized.filter((module) => servicesUniverse.has(module)).length;

  if (retailScore > 0 && servicesScore > 0 && retailScore === servicesScore) {
    return 'MIXED';
  }

  if (servicesScore > retailScore) {
    return 'SERVICES';
  }

  if (retailScore > servicesScore) {
    return 'RETAIL';
  }

  if (hasServicesTrackSignals(normalized) && hasRetailTrackSignals(normalized)) {
    return 'MIXED';
  }

  if (hasServicesTrackSignals(normalized)) {
    return 'SERVICES';
  }

  return 'RETAIL';
}
