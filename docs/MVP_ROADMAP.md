# Roadmap MVP - Tendo (Track Retail)

> **Estrategia MVP:** Implementación completa del módulo **Track Retail** (gestión de almacenes/botiLlerías) antes de expandir a otros módulos.

## Target User
- **Perfil:** Dueño de almacén/botillería en Chile
- **Necesidades:** Vender productos, controlar stock, gestionar clientes, cerrar caja diaria
- **Filosofía:** "Zimple" - simplicidad radical, español chileno, mobile-first

---

## ✅ FASE 1: Base de Clientes (CRM Light) - COMPLETADA

**Estado:** ✅ Implementado y funcionando

### Características implementadas:
- [x] Modelo `Customer` con campos chilenos (RUT, región, tags)
- [x] Validación de RUT integrada
- [x] CRUD completo con API endpoints
- [x] UI con tabla, búsqueda y diálogo de creación/edición
- [x] 16 regiones de Chile en selector
- [x] Sistema de tags (VIP, Mayorista, Minorista, Corporativo, Frecuente)
- [x] Límite de crédito y deuda actual (preparación para Fiados)
- [x] Audit logging en todas las operaciones
- [x] Navegación integrada en sidebar

### Archivos creados:
- `prisma/schema.prisma` - Modelo Customer
- `lib/validators/customer.ts` - Validadores Zod
- `app/api/customers/route.ts` - GET, POST
- `app/api/customers/[id]/route.ts` - GET, PATCH, DELETE
- `app/dashboard/customers/page.tsx` - Página principal
- `app/dashboard/customers/_components/` - Header, Table, Dialog

---

## ✅ FASE 2: Sistema de Documentos - COMPLETADA

**Estado:** ✅ Implementado y funcionando

### Características implementadas:
- [x] Modelo `Document` polimórfico (SALE, QUOTE, INVOICE, RECEIPT, CREDIT_NOTE)
- [x] Modelo `DocumentItem` para líneas de detalle
- [x] Estados de documento (DRAFT, PENDING, APPROVED, PAID, CANCELLED)
- [x] Métodos de pago (CASH, CARD, TRANSFER, CHECK, CREDIT, MULTI)
- [x] Cálculo automático de totales (subtotal, IVA 19%, descuentos)
- [x] Numeración automática por tipo de documento
- [x] Decremento automático de stock en ventas pagadas
- [x] Restauración de stock al cancelar documentos
- [x] Manejo de vuelto para pagos en efectivo
- [x] Soporte para productos sin tracking de inventario

### Archivos creados:
- `prisma/schema.prisma` - Modelos Document, DocumentItem + Enums
- `lib/validators/document.ts` - Validadores Zod
- `app/api/documents/route.ts` - GET, POST
- `app/api/documents/[id]/route.ts` - GET, PATCH, DELETE

### Fórmulas de cálculo:
```typescript
// Por cada item:
itemSubtotal = (quantity * unitPrice) - discount
itemTaxAmount = itemSubtotal * (taxRate / 100)
itemTotal = itemSubtotal + itemTaxAmount

// Documento:
documentSubtotal = sum(itemsSubtotal)
documentTaxAmount = sum(itemsTaxAmount)
documentTotal = documentSubtotal + documentTaxAmount - documentDiscount
cashChange = cashReceived - documentTotal
```

---

## ✅ FASE 3: Punto de Venta (POS) - COMPLETADA

**Estado:** ✅ Implementado y funcionando

**Prioridad:** 🔴 CRÍTICA (Core del MVP)

### Objetivo:
Interfaz de venta rápida para cajeros/vendedores, optimizada para touch y teclado.

### Características implementadas:

