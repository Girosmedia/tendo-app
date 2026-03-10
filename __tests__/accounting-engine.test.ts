/**
 * __tests__/accounting-engine.test.ts
 *
 * Tests unitarios para los dos motores contables.
 * Las consultas Prisma se mockean; se testea la lógica de cálculo pura.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock del cliente Prisma ──────────────────────────────────────────────────
vi.mock('@/lib/db', () => ({
  db: {
    document: {
      aggregate: vi.fn(),
    },
    documentItem: {
      findMany: vi.fn(),
    },
    documentPayment: {
      aggregate: vi.fn(),
    },
    payment: {
      aggregate: vi.fn(),
    },
    operationalExpense: {
      aggregate: vi.fn(),
    },
    treasuryMovement: {
      aggregate: vi.fn(),
    },
    // Motor 3: Exposición de Cartera
    credit: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    accountPayable: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
    },
    supplier: {
      findMany: vi.fn(),
    },
  },
}));

// Importar DESPUÉS del mock
import { db } from '@/lib/db';
import {
  calculateManagementMetrics,
  calculateCashFlowMetrics,
  calculateExposureMetrics,
} from '@/lib/utils/accounting-engine';

// ── Helpers ──────────────────────────────────────────────────────────────────
/**
 * decimalToNumber() en el engine hace Number(value).
 * Number(null) = 0, Number(n) = n → pasamos plain numbers directamente.
 * null simula un Decimal nulo (campo opcional sin valor).
 */
const D = (value: number | null): number | null => value;

const ORG = 'org_test_001';
const START = new Date('2026-01-01T03:00:00.000Z'); // 00:00 Santiago
const END   = new Date('2026-01-31T02:59:59.000Z'); // 23:59 Santiago

