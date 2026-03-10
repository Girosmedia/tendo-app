# Plan de Refactorización de Arquitectura Contable y Dashboard
*(Revisión v3 — 10/03/2026)*

## Contexto y Problemática
El sistema actual (en producción) presenta discrepancias en el Dashboard financiero mostrando márgenes negativos e irreales.  
Bajo el régimen Pyme en Chile (**14 D3 y 14 D8**) la tributación se basa en el **Flujo de Caja (Percibido)**. Sin embargo, para gestión interna la Pyme necesita ver su rentabilidad real **(Devengado)**. Al mezclar ambas vistas el sistema resta compras de inventario directamente a las ventas del mes, destruyendo el margen visible.

**Separar ambos dominios sin romper producción:**
1. **Vista de Gestión** → Rentabilidad Real (Devengado)
2. **Vista Tributaria/Flujo** → Liquidez 14 D3/D8 (Percibido)

---

## ✅ SPRINT 1 — Completado (10/03/2026)
*Fundaciones de datos seguras: Fase 0 + Fase 1 + Fase 4 (Captura)*

### Lo que se implementó
1. **`unitCost` en `DocumentItem` (non-breaking)**
   - Campo `unitCost Decimal? @map("unit_cost")` agregado en `prisma/schema.prisma`.
   - Migración aditiva: `prisma/migrations/20260310110000_add_unit_cost_to_document_items/migration.sql`.
   - Prisma Client regenerado (`pnpm prisma generate`).

2. **Dual-write transaccional en creación de documentos** (`app/api/documents/route.ts`)
   - Al crear cualquier venta, el servidor captura el `cost` actual del `Product` por organización y lo persiste como `unitCost` en cada `DocumentItem` (snapshot histórico).
   - Para todos los pagos directos (CASH, CARD, TRANSFER, CHECK) crea el registro de `DocumentPayment` dentro de la misma transacción Prisma. Antes sólo se creaba para pagos `MULTI`.

3. **Scripts de backfill idempotentes (producción-safe)**
   - `scripts/backfill-unit-costs.ts` — modo `--dry-run` por defecto; procesa en lotes paginados con cursor; usa `--apply` para persistir.
   - `scripts/backfill-document-payments.ts` — mismo patrón; detecta documentos PAID sin `DocumentPayment` y los crea.
   - Comandos npm agregados en `package.json`: `backfill:unit-costs` y `backfill:document-payments`.

### Pasos pendientes antes de avanzar a producción
- [ ] Ejecutar `pnpm backfill:unit-costs` (dry-run primero, luego `--apply`) en staging/prod.
- [ ] Ejecutar `pnpm backfill:document-payments` (dry-run primero, luego `--apply`) en staging/prod.
- [ ] Correr migración SQL en producción (`prisma migrate deploy`).

---

## ✅ SPRINT 2 — Completado (10/03/2026)
*Motores financieros duales: Fase 2 + Fase 3*

### Lo que se implementó

1. **`lib/utils/accounting-engine.ts` (nuevo)**
   - `calculateManagementMetrics(organizationId, startDate, endDate)` → Motor de Rentabilidad:
     - `revenueNet`: suma `Document.subtotal` (sin IVA) incluyendo ventas fiadas (devengado).
     - `cogs`: suma `DocumentItem.quantity × unitCost` con fallback a `product.cost` durante transición.
     - `grossMargin`, `grossMarginPct`, `costCoveragePct`, `itemsWithoutCost`, `warnings[]`.
   - `calculateCashFlowMetrics(organizationId, startDate, endDate)` → Motor Flujo 14 D3/D8:
     - `cashInflows`: `DocumentPayment.amount` + `Payment.amount` (cobros reales).
     - `cashOutflows`: `OperationalExpense.amount` + `TreasuryMovement OUTFLOW`.
     - `netCashFlow`, `creditSalesPending` (fiados emitidos aún no cobrados).
   - Reglas 14 D3/D8 codificadas como constantes en comentarios del archivo.

2. **`app/api/dashboard/kpis/route.ts` (extendido, backward-compatible)**
   - Importa y llama a ambos motores en paralelo con el período activo.
   - Agrega `managementMetrics` y `cashFlowMetrics` a la respuesta JSON.
   - Todos los campos legacy (`financials`, `periodSummary`, `zimpleIndicators`, etc.) intactos.
   - Corregidas las queries de COGS internas (`getFinancialAggregateByRange`, `salesTodayItems`, `salesThisMonthItems`) para usar `unitCost` con fallback a `product.cost`.