#### 3.1 Interfaz de Búsqueda de Productos
- [x] Input de búsqueda destacado (SKU, nombre, código de barras)
- [x] Resultados en tiempo real mientras escribes (debounce 300ms)
- [x] Mostrar: Imagen placeholder, SKU, Nombre, Precio, Stock actual
- [x] Click/Enter para agregar al carrito
- [x] Soporte para scanner de código de barras (detección automática)
- [x] Filtrado automático: solo productos activos (isActive=true)
- [x] Filtrado automático: solo PRODUCT (excluye SERVICE)

#### 3.2 Carrito de Compra
- [x] Lista de productos agregados con badges de descuento
- [x] Controles +/- para cantidad con validación de stock
- [x] Botón X para eliminar producto
- [x] Actualización en tiempo real de subtotales
- [x] Validación de stock disponible (botón + disabled si alcanza máximo)
- [x] Botón "Descuento" por item (icono Tag)
- [x] Visual: precio original tachado si hay descuento
- [x] Badge mostrando descuento (-10% o -$500)

#### 3.3 Panel de Totales
- [x] Subtotal (neto sin IVA)
- [x] IVA 19%
- [x] Línea de descuentos (si hay descuentos en items)
- [x] Total a pagar (destacado, fuente grande)
- [x] Contador de items
- [x] Botón grande "Cobrar (F2)" (verde, touch-friendly, disabled si vacío)

#### 3.4 Sistema de Descuentos
- [x] **Descuentos por item individual:**
  - Dialog modal con tabs: Monto ($) / Porcentaje (%)
  - Sincronización automática entre monto y porcentaje
  - Preview en tiempo real con precio original tachado
  - Validación: descuento ≤ precio total del item
  - Atajos rápidos: botones 5%, 10%, 15%, 20%
  - Confirmación para descuentos > 15%
  - Navegación teclado: Enter (aplicar), Escape (cancelar)
- [x] **Descuento global sobre el total:**
  - Campo opcional en diálogo de pago
  - Toggle entre $ (monto) y % (porcentaje)
  - Resumen detallado mostrando descuento aplicado
  - Validación: descuento global ≤ total de la venta
  - Ajuste automático del vuelto

#### 3.5 Diálogo de Pago
- [x] 6 opciones de método de pago (CASH, CARD, TRANSFER, CHECK, CREDIT, MULTI)
- [x] Input para monto recibido (si es efectivo)
- [x] Cálculo automático de vuelto (con descuento global considerado)
- [x] Selector opcional de cliente (dropdown con búsqueda)
- [x] Carga de clientes on-demand (limit 100)
- [x] Campo de descuento global (opcional)
- [x] Botón "Confirmar Venta" con validaciones
- [x] Validación: monto recibido >= total (ajustado con descuento)
- [x] Validación: cliente requerido si método es CREDIT

#### 3.6 Post-Venta
- [x] Pantalla de éxito con total y número de venta
- [x] Mostrar vuelto destacado (verde) si es efectivo
- [x] Botón "Nueva Venta" para limpiar carrito
- [x] Botón "Cerrar"
- [x] Registro de venta en Documents con status PAID
- [x] Decremento automático de stock (solo productos con trackInventory=true)
- [x] Auto-refresh de productos después de venta
- [x] Limpieza automática del carrito

#### 3.7 UX Optimizations
- [x] Atajos de teclado:
  - `F2`: abrir diálogo de pago (solo si hay items)
  - `F3`: focus en búsqueda
  - `Esc`: cancelar/cerrar diálogos
- [x] Botones grandes (mínimo 48px altura) para touch
- [x] Feedback visual en cada acción (badges, colores, animaciones)
- [x] Loading states en operaciones asíncronas (submit, fetch)
- [x] Toast notifications (success/error) con Sonner
- [x] Keyboard navigation en dialogs
- [x] Mobile-first responsive layout

