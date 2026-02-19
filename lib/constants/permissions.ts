// Tipos de roles (sincronizado con Prisma schema)
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

/**
 * Matriz de permisos del sistema Tendo
 * Define qué roles pueden ejecutar cada acción
 * 
 * Formato: 'recurso:accion': [roles permitidos]
 */
export const PERMISSIONS = {
  // Productos
  'products:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'products:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'products:edit': ['OWNER', 'ADMIN', 'MEMBER'],
  'products:delete': ['OWNER', 'ADMIN'],
  'products:export': ['OWNER', 'ADMIN'],

  // Clientes
  'customers:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'customers:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'customers:edit': ['OWNER', 'ADMIN', 'MEMBER'],
  'customers:delete': ['OWNER', 'ADMIN'],
  'customers:export': ['OWNER', 'ADMIN'],

  // Documentos (Ventas)
  'documents:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'documents:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'documents:edit': ['OWNER', 'ADMIN'],
  'documents:delete': ['OWNER', 'ADMIN'],
  'documents:cancel': ['OWNER', 'ADMIN'],

  // POS (Punto de Venta)
  'pos:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'pos:view': ['OWNER', 'ADMIN', 'MEMBER'],

  // Caja (Cash Register)
  'cashRegister:open': ['OWNER', 'ADMIN'],
  'cashRegister:close': ['OWNER', 'ADMIN'],
  'cashRegister:viewReport': ['OWNER', 'ADMIN', 'MEMBER'],
  'cashRegister:adjustBalance': ['OWNER', 'ADMIN'],

  // Fiados (Créditos)
  'credits:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'credits:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'credits:edit': ['OWNER', 'ADMIN'],
  'credits:delete': ['OWNER', 'ADMIN'],
  'credits:registerPayment': ['OWNER', 'ADMIN', 'MEMBER'],

  // Inventario
  'inventory:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'inventory:adjust': ['OWNER', 'ADMIN'],
  'inventory:transfer': ['OWNER', 'ADMIN'],

  // Proyectos (Servicios)
  'projects:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'projects:create': ['OWNER', 'ADMIN'],
  'projects:edit': ['OWNER', 'ADMIN'],
  'projects:delete': ['OWNER', 'ADMIN'],
  'projects:addExpense': ['OWNER', 'ADMIN', 'MEMBER'],
  'projects:addMilestone': ['OWNER', 'ADMIN'],

  // Cotizaciones
  'quotes:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'quotes:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'quotes:edit': ['OWNER', 'ADMIN', 'MEMBER'],
  'quotes:delete': ['OWNER', 'ADMIN'],
  'quotes:convert': ['OWNER', 'ADMIN'],

  // Configuración de Organización
  'settings:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'settings:edit': ['OWNER'],
  'settings:editBilling': ['OWNER'],
  'settings:deleteOrganization': ['OWNER'],

  // Equipo (Team)
  'team:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'team:invite': ['OWNER', 'ADMIN'],
  'team:editMember': ['OWNER', 'ADMIN'],
  'team:removeMember': ['OWNER', 'ADMIN'],
  'team:changeRole': ['OWNER'],

  // Cuentas por Pagar
  'accountsPayable:view': ['OWNER', 'ADMIN'],
  'accountsPayable:create': ['OWNER', 'ADMIN'],
  'accountsPayable:edit': ['OWNER', 'ADMIN'],
  'accountsPayable:delete': ['OWNER', 'ADMIN'],
  'accountsPayable:registerPayment': ['OWNER', 'ADMIN'],

  // Gastos Operacionales
  'expenses:view': ['OWNER', 'ADMIN'],
  'expenses:create': ['OWNER', 'ADMIN'],
  'expenses:edit': ['OWNER', 'ADMIN'],
  'expenses:delete': ['OWNER', 'ADMIN'],

  // Contabilidad
  'accounting:viewBalance': ['OWNER', 'ADMIN'],
  'accounting:viewMonthly': ['OWNER', 'ADMIN'],
  'accounting:export': ['OWNER'],

  // Dashboard y Reportes
  'dashboard:viewSales': ['OWNER', 'ADMIN', 'MEMBER'],
  'dashboard:viewFinancials': ['OWNER', 'ADMIN'],
  'dashboard:viewProfitability': ['OWNER'],
  'reports:export': ['OWNER', 'ADMIN'],

  // Proveedores
  'suppliers:view': ['OWNER', 'ADMIN', 'MEMBER'],
  'suppliers:create': ['OWNER', 'ADMIN'],
  'suppliers:edit': ['OWNER', 'ADMIN'],
  'suppliers:delete': ['OWNER', 'ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: MemberRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    return false;
  }
  return (allowedRoles as readonly MemberRole[]).includes(role);
}

/**
 * Filtra una lista de permisos y retorna solo los que el rol puede ejecutar
 */
export function getPermissionsForRole(role: MemberRole): Permission[] {
  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => (roles as readonly MemberRole[]).includes(role))
    .map(([permission]) => permission as Permission);
}

/**
 * Categorías de permisos para UI
 */
export const PERMISSION_CATEGORIES = {
  products: 'Productos',
  customers: 'Clientes',
  documents: 'Documentos',
  pos: 'Punto de Venta',
  cashRegister: 'Caja',
  credits: 'Fiados',
  inventory: 'Inventario',
  projects: 'Proyectos',
  quotes: 'Cotizaciones',
  settings: 'Configuración',
  team: 'Equipo',
  accountsPayable: 'Cuentas por Pagar',
  expenses: 'Gastos',
  accounting: 'Contabilidad',
  dashboard: 'Dashboard',
  reports: 'Reportes',
  suppliers: 'Proveedores',
} as const;