3. **`lib/utils/accounting-zimple.ts` (migrado)**
   - `getCostOfSalesByDocument`: ahora selecciona `unitCost` del ítem y usa la misma lógica de prioridad `snapshot → live → 0`, eliminando la dependencia exclusiva en `product.cost`.

### Criterios de aceptación cumplidos
- [x] Sin errores TypeScript en los tres archivos modificados.
- [x] `managementMetrics` y `cashFlowMetrics` presentes en respuesta de `/api/dashboard/kpis`.
- [x] La UI actual del Dashboard no rompe (campos legacy intactos).
- [x] `accounting-zimple.ts` calcula COGS con `unitCost` (no solo con `product.cost`).

---

## ✅ SPRINT 3 — Completado (10/03/2026)
*UI Panel Ejecutivo: Fase 5*

### Lo que se implementó

1. **`app/dashboard/page.tsx` (extendido)**
   - Nuevas interfaces `ManagementMetrics` y `CashFlowMetrics` declaradas junto al componente.
   - Destructuring defensivo de `kpisData.managementMetrics` y `kpisData.cashFlowMetrics` con `?? 0` / `?? []` (backward-compatible).
   - Nuevos iconos importados de lucide-react: `TrendingDown`, `BarChart3`, `Activity`.

2. **Sección "Rentabilidad de Ventas" (Motor Devengado)**
   - 4 `KpiCard`: Ingresos netos · Costo de ventas · Margen bruto (+%) · Cobertura de costos.
   - Badge de alerta en header cuando `itemsWithoutCost > 0`.
   - Banner de `warnings[]` inline si hay problemas de calidad de datos.
   - Condicionada a `hasSelectedMonthlyData` (no aparece en períodos sin ventas).

3. **Sección "Flujo de Caja" (Motor Percibido 14 D3)**
   - 4 `KpiCard`: Entradas · Salidas · Flujo neto · CxC pendiente.
   - Chip informativo de `creditSalesPending` en el header.
   - `alertVariant='destructive'` en Flujo Neto cuando es negativo.
   - Condicionada a `hasSelectedMonthlyData`.

4. **Corrección Tailwind v4 deprecated (6 clases en 3 archivos)**
   - `kpi-card.tsx` (x2): `max-w-[220px]` → `max-w-55`.
   - `setup-checklist.tsx` (x3): `bg-gradient-to-br` → `bg-linear-to-br`, `flex-shrink-0` (x2) → `shrink-0`.
   - `contabilidad/page.tsx` (x1): `min-h-[400px]` → `min-h-100`.

### Criterios de aceptación
- [x] Ambas secciones visibles en el Dashboard real de la Pyme.
- [x] Los dos motores se alimentan correctamente del período seleccionado (hoy/semana/mes/trimestre).
- [x] Sin warnings de Tailwind deprecated.
- [x] Tooltips visibles en desktop y mobile (via prop `description` de `KpiCard`).
- [x] Sin errores TypeScript en archivos modificados.

---

## ✅ SPRINT 4 — Completado (10/03/2026)
*Hardening, QA y release gradual: Fase 3 restante*

### Lo que se implementó

1. **`__tests__/accounting-engine.test.ts` (nuevo — 14 tests)**
   - Motor 1 (Devengado): unitCost snapshot, fallback a product.cost, ítems sin costo, warnings, división por cero guard, costCoveragePct decimal.
   - Motor 2 (Percibido 14 D3): flujo neto positivo/negativo, creditSalesPending, nulls en aggregates, suma de las dos fuentes de inflow.
   - DB mockeada con `vi.mock('@/lib/db')` — sin dependencia de base de datos.

2. **`scripts/reconcile-accounting.ts` (nuevo)**
   - Compara motor nuevo vs motor legacy por organización y período.
   - Parámetros: `--period=YYYY-MM`, `--orgId=xxx`, `--threshold=N` (% de diferencia tolerable).
   - Reporta diferencias en ingresos netos, COGS y margen bruto.
   - Muestra estado de flujo de caja y warnings de calidad de datos.
   - Comando npm: `pnpm reconcile:accounting`.

### Criterios de aceptación
- [x] Tests unitarios cubren casos borde (nota de crédito fiado, sin costo, cero ingresos).
- [x] Script de reconciliación ejecutable en staging/prod sin modificar datos.
- [x] `managementMetrics` y `cashFlowMetrics` como fuente expuesta en UI (Sprint 3).

---

## ✅ SPRINT 5a — Completado (10/03/2026)
*Hotfixes Dashboard UX + corrección de métricas*

