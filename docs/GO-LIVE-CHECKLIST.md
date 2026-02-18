# Checklist Go-Live - Tendo

> **Fecha:** 16 de febrero de 2026  
> **Objetivo:** salida controlada (beta operativa) con foco en continuidad y soporte.

## 1) Preparación técnica

- [x] `npm run build` en verde en rama de release.
- [ ] Migraciones Prisma aplicadas en entorno objetivo.
- [ ] Variables de entorno validadas (`AUTH_SECRET`, `DATABASE_URL`, `NEXTAUTH_URL`).
- [ ] Verificar timezone operacional (`America/Santiago`) en servidor.
- [ ] Ejecutar smoke test de rutas críticas API (`/api/dashboard/kpis`, `/api/services/*`, `/api/credits/*`, `/api/health`).

> Comando sugerido: `npm run smoke:api`  
> Variables opcionales para validación autenticada: `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `SMOKE_BASE_URL`

### Avances implementados (17-02-2026)

- [x] Endpoint de health check disponible en `/api/health`.
- [x] Script automatizado de smoke API (`npm run smoke:api`) para health + endpoints críticos autenticados.
- [x] Smoke público validado localmente: `GET /api/health` responde 200.
- [x] Módulo dashboard de Documentos habilitado (`/dashboard/documents`).
- [x] Emails transaccionales conectados para invitaciones de equipo y alta de tenant owner.
- [x] Registro con `invitationToken` para aceptar invitaciones al crear cuenta.
- [x] Hardening de borrados: clientes/productos se desactivan si tienen historial, evitando pérdida de trazabilidad.

## 2) Seguridad y permisos

- [ ] Validar acceso `SUPER_ADMIN` a `/admin` y denegación para otros roles.
- [ ] Validar aislamiento tenant (`organizationId`) en módulos: customers, products, credits, services.
- [ ] Revisar flujo de impersonation y salida de impersonation.
- [ ] Confirmar que usuarios sin organización no acceden a rutas de tenant.

> Comando sugerido: `npm run smoke:security`  
> Variables opcionales por rol: `SMOKE_MEMBER_EMAIL`, `SMOKE_MEMBER_PASSWORD`, `SMOKE_SUPERADMIN_EMAIL`, `SMOKE_SUPERADMIN_PASSWORD`  
> Modo estricto: `SMOKE_STRICT=true`

- [x] Baseline seguridad no autenticado validado por smoke (`401` en `/api/dashboard/kpis`, `/api/team/members`, `/api/admin/tenants`).

## 3) Operación funcional mínima (por tenant)

> Estado funcional actualizado al 17-02-2026:
> - ✅ **Implementación disponible en código** (APIs/UI existentes)
> - ⏳ **Validación operativa/UAT pendiente** para cierre go-live

### Retail
- [x] Implementación: Crear/editar producto y categoría.
- [ ] Validación UAT: Crear/editar producto y categoría.
- [x] Implementación: Registrar venta en POS con pago efectivo.
- [ ] Validación UAT: Registrar venta en POS con pago efectivo.
- [x] Implementación: Cerrar caja y revisar reporte.
- [ ] Validación UAT: Cerrar caja y revisar reporte.
- [x] Implementación: Registrar cliente + crédito + pago de cuota.
- [ ] Validación UAT: Registrar cliente + crédito + pago de cuota.

### Servicios
- [x] Implementación: Crear cotización.
- [ ] Validación UAT: Crear cotización.
- [x] Implementación: Aprobar/convertir cotización a proyecto.
- [ ] Validación UAT: Aprobar/convertir cotización a proyecto.
- [x] Implementación: Registrar gasto y recurso en proyecto.
- [ ] Validación UAT: Registrar gasto y recurso en proyecto.
- [x] Implementación: Crear/actualizar hito y revisar desvío estimado vs real.
- [ ] Validación UAT: Crear/actualizar hito y revisar desvío estimado vs real.
- [x] Implementación: Confirmar aparición de alertas de vencimiento/sobrecosto.
- [ ] Validación UAT: Confirmar aparición de alertas de vencimiento/sobrecosto.

## 4) Datos y respaldo

- [ ] Snapshot de base de datos previo a despliegue.
- [ ] Procedimiento de rollback documentado (migración + deploy previo).
- [ ] Logs de aplicación y auditoría habilitados y verificables.
- [ ] Política de retención mínima de respaldos definida.

## 5) Soporte y operación diaria

- [ ] Definir canal único de soporte (correo o ticket).
- [ ] Definir responsable de guardia para incidentes de caja/ventas.
- [ ] Plantilla de respuesta para incidentes frecuentes (acceso, ventas no registradas, sincronización).
- [ ] Protocolo de escalamiento (Nivel 1, Nivel 2, desarrollo).

## 6) Criterio de salida

Se considera **Go-Live aprobado** cuando:

1. No hay bloqueos en puntos 1, 2 y 3.
2. Existe respaldo válido y procedimiento de rollback probado.
3. El equipo responsable de soporte está asignado.

## 7) Pendientes fuera de este Go-Live

- Backoffice super-admin v2 (métricas SaaS avanzadas).
- Flujo dedicado de cuentas por pagar/proveedores.
- Permisos internos granulares por módulo (más allá del baseline actual).
