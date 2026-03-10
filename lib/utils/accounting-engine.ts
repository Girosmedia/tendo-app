/**
 * accounting-engine.ts
 *
 * Motores de cálculo financiero para la contabilidad Pyme chilena.
 * Implementa la separación estricta entre:
 *
 *   - Motor 1: Rentabilidad (Devengado) — cuánto gané vs cuánto me costó.
 *   - Motor 2: Flujo de Caja 14 D3/D8 (Percibido) — cuánta plata entró vs salió.
 *
 * Reglas no negociables (Régimen 14 D3 / 14 D8 Chile):
 *  • Revenue = Document.subtotal (sin IVA). Incluye ventas fiadas (CREDIT) porque la venta
 *    ya fue emitida; el riesgo es de cobro, no de no-venta.
 *  • COGS = DocumentItem.quantity × DocumentItem.unitCost (snapshot histórico, NUNCA product.cost live).
 *    Si unitCost es null (ítem antiguo no backfilleado) se usa product.cost como fallback transitorio.
 *  • CashInflows = DocumentPayment.amount + Payment.amount (cobros reales en el período).
 *    Las ventas CREDIT NO entran aquí hasta que el cliente pague.
 *  • CashOutflows = OperationalExpense + TreasuryMovement OUTFLOW.
 *    Las compras de inventario sólo impactan flujo cuando se pagan (TreasuryMovement), NO como costo operativo.
 *  • Todas las fechas filtran en zona horaria America/Santiago.
 */

import { db } from '@/lib/db';
import { decimalToNumber } from '@/lib/utils/dashboard-helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces públicas
// ─────────────────────────────────────────────────────────────────────────────

export interface ManagementMetrics {
  /** Ingresos Netos devengados: suma de Document.subtotal (sin IVA), incluye ventas fiadas */
  revenueNet: number;
  /** Costo de Venta (COGS): quantity × unitCost por ítem (snapshot histórico) */
  cogs: number;
  /** Margen Bruto = revenueNet - cogs */
  grossMargin: number;
  /** Porcentaje de margen bruto sobre ingresos netos */
  grossMarginPct: number;
  /** % de ítems de venta con unitCost registrado (100% = cobertura total) */
  costCoveragePct: number;
  /** Cantidad de ítems sin costo asignado (alertan calidad de datos) */
  itemsWithoutCost: number;
  /** Avisos de calidad de datos para mostrar en UI */
  warnings: string[];
}