### Lo que se implementó

1. **`app/dashboard/page.tsx` (hotfixes UX)**
   - `export const dynamic = 'force-dynamic'` + `cache: 'no-store'` para datos en tiempo real.
   - Todos los encabezados de período muestran el rango de fechas ("Esta semana · 9 - 15 mar").
   - Badge "Hoy: $X" cuando el período activo ≠ hoy y hay ventas del día.
   - Card "Margen bruto del período" reemplaza "Resultado neto" — usa `grossProfitDelta` para evitar distorsión por egresos puntuales.
   - Egresos y resultado neto mostrados como notas al pie del card.

2. **`lib/utils/dashboard-helpers.ts` (nueva función)**
   - `formatDateRange(startIso, endIso): string` — convierte ISO UTC → `toZonedTime(Santiago)` → "9 - 15 mar" / "28 feb - 6 mar".

3. **`scripts/reconcile-accounting.ts` (bugfix)**
   - Agregado `import 'dotenv/config'` — sin esto `lib/db.ts` se inicializaba con `DATABASE_URL` indefinido y fallaba con `P1010`.

### Criterios de aceptación
- [x] Dashboard muestra fechas exactas del período seleccionado.
- [x] `grossProfit` usada para delta (comparación coherente entre períodos).
- [x] `pnpm reconcile:accounting` ejecuta sin errores en ambiente local.

---

## ✅ SPRINT 6 — Completado (10/03/2026)
*Visibilidad de Exposición Financiera: CxC · CxP · Posición de Tesorería*

### Lo que se implementó

1. **`lib/utils/accounting-engine.ts` (ampliado)**
   - Nueva interface `ExposureMetrics` con `receivables`, `payables` y `treasury`.
   - `calculateExposureMetrics(organizationId, periodStart, periodEnd)` — 11 queries Prisma en paralelo:
     - **CxC**: total activo, vencido (`dueDate < hoy` o status `OVERDUE`), por vencer en 7 días, top deudores, eficiencia de cobranza (% cobrado sobre devengado).
     - **CxP**: total pendiente, vencido, vence en 7 días, top proveedores.
     - **Tesorería**: saldo estimado = suma de entradas netas de `TreasuryMovement`.

2. **`app/api/dashboard/kpis/route.ts` (ampliado)**
   - `calculateExposureMetrics` llamado en el mismo `Promise.all` del handler.
   - `receivables`, `payables` y `treasury` agregados al JSON de respuesta (backward-compatible).

3. **`app/dashboard/page.tsx` (nuevas secciones)**
   - Interfaces `ReceivablesMetrics`, `PayablesMetrics`, `TreasuryPosition`.
   - Saldo estimado de tesorería mostrado en card "Flujo de Caja".
   - Grid `lg:grid-cols-2` con cards siempre visibles:
     - **"Cobranza · CxC"**: Total activo · Vencido (rojo) · Por vencer 7d (amarillo) · Top 3 deudores · % eficiencia.
     - **"Proveedores · CxP"**: Total deuda · Vencida · Vence 7d · Top 3 proveedores.
   - Estado vacío limpio cuando no hay datos.

4. **`__tests__/accounting-engine.test.ts` (ampliado)**
   - 8 nuevos casos para `calculateExposureMetrics`: crédito vencido, status OVERDUE, dueSoon 7d, balance=0 no contado, CxP PENDING+vencida, CxP OVERDUE, CxP vacía, tesorería negativa.

### Criterios de aceptación
- [x] Cards CxC y CxP visibles en dashboard (sin condición de período).
- [x] Tesorería estimada con disclaimer en card Flujo de Caja.
- [x] 0 errores TypeScript en los 4 archivos modificados.
- [x] 8+ tests unitarios pasan sin BD real (db mockeada con `vi.mock`).

---

## ✅ SPRINT 7 — Completado (10/03/2026)
*Cierre de gaps en Bloques 3 y 4: eficiencia de cobranza por período + pagos a proveedores*

### Lo que se implementó

1. **`lib/utils/accounting-engine.ts` — `ExposureMetrics` ampliada**
   - `receivables.emittedThisPeriod`: monto total de créditos emitidos en el período (`credit.amount` suma, filtrado por `createdAt`). Ahora el dueño ve exactamente cuánto vendió fiado en el período.
   - `receivables.collectedThisPeriod`: pagos cobrados en el período (`payment.amount` suma, filtrado por `paidAt`). Independiente de cuándo se emitió el crédito.
   - `payables.paidThisPeriod`: suma de `TreasuryMovement OUTFLOW` vinculados a una `AccountPayable` (`accountPayableId IS NOT NULL`) en el período (`occurredAt`). Muestra cuánto se pagó efectivamente a proveedores.
   - Query total: 13 Prisma queries en paralelo (era 12).

