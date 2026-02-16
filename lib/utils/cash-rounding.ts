export function roundCashPaymentAmount(amount: number): number {
  const roundedAmount = Math.round(amount);
  const remainder = ((roundedAmount % 10) + 10) % 10;

  if (remainder === 0) {
    return roundedAmount;
  }

  if (remainder <= 5) {
    return roundedAmount - remainder;
  }

  return roundedAmount + (10 - remainder);
}

export function sumRoundedCashTotals(totals: number[]): number {
  return totals.reduce((accumulator, total) => {
    return accumulator + roundCashPaymentAmount(total);
  }, 0);
}