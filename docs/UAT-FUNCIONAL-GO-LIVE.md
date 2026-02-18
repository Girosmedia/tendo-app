# UAT Funcional Go-Live - Tendo

> Fecha: 17 de febrero de 2026  
> Objetivo: cerrar validación operativa de los flujos funcionales mínimos (Retail + Servicios).

## Prerrequisitos

- Entorno con migraciones aplicadas y `npm run build` OK.
- Usuario de prueba `ORG_ADMIN` (tenant operativo).
- Caja abierta para pruebas POS.
- Datos base: al menos 1 categoría, 1 producto con stock y 1 cliente.

## 1) Retail

### Caso R1: Crear/editar producto y categoría
- Crear categoría desde catálogo.
- Crear producto asociado con SKU único.
- Editar precio/stock y confirmar persistencia.
- Resultado esperado:
  - Producto visible en listado.
  - Cambios reflejados sin errores.

### Caso R2: Venta POS efectivo
- Buscar producto en POS y agregar al carrito.
- Cobrar en método efectivo y confirmar venta.
- Resultado esperado:
  - Documento `SALE` en estado `PAID`.
  - Stock decrementado para productos con inventario.

### Caso R3: Cierre de caja + reporte
- Cerrar caja con monto real de efectivo.
- Abrir reporte de caja y verificar resumen.
- Resultado esperado:
  - Caja cambia a `CLOSED`.
  - Reporte muestra total ventas, diferencias y métodos de pago.

### Caso R4: Cliente + crédito + pago
- Crear cliente.
- Registrar venta/crédito (fiado).
- Registrar pago parcial o total.
- Resultado esperado:
  - Crédito con saldo actualizado.
  - Deuda del cliente decrementada por pago.

## 2) Servicios

### Caso S1: Crear cotización
- Crear cotización con ítems y cliente.
- Resultado esperado:
  - Documento `QUOTE` creado con totales correctos.

### Caso S2: Aprobar y convertir cotización a proyecto
- Cambiar estado a `APPROVED`.
- Ejecutar conversión a proyecto.
- Resultado esperado:
  - Proyecto creado y enlazado a cotización.
  - No permite doble conversión.

### Caso S3: Registrar gasto y recurso
- Crear gasto en proyecto.
- Crear recurso/material en proyecto.
- Resultado esperado:
  - `actualCost` del proyecto aumenta según montos.

### Caso S4: Hitos y desvío
- Crear hito con costo estimado y fecha.
- Actualizar hito (completado/no completado).
- Revisar desvío estimado vs real en detalle de proyecto.
- Resultado esperado:
  - Métricas de hito y proyecto reflejan variación correcta.

### Caso S5: Alertas
- Generar condición de hito vencido o sobrecosto.
- Consultar alertas de servicios.
- Resultado esperado:
  - Alertas aparecen con severidad y mensaje correcto.

## Evidencia mínima para cierre

- Capturas o exportes de cada caso R1-R4 y S1-S5.
- Resultado de `npm run smoke:api` y `npm run smoke:security`.
- Registro de incidencias detectadas y resolución.

## Criterio de aprobación funcional

- Se aprueba cuando todos los casos R1-R4 y S1-S5 están en estado OK sin bloqueantes.
- Si hay issues menores, deben tener workaround documentado y fecha de corrección.