### Archivos creados:
- `app/dashboard/pos/page.tsx` - Página principal del POS
- `app/dashboard/pos/_components/product-search.tsx` - Búsqueda con scanner
- `app/dashboard/pos/_components/shopping-cart.tsx` - Carrito interactivo
- `app/dashboard/pos/_components/payment-dialog.tsx` - Diálogo pago con descuento global
- `app/dashboard/pos/_components/totals-panel.tsx` - Panel totales con descuentos
- `app/dashboard/pos/_components/item-discount-dialog.tsx` - Dialog descuentos por item
- `hooks/use-pos.ts` - Estado del carrito (Zustand) con refreshKey

### Detalles técnicos:

**Gestión de Estado (Zustand):**
```typescript
interface CartItem {
  id, productId, sku, name, quantity, unitPrice, stock,
  taxRate, discount, discountPercent
}

Actions:
- addItem(product)
- removeItem(productId)
- updateQuantity(productId, quantity)
- updateDiscount(productId, discount, discountPercent)
- clearCart()
- setCustomer(customerId)
- incrementRefreshKey()
- getTotals()
```

**Cálculo de Totales:**
- Precio unitario **ya incluye IVA** (precio bruto de venta)
- Descuento se aplica ANTES de desglosar IVA
- Fórmula: `itemTotal = (qty × precio) - descuento`
- IVA desglosado: `neto = itemTotal / (1 + taxRate/100)`

### Estimación:
**✅ Completado** (3 sesiones de trabajo)

---

## ✅ FASE 4: Dashboard con KPIs Reales - COMPLETADA

**Estado:** ✅ COMPLETADA

**Prioridad:** 🟡 MEDIA (Reemplazar mock data)

### Objetivo:
Reemplazar datos mock del dashboard actual con KPIs reales calculados desde la base de datos.

### Características implementadas:

#### 4.1 API de KPIs
- [x] Endpoint `GET /api/dashboard/kpis`
- [x] Cálculos en tiempo real con caché de 60 segundos
- [x] Filtrado por organizationId (multi-tenant)

#### 4.2 KPIs implementados:
- [x] **Ventas del día**
  - Total en CLP (documentos PAID del día actual)
  - Zona horaria: `America/Santiago`
  - Comparación con ayer (growth %)
  - Número de ventas realizadas
  - Ticket promedio (avgTicket)
  
- [x] **Ventas del mes**
  - Total acumulado mes actual
  - Comparación con mes anterior (growth %)
  - Número de ventas del mes
  
- [x] **Clientes**
  - Total de clientes activos
  - Nuevos clientes este mes
  - Clientes con deuda pendiente
  
- [x] **Productos con bajo stock**
  - Conteo de productos donde `currentStock <= minStock`
  - Listado detallado con nombre, SKU, stock actual y mínimo
  - Alerta visual con enlace a gestión de productos
  
- [x] **Top 5 productos más vendidos**
  - Agregación por `productId` en DocumentItems
  - Ordenado por cantidad vendida (últimos 30 días)
  - Revenue total por producto
  - Barra de progreso visual relativa al producto #1
  
- [x] **Actividad reciente**
  - Últimas 10 ventas (documentos)
  - Cliente, tipo documento, total, timestamp
  - Formato relativo "hace X minutos" con date-fns
  
- [x] **Documentos pendientes**
  - Cotizaciones con estado PENDING
  - Facturas con estado PENDING
  - Alerta visual si hay pendientes

- [x] **Métodos de pago**
  - Distribución últimos 30 días
  - Agrupado por paymentMethod (CASH, CARD, TRANSFER)
  
- [x] **Datos para gráficos**
  - Ventas últimos 7 días agregadas por fecha
  - Preparado para visualización con recharts

### Archivos creados/modificados:

**Nuevos:**
- `lib/utils/dashboard-helpers.ts` - Helpers de fecha y formateo (127 líneas)
  - `getStartOfToday()`, `getStartOfThisMonth()`, `getStartOfLastMonth()`
  - `getDaysAgo(n)`, `getLast7Days()`
  - `formatCurrency()`, `formatPercentage()`, `calculateGrowth()`
  - Todos usando timezone `America/Santiago` (date-fns-tz)