2. **`app/dashboard/page.tsx` — UI actualizada**
   - Interfaces `ReceivablesMetrics` y `PayablesMetrics` actualizadas con los nuevos campos.
   - **Card CxC**: badge del header renombrado a "X% cobrado del período". Nuevo banner inline debajo del grid de 3 métricas: "Emitido {período}: $X | Cobrado {período}: $Y | X% eficiencia", con colores dinámicos (verde/ámbar/rojo). Se muestra solo cuando `emittedThisPeriod > 0 || collectedThisPeriod > 0`.
   - **Card CxP**: nuevo banner verde "Pagado {período}: $X" debajo del grid, se muestra cuando `paidThisPeriod > 0`.

3. **`__tests__/accounting-engine.test.ts` — 7 nuevos tests**
   - `mockExposure` actualizada: 3ra llamada a `db.treasuryMovement.aggregate` para `cxpPaidThisPeriod`.
   - Nuevos casos: `emittedThisPeriod` refleja créditos del período, `collectedThisPeriod` refleja cobros del período, ratio > 100% capped, `emittedThisPeriod = 0` → `collectionEfficiencyPct = null`, `paidThisPeriod` con valor, `paidThisPeriod = 0`, independencia deuda vs pago del período.

### Estado de los 4 bloques de negocio
| Bloque | Métricas | Estado |
|---|---|---|
| 1 — Rendimiento Comercial | Ventas netas · Margen bruto · Ticket promedio · Top productos | ✅ Completo |
| 2 — Posición de Caja | Entradas · Salidas · Flujo neto · Saldo estimado (proxy INFLOW−OUTFLOW) | ✅ Funcional |
| 3 — Cobranza CxC | Total activo · Vencido · Por vencer 7d · Emitido período · Cobrado período · % eficiencia del período · Top deudores | ✅ Completo |
| 4 — Proveedores CxP | Total pendiente · Vencido · Vence 7d · Pagado este período · Top proveedores | ✅ Completo |

### Criterios de aceptación
- [x] `emittedThisPeriod` y `collectedThisPeriod` visibles en card CxC con contexto del período activo.
- [x] `paidThisPeriod` visible en card CxP cuando hay pagos en el período.
- [x] Badge del header de CxC refleja eficiencia del período (no acumulada).
- [x] 28/28 tests pasan (7 nuevos + 21 existentes).
- [x] 0 errores TypeScript en los 3 archivos modificados.

---

## 📋 SPRINT 5b — Pendiente
*Release definitivo en producción*

### Tareas pendientes
- Ejecutar backfills en producción (pre-requisito del Sprint 1):
  - [ ] `pnpm backfill:unit-costs --apply` en staging → validar → producción.
  - [ ] `pnpm backfill:document-payments --apply` en staging → validar → producción.
  - [ ] `pnpm prisma migrate deploy` en producción.
- Ejecutar reconciliación post-backfill:
  - [ ] `pnpm reconcile:accounting --period=YYYY-MM` y verificar diferencias < 5%.
- Hardening:
  - [ ] Runbook operativo de rollback (flag feature, reversa API, restauración snapshot DB).
  - [ ] Documentar fórmulas contables en `docs/FORMULAS-CONTABLES.md` para futuros devs.

### Estado en ambientes
| Ambiente | backfill:unit-costs | backfill:document-payments | migrate deploy |
|---|---|---|---|
| **Local** | ✅ Aplicado (1 ítem actualizado) | ✅ Sin pendientes | ✅ Ya aplicado |
| **Staging** | ⏳ Pendiente | ⏳ Pendiente | ⏳ Pendiente |
| **Producción** | ⏳ Pendiente | ⏳ Pendiente | ⏳ Pendiente |

---

## Principios No Negociables (resumen técnico)
| Regla | Implementación |
|---|---|
| Nunca usar `product.cost` para márgenes históricos | Usar siempre `DocumentItem.unitCost` |
| Nunca usar `Document.total` como "plata en caja" | Usar `DocumentPayment.amount` + `Payment.amount` |
| Los fiados son ingreso devengado, no percibido | `paymentMethod = 'CREDIT'` → `revenueNet` sí, `cashInflows` no |
| IVA fuera del margen de gestión | Usar `Document.subtotal` (sin IVA) para COGS y margen |
| Compra de inventario no es gasto operativo | `OperationalExpense` sólo para arriendos, sueldos, utilería |
| America/Santiago en todos los filtros de fecha | Siempre `date-fns-tz` con `CHILE_TIMEZONE` |

