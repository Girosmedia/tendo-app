export interface DocumentTotalsItemInput {
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface DocumentTotalsItemOutput {
  subtotal: number;
  taxAmount: number;
  total: number;
  globalDiscountAllocated: number;
}

export interface DocumentTotalsResult {
  items: DocumentTotalsItemOutput[];
  subtotal: number;
  taxAmount: number;
  total: number;
  grossBeforeGlobalDiscount: number;
  globalDiscountApplied: number;
}

export function calculateDocumentTotals(
  items: DocumentTotalsItemInput[],
  requestedGlobalDiscount: number
): DocumentTotalsResult {
  const itemGrossTotals = items.map((item) => {
    const gross = item.quantity * item.unitPrice - item.discount;
    return gross > 0 ? gross : 0;
  });

  const grossBeforeGlobalDiscount = itemGrossTotals.reduce(
    (sum, value) => sum + value,
    0
  );

  const globalDiscountApplied = Math.max(
    0,
    Math.min(requestedGlobalDiscount, grossBeforeGlobalDiscount)
  );

  let allocatedDiscountSoFar = 0;
  const itemsWithTotals = items.map((item, index) => {
    const itemGross = itemGrossTotals[index];

    let allocatedDiscount = 0;
    if (globalDiscountApplied > 0 && grossBeforeGlobalDiscount > 0) {
      if (index === items.length - 1) {
        allocatedDiscount = globalDiscountApplied - allocatedDiscountSoFar;
      } else {
        allocatedDiscount =
          (itemGross / grossBeforeGlobalDiscount) * globalDiscountApplied;
      }
      allocatedDiscountSoFar += allocatedDiscount;
    }

    const adjustedGross = Math.max(0, itemGross - allocatedDiscount);
    const divisor = 1 + item.taxRate / 100;
    const subtotal = divisor > 0 ? adjustedGross / divisor : adjustedGross;
    const taxAmount = adjustedGross - subtotal;

    return {
      subtotal,
      taxAmount,
      total: adjustedGross,
      globalDiscountAllocated: allocatedDiscount,
    };
  });

  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = itemsWithTotals.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);

  return {
    items: itemsWithTotals,
    subtotal,
    taxAmount,
    total,
    grossBeforeGlobalDiscount,
    globalDiscountApplied,
  };
}