- `app/api/dashboard/kpis/route.ts` - API endpoint principal (343 líneas)
  - Queries agregadas con Prisma
  - Conversión de Decimal a Number
  - Cálculo de growth percentages
  - Manejo de casos edge (division by zero, null products)

**Modificados:**
- `app/dashboard/page.tsx` - Reemplazado completamente (380 líneas)
  - `getDashboardKPIs()` - función async para fetch con caché
  - Manejo de estados: loading/error/empty
  - Growth indicators con iconos ↑↓ y colores
  - Empty states con links a POS
  - Componente Top Productos con progress bars
  - Actividad Reciente con formatDistanceToNow
  - Alerta de Stock Bajo expandible

### Detalles técnicos:

**API Queries (con organizationId):**
```typescript
// Ventas hoy (timezone-aware)
const salesToday = await db.document.aggregate({
  where: {
    organizationId,
    status: 'PAID',
    issuedAt: { gte: getStartOfToday() }
  },
  _sum: { total: true },
  _count: true,
  _avg: { total: true }
});

// Top productos últimos 30 días
const topProducts = await db.documentItem.groupBy({
  by: ['productId'],
  where: {
    document: { 
      organizationId,
      createdAt: { gte: getDaysAgo(30) }
    },
    productId: { not: null }
  },
  _sum: { quantity: true, total: true },
  orderBy: { _sum: { quantity: 'desc' } },
  take: 5
});

// Low stock products
const lowStockProducts = await db.product.findMany({
  where: {
    organizationId,
    isActive: true,
    currentStock: { lte: db.product.fields.minStock }
  },
  select: { id, name, sku, currentStock, minStock }
});
```

**Frontend Features:**
- Revalidación de caché cada 60 segundos (`next: { revalidate: 60 }`)
- Growth indicators dinámicos con colores (verde/rojo) y flechas
- Empty states informativos ("No hay ventas registradas aún")
- Links contextuales (ej: "Realizar primera venta" → `/dashboard/pos`)
- Responsive grid layout (1 col mobile, 4 cols desktop)
- Progress bars para top productos (relativo al máximo)
- Formato de fechas en español de Chile (date-fns locale `es`)

**Dependencias agregadas:**
- `recharts` - Para visualizaciones futuras (preparado para FASE 5+)
- `date-fns-tz` - Manejo timezone America/Santiago
- `date-fns/locale/es` - Formato fechas en español

### Estimación:
**✅ Completado** (1 sesión de trabajo)

---

## ✅ FASE 5: Cierre de Caja (Z) - COMPLETADA

**Estado:** ✅ Implementado y funcionando

**Prioridad:** 🔴 ALTA (Esencial para operación diaria)

### Objetivo:
Sistema de apertura/cierre de caja para control de efectivo y conciliación diaria.

### Características implementadas:

#### 5.1 Modelo de datos
- [x] Modelo `CashRegister` en Prisma
  - `openedAt`, `closedAt`
  - `openingCash` (fondo inicial)
  - `expectedCash` (ventas en efectivo + fondo)
  - `actualCash` (conteo físico)
  - `difference` (sobrante/faltante)
  - `status` (OPEN, CLOSED)
  - `openedBy`, `closedBy` (User IDs)
  - `totalSales`, `salesCount` (calculados en tiempo real para cajas abiertas)
  - `notes` (observaciones del cierre)

#### 5.2 Flujo de Apertura
- [x] Diálogo "Abrir Caja" con validación
- [x] Input de fondo inicial con formato CLP
- [x] Crear registro en DB con status OPEN
- [x] Validación: Solo 1 caja abierta por usuario
- [x] Audit logging (OPEN_CASH_REGISTER)