---

## ✅ SPRINT 8 — Escritura automática de TreasuryMovement

**Objetivo:** hacer que `treasury.estimatedBalance` refleje el flujo real de caja sin depender de entradas manuales.

### Problema previo
`TreasuryMovement` sólo se poblaba manualmente desde el módulo de Tesorería. Las ventas, abonos y pagos a proveedores **no creaban entradas automáticas**, por lo que el "Saldo estimado de caja" era casi siempre `$0` o inexacto.

### Cambios implementados

1. **`prisma/schema.prisma`** — nuevos valores de enum y FK:
   - `TreasuryMovementCategory`: `+SALE_INCOME`, `+CREDIT_PAYMENT`, `+OPERATIONAL_EXPENSE` (reservado), `+CASH_REGISTER_DIFF`.
   - `TreasuryMovement`: `documentId String? @unique` (FK a `Document`) · `creditPaymentId String? @unique` (FK a `Payment`).
   - `Document`: relación `treasuryMovements TreasuryMovement[]`.
   - `Payment`: relación `treasuryMovement TreasuryMovement?`.
   - Migración: `20260311120000_add_treasury_movement_auto_write`.

2. **`app/api/documents/route.ts`** — INFLOW automático al crear venta pagada al contado:
   - Dentro del `$transaction`, tras crear el `Credit` (si aplica), se crea `TreasuryMovement` con `category: SALE_INCOME`.
   - `source`: `CASH` | `TRANSFER` | `BANK` (tarjeta/cheque) | `OTHER` (multi).
   - `amount`: `roundedCashTotal` para CASH, `total` para el resto.
   - No aplica para `paymentMethod = 'CREDIT'` (venta fiada = devengado, no percibido).

3. **`app/api/credits/[id]/payments/route.ts`** — INFLOW automático por abono de crédito:
   - Cuarto paso dentro del `$transaction`: crea `TreasuryMovement` con `category: CREDIT_PAYMENT`, `creditPaymentId: newPayment.id`.

4. **`app/api/accounts-payable/[id]/payments/route.ts`** — atomicidad CxP:
   - `db.accountPayable.update` + `db.treasuryMovement.create` envueltos en `db.$transaction`.
   - Sin cambio de lógica; sólo garantiza consistencia si falla alguna operación.

5. **`app/api/cash-register/[id]/close/route.ts`** — diferencial de arqueo:
   - Tras `db.cashRegister.update`, si `difference ≠ 0`: crea `TreasuryMovement` con `category: CASH_REGISTER_DIFF`.
   - `difference > 0` → INFLOW "Sobrante arqueo de caja".
   - `difference < 0` → OUTFLOW "Faltante arqueo de caja" con `Math.abs(difference)`.

6. **`scripts/backfill-treasury-movements.ts`** — backfill histórico:
   - Encuentra documentos PAID sin TreasuryMovement y Payment (abonos) sin TreasuryMovement.
   - `pnpm tsx scripts/backfill-treasury-movements.ts` → dry-run.
   - `pnpm tsx scripts/backfill-treasury-movements.ts --apply` → persistir.

7. **`app/dashboard/page.tsx`** — descripción del saldo estimado actualizada:
   - Tooltip cambiado de "(INFLOW – OUTFLOW acumulado)" a "(ventas + abonos − pagos CxP, acumulado)".

### ¿Por qué NO se agregó TreasuryMovement para OperationalExpense?
`calculateCashFlowMetrics` suma `OperationalExpense.amount` + `TreasuryMovement OUTFLOW` directamente.  
Agregar OUTFLOW por cada gasto operativo introduciría **doble conteo** en `cashOutflows`.  
El enum `OPERATIONAL_EXPENSE` quedó reservado para cuando `calculateCashFlowMetrics` se refactorice para usar `TreasuryMovement` como única fuente de verdad.

### Criterios de aceptación
- [x] 0 errores TypeScript en los 4 route files modificados.
- [x] Migración `20260311120000_add_treasury_movement_auto_write` aplicada.
- [x] Prisma Client regenerado con nuevos tipos.
- [x] Backfill script listo para ejecutar en producción con `--apply`.
- [x] dashboard: descripción del saldo estimado actualizada.