export interface CashFlowMetrics {
  /** Dinero que entró: cobros directos (DocumentPayment) + cobros de fiados (Payment) */
  cashInflows: number;
  /** Dinero que salió: gastos operativos (OperationalExpense) + egresos tesorería (TreasuryMovement OUTFLOW) */
  cashOutflows: number;
  /** Flujo neto del período */
  netCashFlow: number;
  /** Ventas fiadas emitidas en el período aún no cobradas (CxC) */
  creditSalesPending: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Motor 1: Rentabilidad de Negocio (Devengado)
// ─────────────────────────────────────────────────────────────────────────────

export async function calculateManagementMetrics(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<ManagementMetrics> {
  const [salesAgg, itemsData] = await Promise.all([
    // Ingresos: ventas emitidas (PAID) en el período, incluyendo fiadas
    db.document.aggregate({
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: { gte: startDate, lte: endDate },
      },
      _sum: { subtotal: true },
    }),
    // Ítems: usamos unitCost (snapshot) con fallback a product.cost para datos anteriores al backfill
    db.documentItem.findMany({
      where: {
        document: {
          organizationId,
          type: 'SALE',
          status: 'PAID',
          issuedAt: { gte: startDate, lte: endDate },
        },
      },
      select: {
        quantity: true,
        unitCost: true,
        product: {
          select: { cost: true },
        },
      },
    }),
  ]);

  const revenueNet = Math.round(decimalToNumber(salesAgg._sum.subtotal));

  let cogs = 0;
  let itemsWithoutCost = 0;

  for (const item of itemsData) {
    const snapshotCost = decimalToNumber(item.unitCost);
    const liveCost = decimalToNumber(item.product?.cost);
    // Prioridad: snapshot histórico → costo live del catálogo → 0
    const effectiveCost = snapshotCost > 0 ? snapshotCost : liveCost > 0 ? liveCost : 0;

    if (!item.unitCost && !item.product?.cost) {
      itemsWithoutCost += 1;
    }

    cogs += decimalToNumber(item.quantity) * effectiveCost;
  }

  cogs = Math.round(cogs);

  const grossMargin = revenueNet - cogs;
  const grossMarginPct =
    revenueNet > 0 ? Math.round((grossMargin / revenueNet) * 1000) / 10 : 0;
  const costCoveragePct =
    itemsData.length > 0
      ? Math.round(((itemsData.length - itemsWithoutCost) / itemsData.length) * 1000) / 10
      : 100;

  const warnings: string[] = [];
  if (itemsWithoutCost > 0) {
    warnings.push(
      `${itemsWithoutCost} ${itemsWithoutCost === 1 ? 'ítem vendido no tiene' : 'ítems vendidos no tienen'} costo asignado. Los márgenes pueden ser inexactos. Actualiza tu catálogo de productos.`
    );
  }
  if (cogs === 0 && itemsData.length > 0) {
    warnings.push(
      'No se encontró costo de venta para ningún ítem del período. Ejecuta el backfill de costos.'
    );
  }

  return {
    revenueNet,
    cogs,
    grossMargin,
    grossMarginPct,
    costCoveragePct,
    itemsWithoutCost,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Motor 2: Flujo de Caja 14 D3 / 14 D8 (Percibido)
// ─────────────────────────────────────────────────────────────────────────────

export async function calculateCashFlowMetrics(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<CashFlowMetrics> {
  const [
    documentPaymentsAgg, // cobros directos (CASH, CARD, TRANSFER, CHECK) en el período
    creditCollectionsAgg, // cobros de fiados (Credit) en el período
    opExpensesAgg, // gastos operativos pagados en el período
    treasuryOutflowsAgg, // egresos de tesorería (compras proveedores, retiros, etc.)
    creditSalesAgg, // ventas fiadas emitidas en el período (aún no cobradas, CxC)
  ] = await Promise.all([
    // Filtramos por issuedAt del documento vinculado, que es cuando ocurrió la venta pagada
    db.documentPayment.aggregate({
      where: {
        document: {
          organizationId,
          issuedAt: { gte: startDate, lte: endDate },
        },
      },
      _sum: { amount: true },
    }),
    // Pagos de fiados recibidos (paidAt = fecha real del cobro)
    db.payment.aggregate({
      where: {
        organizationId,
        paidAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    // Gastos operativos: arriendos, sueldos, servicios. NO incluye compras de inventario.
    db.operationalExpense.aggregate({
      where: {
        organizationId,
        expenseDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    // Egresos de tesorería: pagos a proveedores, retiros, préstamos.
    db.treasuryMovement.aggregate({
      where: {
        organizationId,
        type: 'OUTFLOW',
        occurredAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    // Ventas fiadas emitidas: ingresos devengados pero aún NO percibidos en caja
    db.document.aggregate({
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        paymentMethod: 'CREDIT',
        issuedAt: { gte: startDate, lte: endDate },
      },
      _sum: { total: true },
    }),
  ]);

  const cashInflows = Math.round(
    decimalToNumber(documentPaymentsAgg._sum.amount) +
      decimalToNumber(creditCollectionsAgg._sum.amount)
  );

  const cashOutflows = Math.round(
    decimalToNumber(opExpensesAgg._sum.amount) +
      decimalToNumber(treasuryOutflowsAgg._sum.amount)
  );

  const netCashFlow = cashInflows - cashOutflows;
  const creditSalesPending = Math.round(decimalToNumber(creditSalesAgg._sum.total));

  return {
    cashInflows,
    cashOutflows,
    netCashFlow,
    creditSalesPending,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Motor 3: Exposición de Cartera (CxC + CxP + Tesorería)
// ─────────────────────────────────────────────────────────────────────────────

export interface ExposureMetrics {
  receivables: {
    /** Saldo total en créditos ACTIVE u OVERDUE (no cancelados ni pagados) */
    totalActive: number;
    /** Créditos con dueDate ya pasada y estado ACTIVE (aún no marcados OVERDUE) o OVERDUE */
    overdue: number;
    /** Créditos con dueDate en los próximos 7 días y estado ACTIVE */
    dueSoon: number;
    /** Monto total de créditos emitidos en el período solicitado (credit.amount, al momento de emisión) */
    emittedThisPeriod: number;
    /** Pagos cobrados en el período solicitado (payment.amount), de cualquier crédito activo */
    collectedThisPeriod: number;
    /** % cobrado vs emitido en el período (0-100). null si no hubo emisión en el período. */
    collectionEfficiencyPct: number | null;
    /** Top 5 deudores por saldo pendiente */
    topDebtors: Array<{ customerId: string; customerName: string; balance: number }>;
  };
  payables: {
    /** Saldo total en CxP PENDING o PARTIAL */
    totalPending: number;
    /** CxP con dueDate ya pasada y estado PENDING o PARTIAL */
    overdue: number;
    /** CxP con dueDate en los próximos 7 días y estado PENDING o PARTIAL */
    dueSoon: number;
    /** Pagos realizados a proveedores (TreasuryMovement OUTFLOW vinculados a una CxP) en el período */
    paidThisPeriod: number;
    /** Top 5 proveedores por saldo pendiente */
    topSuppliers: Array<{ supplierId: string; supplierName: string; balance: number }>;
  };
  treasury: {
    /** Balance estimado: suma histórica INFLOW – suma histórica OUTFLOW */
    estimatedBalance: number;
  };
}

export async function calculateExposureMetrics(
  organizationId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<ExposureMetrics> {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    // CxC
    cxcTotalAgg,
    cxcOverdueAgg,
    cxcDueSoonAgg,
    cxcTopDebtorsRaw,
    paymentsReceivedAgg,
    creditsIssuedAgg,
    // CxP
    cxpTotalAgg,
    cxpOverdueAgg,
    cxpDueSoonAgg,
    cxpTopSuppliersRaw,
    // Tesorería
    treasuryInflowAgg,
    treasuryOutflowAgg,
    // CxP pagos en el período
    cxpPaidThisPeriodAgg,
  ] = await Promise.all([
    // Saldo total activo en CxC (ACTIVE + OVERDUE)
    db.credit.aggregate({
      where: { organizationId, status: { in: ['ACTIVE', 'OVERDUE'] } },
      _sum: { balance: true },
    }),
    // CxC vencidas: OVERDUE explícito + ACTIVE con dueDate pasada
    db.credit.aggregate({
      where: {
        organizationId,
        OR: [
          { status: 'OVERDUE' },
          { status: 'ACTIVE', dueDate: { lt: now } },
        ],
      },
      _sum: { balance: true },
    }),
    // CxC por vencer en 7 días
    db.credit.aggregate({
      where: {
        organizationId,
        status: 'ACTIVE',
        dueDate: { gte: now, lte: sevenDaysLater },
      },
      _sum: { balance: true },
    }),
    // Top 5 deudores
    db.credit.groupBy({
      by: ['customerId'],
      where: { organizationId, status: { in: ['ACTIVE', 'OVERDUE'] } },
      _sum: { balance: true },
      orderBy: { _sum: { balance: 'desc' } },
      take: 5,
    }),
    // Cobros recibidos en el período (para eficiencia de cobranza)
    db.payment.aggregate({
      where: {
        organizationId,
        paidAt: { gte: periodStart, lte: periodEnd },
      },
      _sum: { amount: true },
    }),
    // Créditos emitidos en el período
    db.credit.aggregate({
      where: {
        organizationId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      _sum: { amount: true },
    }),
    // Saldo total pendiente en CxP (PENDING + PARTIAL)
    db.accountPayable.aggregate({
      where: { organizationId, status: { in: ['PENDING', 'PARTIAL'] } },
      _sum: { balance: true },
    }),
    // CxP vencidas
    db.accountPayable.aggregate({
      where: {
        organizationId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: now },
      },
      _sum: { balance: true },
    }),
    // CxP por vencer en 7 días
    db.accountPayable.aggregate({
      where: {
        organizationId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { gte: now, lte: sevenDaysLater },
      },
      _sum: { balance: true },
    }),
    // Top 5 proveedores por saldo
    db.accountPayable.groupBy({
      by: ['supplierId'],
      where: { organizationId, status: { in: ['PENDING', 'PARTIAL'] } },
      _sum: { balance: true },
      orderBy: { _sum: { balance: 'desc' } },
      take: 5,
    }),
    // Tesorería: ingresos históricos
    db.treasuryMovement.aggregate({
      where: { organizationId, type: 'INFLOW' },
      _sum: { amount: true },
    }),
    // Tesorería: egresos históricos
    db.treasuryMovement.aggregate({
      where: { organizationId, type: 'OUTFLOW' },
      _sum: { amount: true },
    }),
    // CxP: pagos realizados a proveedores en el período (OUTFLOW vinculados a una CxP)
    db.treasuryMovement.aggregate({
      where: {
        organizationId,
        type: 'OUTFLOW',
        accountPayableId: { not: null },
        occurredAt: { gte: periodStart, lte: periodEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  // Resolver nombres de clientes para top debtors
  const debtorIds = cxcTopDebtorsRaw.map((r) => r.customerId);
  const debtorCustomers =
    debtorIds.length > 0
      ? await db.customer.findMany({
          where: { id: { in: debtorIds } },
          select: { id: true, name: true },
        })
      : [];
  const debtorMap = Object.fromEntries(debtorCustomers.map((c) => [c.id, c.name]));

  // Resolver nombres de proveedores para top suppliers
  const supplierIds = cxpTopSuppliersRaw
    .map((r) => r.supplierId)
    .filter((id): id is string => id !== null);
  const suppliers =
    supplierIds.length > 0
      ? await db.supplier.findMany({
          where: { id: { in: supplierIds } },
          select: { id: true, name: true },
        })
      : [];
  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  // Calcular eficiencia de cobranza
  const periodIssued = Math.round(decimalToNumber(creditsIssuedAgg._sum.amount));
  const periodCollected = Math.round(decimalToNumber(paymentsReceivedAgg._sum.amount));
  const collectionEfficiencyPct =
    periodIssued > 0 ? Math.min(100, Math.round((periodCollected / periodIssued) * 100)) : null;

  const totalActive = Math.round(decimalToNumber(cxcTotalAgg._sum.balance));
  const cxcOverdue = Math.round(decimalToNumber(cxcOverdueAgg._sum.balance));
  const cxcDueSoon = Math.round(decimalToNumber(cxcDueSoonAgg._sum.balance));

  const totalPending = Math.round(decimalToNumber(cxpTotalAgg._sum.balance));
  const cxpOverdue = Math.round(decimalToNumber(cxpOverdueAgg._sum.balance));
  const cxpDueSoon = Math.round(decimalToNumber(cxpDueSoonAgg._sum.balance));

  const treasuryInflows = Math.round(decimalToNumber(treasuryInflowAgg._sum.amount));
  const treasuryOutflows = Math.round(decimalToNumber(treasuryOutflowAgg._sum.amount));

  return {
    receivables: {
      totalActive,
      overdue: cxcOverdue,
      dueSoon: cxcDueSoon,
      emittedThisPeriod: periodIssued,
      collectedThisPeriod: periodCollected,
      collectionEfficiencyPct,
      topDebtors: cxcTopDebtorsRaw.map((r) => ({
        customerId: r.customerId,
        customerName: debtorMap[r.customerId] ?? 'Cliente',
        balance: Math.round(decimalToNumber(r._sum.balance)),
      })),
    },
    payables: {
      totalPending,
      overdue: cxpOverdue,
      dueSoon: cxpDueSoon,
      paidThisPeriod: Math.round(decimalToNumber(cxpPaidThisPeriodAgg._sum.amount)),
      topSuppliers: cxpTopSuppliersRaw
        .filter((r) => r.supplierId !== null)
        .map((r) => ({
          supplierId: r.supplierId as string,
          supplierName: supplierMap[r.supplierId as string] ?? 'Proveedor',
          balance: Math.round(decimalToNumber(r._sum.balance)),
        })),
    },
    treasury: {
      estimatedBalance: treasuryInflows - treasuryOutflows,
    },
  };
}
