export type AppPlanId = 'BASIC' | 'PRO';
export type AppSubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED';

export interface SubscriptionConfigInput {
  trialDays: number;
  founderProgramEnabled: boolean;
  founderTrialDays: number;
  founderDiscountPercent: number;
}

interface BuildSubscriptionInput {
  planId: AppPlanId;
  status: AppSubscriptionStatus;
  config: SubscriptionConfigInput;
  now?: Date;
}

interface BuildSubscriptionOutput {
  planId: AppPlanId;
  status: AppSubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt: Date | null;
  mrr: number;
  isFounderPartner: boolean;
  discountPercent: number;
}

const PLAN_BASE_MRR_CLP: Record<AppPlanId, number> = {
  BASIC: 19990,
  PRO: 29990,
};

const BILLING_CYCLE_MONTHS = 1;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function applyDiscount(amount: number, discountPercent: number): number {
  const discounted = amount * ((100 - discountPercent) / 100);
  return Math.round(discounted);
}

export function mapOrganizationStatusToSubscriptionStatus(
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED'
): AppSubscriptionStatus {
  if (status === 'SUSPENDED') {
    return 'SUSPENDED';
  }

  if (status === 'ACTIVE') {
    return 'ACTIVE';
  }

  return 'TRIAL';
}

export function buildInitialSubscription({
  planId,
  status,
  config,
  now = new Date(),
}: BuildSubscriptionInput): BuildSubscriptionOutput {
  const isFounderPartner = config.founderProgramEnabled;
  const discountPercent = isFounderPartner
    ? Math.min(100, Math.max(0, config.founderDiscountPercent))
    : 0;
  const effectiveTrialDays = isFounderPartner
    ? Math.max(1, config.founderTrialDays)
    : Math.max(1, config.trialDays);

  const currentPeriodStart = now;
  const currentPeriodEnd = addMonths(currentPeriodStart, BILLING_CYCLE_MONTHS);
  const trialEndsAt = status === 'TRIAL' ? addDays(currentPeriodStart, effectiveTrialDays) : null;

  const baseMrr = PLAN_BASE_MRR_CLP[planId] ?? 0;
  const mrr = applyDiscount(baseMrr, discountPercent);

  return {
    planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    trialEndsAt,
    mrr,
    isFounderPartner,
    discountPercent,
  };
}
