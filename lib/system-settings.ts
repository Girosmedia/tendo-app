import { db } from '@/lib/db';

export interface SubscriptionSystemConfig {
  trialDays: number;
  founderProgramEnabled: boolean;
  founderTrialDays: number;
  founderDiscountPercent: number;
}

const SYSTEM_SETTINGS_ID = 'global';

const DEFAULT_SUBSCRIPTION_SYSTEM_CONFIG: SubscriptionSystemConfig = {
  trialDays: 15,
  founderProgramEnabled: false,
  founderTrialDays: 60,
  founderDiscountPercent: 50,
};

export async function getOrCreateSystemSettings() {
  return db.systemSettings.upsert({
    where: { id: SYSTEM_SETTINGS_ID },
    update: {},
    create: {
      id: SYSTEM_SETTINGS_ID,
      trialDays: DEFAULT_SUBSCRIPTION_SYSTEM_CONFIG.trialDays,
      founderProgramEnabled: DEFAULT_SUBSCRIPTION_SYSTEM_CONFIG.founderProgramEnabled,
      founderTrialDays: DEFAULT_SUBSCRIPTION_SYSTEM_CONFIG.founderTrialDays,
      founderDiscountPercent: DEFAULT_SUBSCRIPTION_SYSTEM_CONFIG.founderDiscountPercent,
    },
  });
}

export async function getSubscriptionSystemConfig(): Promise<SubscriptionSystemConfig> {
  const settings = await getOrCreateSystemSettings();

  return {
    trialDays: settings.trialDays,
    founderProgramEnabled: settings.founderProgramEnabled,
    founderTrialDays: settings.founderTrialDays,
    founderDiscountPercent: settings.founderDiscountPercent,
  };
}

interface UpdateSystemSettingsInput {
  trialDays: number;
  founderProgramEnabled: boolean;
  founderTrialDays: number;
  founderDiscountPercent: number;
}

export async function updateSystemSettings(input: UpdateSystemSettingsInput) {
  return db.systemSettings.upsert({
    where: { id: SYSTEM_SETTINGS_ID },
    create: {
      id: SYSTEM_SETTINGS_ID,
      trialDays: input.trialDays,
      founderProgramEnabled: input.founderProgramEnabled,
      founderTrialDays: input.founderTrialDays,
      founderDiscountPercent: input.founderDiscountPercent,
    },
    update: {
      trialDays: input.trialDays,
      founderProgramEnabled: input.founderProgramEnabled,
      founderTrialDays: input.founderTrialDays,
      founderDiscountPercent: input.founderDiscountPercent,
    },
  });
}

export { DEFAULT_SUBSCRIPTION_SYSTEM_CONFIG };
