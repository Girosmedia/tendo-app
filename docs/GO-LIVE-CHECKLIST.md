# Checklist Go-Live - Tendo

> **Fecha:** 16 de febrero de 2026  
> **Objetivo:** salida controlada (beta operativa) con foco en continuidad y soporte.

## 1) Preparación técnica

- [ ] `npm run build` en verde en rama de release.
- [ ] Migraciones Prisma aplicadas en entorno objetivo.
- [ ] Variables de entorno validadas (`AUTH_SECRET`, `DATABASE_URL`, `NEXTAUTH_URL`).
- [ ] Verificar timezone operacional (`America/Santiago`) en servidor.
- [ ] Ejecutar smoke test de rutas críticas API (`/api/dashboard/kpis`, `/api/services/*`, `/api/credits/*`).

## 2) Seguridad y permisos

- [ ] Validar acceso `SUPER_ADMIN` a `/admin` y denegación para otros roles.
- [ ] Validar aislamiento tenant (`organizationId`) en módulos: customers, products, credits, services.
- [ ] Revisar flujo de impersonation y salida de impersonation.
- [ ] Confirmar que usuarios sin organización no acceden a rutas de tenant.

## 3) Operación funcional mínima (por tenant)

### Retail
- [ ] Crear/editar producto y categoría.
- [ ] Registrar venta en POS con pago efectivo.
- [ ] Cerrar caja y revisar reporte.
- [ ] Registrar cliente + crédito + pago de cuota.

### Servicios
- [ ] Crear cotización.
- [ ] Aprobar/convertir cotización a proyecto.
- [ ] Registrar gasto y recurso en proyecto.
- [ ] Crear/actualizar hito y revisar desvío estimado vs real.
- [ ] Confirmar aparición de alertas de vencimiento/sobrecosto.

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