// ─────────────────────────────────────────────────────────────────────────────
// Motor 1: Rentabilidad (Devengado)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateManagementMetrics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calcula margen bruto correctamente con unitCost snapshot', async () => {
    // 2 documentos con subtotal $100.000
    (db.document.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { subtotal: D(100_000) },
    });
    // 3 ítems con unitCost registrado
    (db.documentItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { quantity: D(2), unitCost: D(10_000), product: { cost: D(12_000) } },
      { quantity: D(1), unitCost: D(20_000), product: { cost: D(22_000) } },
      { quantity: D(5), unitCost: D(5_000),  product: { cost: D(6_000)  } },
    ]);

    const result = await calculateManagementMetrics(ORG, START, END);

    // COGS = 2×10.000 + 1×20.000 + 5×5.000 = 20.000 + 20.000 + 25.000 = 65.000
    expect(result.revenueNet).toBe(100_000);
    expect(result.cogs).toBe(65_000);
    expect(result.grossMargin).toBe(35_000);
    expect(result.grossMarginPct).toBe(35);
    expect(result.itemsWithoutCost).toBe(0);
    expect(result.costCoveragePct).toBe(100);
    expect(result.warnings).toHaveLength(0);
  });

  it('usa product.cost como fallback cuando unitCost es null', async () => {
    (db.document.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { subtotal: D(50_000) },
    });
    // ítem sin snapshot → debe usar product.cost
    (db.documentItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { quantity: D(3), unitCost: null, product: { cost: D(8_000) } },
    ]);

    const result = await calculateManagementMetrics(ORG, START, END);

    // COGS = 3 × 8.000 = 24.000
    expect(result.cogs).toBe(24_000);
    expect(result.itemsWithoutCost).toBe(0); // product.cost existe → no cuenta sin costo
    expect(result.warnings).toHaveLength(0);
  });

  it('detecta ítems sin costo y genera warnings', async () => {
    (db.document.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { subtotal: D(30_000) },
    });
    (db.documentItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { quantity: D(1), unitCost: null, product: { cost: null } }, // sin costo
      { quantity: D(2), unitCost: D(5_000), product: { cost: null } }, // con snapshot
    ]);

    const result = await calculateManagementMetrics(ORG, START, END);

    expect(result.itemsWithoutCost).toBe(1);
    expect(result.costCoveragePct).toBe(50); // 1 de 2 ítems con costo
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/costo asignado/i);
  });

  it('genera warning adicional cuando cogs = 0 con ítems existentes', async () => {
    (db.document.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { subtotal: D(20_000) },
    });
    (db.documentItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { quantity: D(1), unitCost: null, product: { cost: null } },
      { quantity: D(1), unitCost: null, product: { cost: null } },
    ]);

    const result = await calculateManagementMetrics(ORG, START, END);

    expect(result.cogs).toBe(0);
    expect(result.warnings.length).toBe(2); // aviso ítems sin costo + aviso COGS zero
  });

  it('retorna grossMarginPct = 0 cuando revenueNet es 0 (sin divisón por cero)', async () => {
    (db.document.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { subtotal: null },
    });
    (db.documentItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await calculateManagementMetrics(ORG, START, END);

    expect(result.revenueNet).toBe(0);
    expect(result.grossMarginPct).toBe(0);
    expect(result.costCoveragePct).toBe(100); // sin ítems → cobertura perfecta
  });

  it('calcula costCoveragePct como porcentaje redondeado a 1 decimal', async () => {
    (db.document.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { subtotal: D(10_000) },
    });
    // 2 de 3 ítems tienen costo → 66.7%
    (db.documentItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { quantity: D(1), unitCost: D(1_000), product: { cost: null } },
      { quantity: D(1), unitCost: D(1_000), product: { cost: null } },
      { quantity: D(1), unitCost: null, product: { cost: null } },
    ]);

    const result = await calculateManagementMetrics(ORG, START, END);

    expect(result.costCoveragePct).toBeCloseTo(66.7, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Motor 2: Flujo de Caja 14 D3 (Percibido)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateCashFlowMetrics', () => {
  beforeEach(() => vi.clearAllMocks());

  const mockAggregates = ({
    docPayments = 0,
    creditCollections = 0,
    opExpenses = 0,
    treasuryOutflows = 0,
    creditSales = 0,
  }: {
    docPayments?: number;
    creditCollections?: number;
    opExpenses?: number;
    treasuryOutflows?: number;
    creditSales?: number;
  }) => {
    (db.documentPayment.aggregate   as ReturnType<typeof vi.fn>).mockResolvedValue({ _sum: { amount: D(docPayments)         } });
    (db.payment.aggregate           as ReturnType<typeof vi.fn>).mockResolvedValue({ _sum: { amount: D(creditCollections)   } });
    (db.operationalExpense.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({ _sum: { amount: D(opExpenses)         } });
    (db.treasuryMovement.aggregate  as ReturnType<typeof vi.fn>).mockResolvedValue({ _sum: { amount: D(treasuryOutflows)   } });
    (db.document.aggregate          as ReturnType<typeof vi.fn>).mockResolvedValue({ _sum: { total:  D(creditSales)        } });
  };

  it('calcula flujo neto positivo correctamente', async () => {
    mockAggregates({ docPayments: 80_000, creditCollections: 20_000, opExpenses: 30_000, treasuryOutflows: 10_000 });

    const result = await calculateCashFlowMetrics(ORG, START, END);

    expect(result.cashInflows).toBe(100_000);  // 80k + 20k
    expect(result.cashOutflows).toBe(40_000);  // 30k + 10k
    expect(result.netCashFlow).toBe(60_000);
  });

  it('calcula flujo neto negativo correctamente', async () => {
    mockAggregates({ docPayments: 20_000, opExpenses: 50_000, treasuryOutflows: 15_000 });

    const result = await calculateCashFlowMetrics(ORG, START, END);

    expect(result.cashInflows).toBe(20_000);
    expect(result.cashOutflows).toBe(65_000);
    expect(result.netCashFlow).toBe(-45_000);
  });

  it('muestra creditSalesPending cuando hay fiados emitidos', async () => {
    mockAggregates({ docPayments: 50_000, creditSales: 25_000 });

    const result = await calculateCashFlowMetrics(ORG, START, END);

    expect(result.creditSalesPending).toBe(25_000);
  });

  it('retorna 0 en creditSalesPending cuando no hay fiados', async () => {
    mockAggregates({ docPayments: 50_000 });

    const result = await calculateCashFlowMetrics(ORG, START, END);

    expect(result.creditSalesPending).toBe(0);
  });

  it('maneja null en aggregates sin lanzar error', async () => {
    mockAggregates({}); // todos en 0, algunos _sum pueden ser null

    const result = await calculateCashFlowMetrics(ORG, START, END);

    expect(result.cashInflows).toBe(0);
    expect(result.cashOutflows).toBe(0);
    expect(result.netCashFlow).toBe(0);
  });

  it('suma docPayments + creditCollections en cashInflows (ambas fuentes)', async () => {
    mockAggregates({ docPayments: 60_000, creditCollections: 40_000 });

    const result = await calculateCashFlowMetrics(ORG, START, END);

    // Las dos fuentes de cobro real deben sumarse
    expect(result.cashInflows).toBe(100_000);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Motor 3: Exposición de Cartera (Sprint 6)
// ───────────────────────────────────────────────────────────────────────────────
describe('calculateExposureMetrics', () => {
  beforeEach(() => vi.clearAllMocks());

  /** Configura todos los mocks necesarios para el Motor 3. */
  function mockExposure(overrides: {
    cxcTotal?: number;
    cxcOverdue?: number;
    cxcDueSoon?: number;
    cxpTotal?: number;
    cxpOverdue?: number;
    cxpDueSoon?: number;
    paymentsReceived?: number;
    creditsIssued?: number;
    treasuryInflows?: number;
    treasuryOutflows?: number;
    /** Pagos a proveedores (TreasuryMovement OUTFLOW con accountPayableId) en el período */
    cxpPaidThisPeriod?: number;
    topDebtors?: Array<{ customerId: string; _sum: { balance: number | null } }>;
    topSuppliers?: Array<{ supplierId: string | null; _sum: { balance: number | null } }>;
  } = {}) {
    // CxC aggregates: totalActive, overdue, dueSoon, creditsIssued (4 llamadas en orden)
    (db.credit.aggregate as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { balance: D(overrides.cxcTotal ?? 0) } })
      .mockResolvedValueOnce({ _sum: { balance: D(overrides.cxcOverdue ?? 0) } })
      .mockResolvedValueOnce({ _sum: { balance: D(overrides.cxcDueSoon ?? 0) } })
      .mockResolvedValueOnce({ _sum: { amount: D(overrides.creditsIssued ?? 0) } });

    (db.credit.groupBy as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(overrides.topDebtors ?? []);

    (db.payment.aggregate as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { amount: D(overrides.paymentsReceived ?? 0) } });

    // CxP aggregates: totalPending, overdue, dueSoon (3 llamadas en orden)
    (db.accountPayable.aggregate as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { balance: D(overrides.cxpTotal ?? 0) } })
      .mockResolvedValueOnce({ _sum: { balance: D(overrides.cxpOverdue ?? 0) } })
      .mockResolvedValueOnce({ _sum: { balance: D(overrides.cxpDueSoon ?? 0) } });

    (db.accountPayable.groupBy as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(overrides.topSuppliers ?? []);

    // Tesorería: INFLOW, OUTFLOW + CxP pagados en período (3 llamadas en orden)
    (db.treasuryMovement.aggregate as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { amount: D(overrides.treasuryInflows ?? 0) } })
      .mockResolvedValueOnce({ _sum: { amount: D(overrides.treasuryOutflows ?? 0) } })
      .mockResolvedValueOnce({ _sum: { amount: D(overrides.cxpPaidThisPeriod ?? 0) } });

    (db.customer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.supplier.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  }

  it('devuelve ceros cuando no hay datos', async () => {
    mockExposure();
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.totalActive).toBe(0);
    expect(result.payables.totalPending).toBe(0);
    expect(result.treasury.estimatedBalance).toBe(0);
  });

  it('calcula totalActive, overdue y dueSoon de CxC', async () => {
    mockExposure({ cxcTotal: 500_000, cxcOverdue: 200_000, cxcDueSoon: 80_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.totalActive).toBe(500_000);
    expect(result.receivables.overdue).toBe(200_000);
    expect(result.receivables.dueSoon).toBe(80_000);
  });

  it('calcula eficiencia de cobranza cuando hay emisión en el período', async () => {
    mockExposure({ creditsIssued: 200_000, paymentsReceived: 150_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.collectionEfficiencyPct).toBe(75);
  });

  it('collectionEfficiencyPct es null cuando no hubo emisión en el período', async () => {
    mockExposure({ creditsIssued: 0, paymentsReceived: 0 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.collectionEfficiencyPct).toBeNull();
  });

  it('eficiencia no supera 100% si hay cobros de períodos anteriores', async () => {
    mockExposure({ creditsIssued: 100_000, paymentsReceived: 150_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.collectionEfficiencyPct).toBe(100);
  });

  it('calcula totalPending, overdue y dueSoon de CxP', async () => {
    mockExposure({ cxpTotal: 300_000, cxpOverdue: 50_000, cxpDueSoon: 30_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.payables.totalPending).toBe(300_000);
    expect(result.payables.overdue).toBe(50_000);
    expect(result.payables.dueSoon).toBe(30_000);
  });

  it('saldo estimado de tesorería es INFLOW – OUTFLOW', async () => {
    mockExposure({ treasuryInflows: 1_000_000, treasuryOutflows: 650_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.treasury.estimatedBalance).toBe(350_000);
  });

  it('saldo estimado puede ser negativo', async () => {
    mockExposure({ treasuryInflows: 100_000, treasuryOutflows: 200_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.treasury.estimatedBalance).toBe(-100_000);
  });

  it('resuelve nombres de deudores desde customer.findMany', async () => {
    const topDebtors = [{ customerId: 'c1', _sum: { balance: 90_000 } }];
    mockExposure({ topDebtors });
    // Override customer.findMany para devolver nombre real
    (db.customer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'c1', name: 'Empresa ABC' },
    ]);
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.topDebtors).toHaveLength(1);
    expect(result.receivables.topDebtors[0].customerName).toBe('Empresa ABC');
    expect(result.receivables.topDebtors[0].balance).toBe(90_000);
  });

  // ── Nuevos campos: Gap 1 (emittedThisPeriod / collectedThisPeriod) ───────

  it('emittedThisPeriod refleja créditos emitidos en el período', async () => {
    mockExposure({ creditsIssued: 750_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.emittedThisPeriod).toBe(750_000);
  });

  it('collectedThisPeriod refleja pagos recibidos en el período', async () => {
    mockExposure({ paymentsReceived: 300_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.collectedThisPeriod).toBe(300_000);
  });

  it('emittedThisPeriod y collectedThisPeriod son independientes (ratio > 100% → eficiencia cap 100)', async () => {
    // Cobró $120k de período pero emitió solo $100k → eficiencia capped en 100%
    mockExposure({ creditsIssued: 100_000, paymentsReceived: 120_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.emittedThisPeriod).toBe(100_000);
    expect(result.receivables.collectedThisPeriod).toBe(120_000);
    expect(result.receivables.collectionEfficiencyPct).toBe(100); // capped
  });

  it('emittedThisPeriod = 0 y collectedThisPeriod > 0 → collectionEfficiencyPct null (cobros de períodos anteriores)', async () => {
    mockExposure({ creditsIssued: 0, paymentsReceived: 50_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.receivables.emittedThisPeriod).toBe(0);
    expect(result.receivables.collectedThisPeriod).toBe(50_000);
    expect(result.receivables.collectionEfficiencyPct).toBeNull();
  });

  // ── Gap 2: paidThisPeriod (CxP) ─────────────────────────────────────────

  it('paidThisPeriod refleja TreasuryMovement OUTFLOW vinculado a CxP en el período', async () => {
    mockExposure({ cxpPaidThisPeriod: 180_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.payables.paidThisPeriod).toBe(180_000);
  });

  it('paidThisPeriod es 0 cuando no hay pagos a proveedores en el período', async () => {
    mockExposure({ cxpPaidThisPeriod: 0 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.payables.paidThisPeriod).toBe(0);
  });

  it('paidThisPeriod es independiente de totalPending (un proveedor puede tener deuda y pagos en el mismo período)', async () => {
    mockExposure({ cxpTotal: 500_000, cxpPaidThisPeriod: 200_000 });
    const result = await calculateExposureMetrics(ORG, START, END);
    expect(result.payables.totalPending).toBe(500_000); // deuda activa
    expect(result.payables.paidThisPeriod).toBe(200_000); // lo que pagó este período
  });
});
