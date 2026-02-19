import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  getPermissionsForRole,
  PERMISSIONS,
} from '@/lib/constants/permissions';

describe('Permissions System', () => {
  describe('hasPermission', () => {
    it('OWNER tiene todos los permisos', () => {
      expect(hasPermission('OWNER', 'products:create')).toBe(true);
      expect(hasPermission('OWNER', 'products:delete')).toBe(true);
      expect(hasPermission('OWNER', 'settings:edit')).toBe(true);
      expect(hasPermission('OWNER', 'team:changeRole')).toBe(true);
      expect(hasPermission('OWNER', 'cashRegister:open')).toBe(true);
    });

    it('ADMIN tiene permisos de gestión pero no de settings críticos', () => {
      expect(hasPermission('ADMIN', 'products:create')).toBe(true);
      expect(hasPermission('ADMIN', 'products:delete')).toBe(true);
      expect(hasPermission('ADMIN', 'cashRegister:open')).toBe(true);
      expect(hasPermission('ADMIN', 'team:invite')).toBe(true);
      expect(hasPermission('ADMIN', 'settings:edit')).toBe(false);
    });

    it('MEMBER tiene permisos básicos de operación', () => {
      expect(hasPermission('MEMBER', 'pos:create')).toBe(true);
      expect(hasPermission('MEMBER', 'customers:view')).toBe(true);
      expect(hasPermission('MEMBER', 'products:view')).toBe(true);
      expect(hasPermission('MEMBER', 'products:delete')).toBe(false);
      expect(hasPermission('MEMBER', 'cashRegister:open')).toBe(false);
      expect(hasPermission('MEMBER', 'settings:edit')).toBe(false);
    });

    it('rechaza roles inválidos', () => {
      // @ts-expect-error Testing invalid role
      expect(hasPermission('INVALID_ROLE', 'products:view')).toBe(false);
    });

    it('rechaza permisos inexistentes', () => {
      // @ts-expect-error Testing invalid permission
      expect(hasPermission('OWNER', 'invalid.permission')).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('OWNER obtiene array completo de permisos', () => {
      const ownerPerms = getPermissionsForRole('OWNER');
      expect(ownerPerms.length).toBeGreaterThan(60);
      expect(ownerPerms).toContain('products:create');
      expect(ownerPerms).toContain('settings:edit');
      expect(ownerPerms).toContain('team:changeRole');
    });

    it('ADMIN obtiene subset de permisos', () => {
      const adminPerms = getPermissionsForRole('ADMIN');
      expect(adminPerms.length).toBeGreaterThan(40);
      expect(adminPerms.length).toBeLessThan(120);
      expect(adminPerms).toContain('products:create');
      expect(adminPerms).not.toContain('settings:edit');
    });

    it('MEMBER obtiene permisos limitados', () => {
      const memberPerms = getPermissionsForRole('MEMBER');
      expect(memberPerms.length).toBeGreaterThan(15);
      expect(memberPerms.length).toBeLessThan(50);
      expect(memberPerms).toContain('pos:create');
      expect(memberPerms).not.toContain('products:delete');
    });

    it('roles superiores incluyen permisos de roles inferiores', () => {
      const memberPerms = getPermissionsForRole('MEMBER');
      const adminPerms = getPermissionsForRole('ADMIN');
      const ownerPerms = getPermissionsForRole('OWNER');

      // ADMIN debe tener todos los permisos de MEMBER
      memberPerms.forEach(perm => {
        expect(adminPerms).toContain(perm);
      });

      // OWNER debe tener todos los permisos de ADMIN
      adminPerms.forEach(perm => {
        expect(ownerPerms).toContain(perm);
      });
    });
  });

  describe('PERMISSIONS Matrix', () => {
    it('define permisos para todas las categorías críticas', () => {
      const allKeys = Object.keys(PERMISSIONS);
      
      // Verificar que existen permisos para recursos críticos
      expect(allKeys.some(k => k.startsWith('products:'))).toBe(true);
      expect(allKeys.some(k => k.startsWith('pos:'))).toBe(true);
      expect(allKeys.some(k => k.startsWith('customers:'))).toBe(true);
      expect(allKeys.some(k => k.startsWith('cashRegister:'))).toBe(true);
      expect(allKeys.some(k => k.startsWith('settings:'))).toBe(true);
      expect(allKeys.some(k => k.startsWith('team:'))).toBe(true);
    });

    it('cada permiso define roles correctamente', () => {
      const productsView = PERMISSIONS['products:view'];
      
      expect(productsView).toBeDefined();
      expect(Array.isArray(productsView)).toBe(true);
      expect(productsView.length).toBeGreaterThan(0);
    });

    it('permisos sensibles restringidos a OWNER', () => {
      expect(PERMISSIONS['settings:edit']).toEqual(['OWNER']);
      expect(PERMISSIONS['team:changeRole']).toEqual(['OWNER']);
      expect(PERMISSIONS['settings:deleteOrganization']).toEqual(['OWNER']);
    });

    it('permisos de eliminación requieren al menos ADMIN', () => {
      const deletePerms = [
        PERMISSIONS['products:delete'],
        PERMISSIONS['customers:delete'],
        PERMISSIONS['suppliers:delete'],
      ];

      deletePerms.forEach(roles => {
        expect(roles).not.toContain('MEMBER');
        expect(roles.length).toBeLessThanOrEqual(2); // Solo OWNER y ADMIN
      });
    });
  });

  describe('Security Boundaries', () => {
    it('MEMBER no puede abrir caja', () => {
      expect(hasPermission('MEMBER', 'cashRegister:open')).toBe(false);
      expect(hasPermission('MEMBER', 'cashRegister:close')).toBe(false);
    });

    it('MEMBER no puede modificar configuración', () => {
      expect(hasPermission('MEMBER', 'settings:view')).toBe(true); // Puede ver
      expect(hasPermission('MEMBER', 'settings:edit')).toBe(false); // No puede editar
    });

    it('Solo OWNER puede gestionar roles del equipo', () => {
      expect(hasPermission('OWNER', 'team:changeRole')).toBe(true);
      expect(hasPermission('ADMIN', 'team:changeRole')).toBe(false);
      expect(hasPermission('MEMBER', 'team:changeRole')).toBe(false);
    });

    it('operaciones financieras críticas requieren ADMIN+', () => {
      expect(hasPermission('MEMBER', 'accounting:viewBalance')).toBe(false);
      expect(hasPermission('ADMIN', 'accounting:viewBalance')).toBe(true);
      expect(hasPermission('OWNER', 'accounting:viewBalance')).toBe(true);
    });
  });
});