#### 5.3 Durante el día
- [x] Validación en POS: no se puede vender sin caja activa
- [x] Tracking de métodos de pago en documentos:
  - Efectivo
  - Tarjeta (débito/crédito)
  - Transferencia
  - Múltiple (combinación)
- [x] Cálculo en tiempo real de ventas y efectivo esperado
- [x] Auto-refresh cada 30 segundos para cajas abiertas
- [x] Visual feedback en POS si no hay caja activa

#### 5.4 Flujo de Cierre
- [x] Diálogo "Cerrar Caja" con datos en tiempo real
- [x] Mostrar resumen automático:
  - Fondo inicial
  - Total ventas en efectivo
  - Efectivo esperado (fondo + ventas efectivo)
  - Total ventas (todos los métodos)
  - Cantidad de ventas
- [x] Input de conteo real de caja con formato CLP
- [x] Cálculo automático de diferencia
- [x] Color coding: rojo (faltante) / verde (sobrante)
- [x] Input de observaciones (opcional)
- [x] Confirmar cierre → status CLOSED
- [x] Audit logging (CLOSE_CASH_REGISTER)

#### 5.5 Reporte de Cierre (Z)
- [x] Generador PDF con `@react-pdf/renderer`
- [x] Vista previa del reporte con todos los datos
- [x] PDF generado con 2 páginas:
  - **Página 1:** Resumen ejecutivo
    * Header con organización y RUT
    * Información del turno (fecha/hora apertura y cierre)
    * Resumen de efectivo (fondo, esperado, contado, diferencia)
    * Resumen de ventas (cantidad y monto total)
    * Detalle por método de pago (tabla)
    * Top 5 productos vendidos
    * Observaciones (si existen)
  - **Página 2:** Detalle completo de ventas
    * Lista de todos los documentos
    * Columnas: N° Doc, Cliente, Método, Total
    * Gran total al final
- [x] Botón de descarga PDF
- [x] Formato profesional con estilo chileno (CLP, es-CL)

#### 5.6 Historial
- [x] Página `/dashboard/cash-register`
- [x] Tabla con todos los cierres (últimos primero)
- [x] Información mostrada:
  - Estado (badge ABIERTA/CERRADA)
  - Fechas formateadas (dd MMM yyyy HH:mm)
  - Montos (fondo, ventas, diferencia)
  - Cantidad de ventas
- [x] Botón "Ver Reporte" para cajas cerradas
- [x] Botón "Cerrar Caja" para cajas abiertas
- [x] Botón "Abrir Caja" si no hay caja activa
- [x] Botón "Actualizar" manual
- [x] Color coding para diferencias

#### 5.7 Integración con POS
- [x] Endpoint `/api/cash-register/active` para verificar estado
- [x] Validación en backend al crear documentos SALE
- [x] Error específico: NO_ACTIVE_CASH_REGISTER
- [x] UI del POS muestra alerta si no hay caja activa
- [x] Botón de checkout deshabilitado sin caja activa
- [x] Link directo a "Abrir Caja" desde POS
- [x] Auto-refresh al enfocar ventana del POS

### Archivos creados:
- `prisma/migrations/20260213174541_add_cash_register/` - Migración
- `lib/validators/cash-register.ts` - Validadores Zod (3 schemas)
- `app/api/cash-register/route.ts` - GET (list), POST (open)
- `app/api/cash-register/[id]/close/route.ts` - POST (close)
- `app/api/cash-register/[id]/report/route.ts` - GET (data para PDF)
- `app/api/cash-register/active/route.ts` - GET (check activa)
- `app/dashboard/cash-register/page.tsx` - Página principal
- `app/dashboard/cash-register/_components/open-dialog.tsx` - Diálogo apertura
- `app/dashboard/cash-register/_components/close-dialog.tsx` - Diálogo cierre
- `app/dashboard/cash-register/_components/cash-register-table.tsx` - Tabla historial
- `app/dashboard/cash-register/_components/report-viewer.tsx` - Visor de reportes
- `lib/utils/generate-z-report.tsx` - Generador PDF (React PDF)
- `app/dashboard/cash-register/_components/open-dialog.tsx`
- `app/dashboard/cash-register/_components/close-dialog.tsx`
- `app/dashboard/cash-register/_components/z-report.tsx`
- `lib/utils/generate-z-report.ts` - Generación de PDF

### Validaciones:
- [ ] No permitir abrir caja si ya hay una abierta
- [ ] No permitir cerrar si hay caja cerrada
- [ ] Alertar si diferencia > umbral (ej: $5.000)

### Estimación:
**1-2 sesiones de trabajo**

---

## 🔮 Fases Futuras (Post-MVP)

### FASE 6: Fiados (Cuentas por cobrar)
- Sistema de crédito a clientes
- Ver deuda actual de cada cliente
- Pagos parciales y totales
- Historial de fiados
- Alertas de límite de crédito alcanzado

### FASE 7: Reportes e Informes
- Reporte de ventas por período
- Reporte de productos más/menos vendidos
- Reporte de clientes frecuentes
- Gráficos de tendencias
- Exportar a Excel/PDF

### FASE 8: Inventario Avanzado
- Gestión de proveedores
- Órdenes de compra
- Recepción de mercadería
- Alertas de reposición
- Transferencias entre bodegas

### FASE 9: Cotizaciones
- Crear cotizaciones (QUOTE)
- Enviar por email/WhatsApp
- Convertir cotización a venta
- Seguimiento de cotizaciones

### FASE 10: Facturas Electrónicas (SII Chile)
- Integración con SII
- Generación de DTE
- Timbraje electrónico
- Envío automático al SII
- Registro de folios

---

## Métricas de Éxito del MVP

Al completar las Fases 1-5, el MVP debe permitir:

✅ **Operación Diaria Completa:**
1. Abrir caja con fondo inicial
2. Vender productos en el POS
3. Asociar ventas a clientes (opcional)
4. Ver dashboard con ventas del día
5. Cerrar caja y generar reporte Z

✅ **Gestión Básica:**
- Registrar nuevos clientes con RUT
- Agregar productos al catálogo
- Controlar stock automáticamente
- Ver productos con bajo stock

✅ **UX Zimple:**
- Interfaz en español chileno
- Botones grandes para touch
- Flujos rápidos sin fricción
- Mobile-first responsive

---

## Stack Técnico (Recordatorio)

- **Framework:** Next.js 16+ (App Router)
- **Lenguaje:** TypeScript Strict
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma
- **Autenticación:** Auth.js (Next-Auth v5)
- **UI:** Shadcn/ui + Tailwind CSS v4
- **Estado Cliente:** Zustand
- **Data Fetching:** TanStack Query v5
- **Validación:** Zod
- **Formularios:** React Hook Form
- **Fechas:** date-fns (+tz)
- **Zona Horaria:** America/Santiago
- **Moneda:** CLP (sin decimales)
- **Locale:** es-CL

---

## Notas Importantes

### Multi-Tenant
- **TODAS** las consultas deben filtrar por `organizationId`
- Usar `getCurrentOrganization()` en APIs
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `ORG_MEMBER`

### Audit Logging
- Usar `logAuditAction()` en:
  - CREATE, UPDATE, DELETE
  - Acciones críticas (ventas, cierre caja)

### Seguridad
- Validar siempre con Zod en backend
- Verificar sesión con `auth()`
- Retornar códigos HTTP correctos

### Performance
- Índices en Prisma para campos de búsqueda
- Limitar resultados con `take`
- Considerar paginación para listas grandes

---

**Última actualización:** 13 de febrero de 2026  
**Versión:** 1.1.0  
**FASE 3 (POS):** ✅ Completada con sistema de descuentos  
**FASE 4 (Dashboard KPIs):** 🚧 En implementación
