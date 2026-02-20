import { db } from '@/lib/db';
import {
  inferTrackFromModules,
  normalizeModules,
  PLAN_MODULE_MATRIX,
  sortModulesByRelevance,
  toPlanId,
  TRACK_MODULE_MATRIX,
  type BusinessTrack,
  type ModuleKey,
  type PlanId,
} from './constants/modules';

interface EntitlementInput {
  organizationPlan?: string | null;
  subscriptionPlanId?: string | null;
  organizationModules?: string[];
  explicitTrack?: BusinessTrack | null;
}

export interface OrganizationEntitlements {
  planId: PlanId;
  planSource: 'SUBSCRIPTION' | 'ORGANIZATION';
  track: BusinessTrack;
  planModules: ModuleKey[];
  trackModules: ModuleKey[];
  manualModules: ModuleKey[];
  effectiveModules: ModuleKey[];
}

export function resolveEntitlements(input: EntitlementInput): OrganizationEntitlements {
  const planSource = input.subscriptionPlanId ? 'SUBSCRIPTION' : 'ORGANIZATION';
  const planId = toPlanId(input.subscriptionPlanId ?? input.organizationPlan);
  const manualModules = normalizeModules(input.organizationModules ?? []);

  const track = input.explicitTrack ?? inferTrackFromModules(manualModules);
  const planModules = PLAN_MODULE_MATRIX[planId];
  const trackModules = TRACK_MODULE_MATRIX[track];

  const effectiveModules = sortModulesByRelevance(
    planModules.filter((module) => manualModules.includes(module))
  );

  return {
    planId,
    planSource,
    track,
    planModules,
    trackModules,
    manualModules,
    effectiveModules,
  };
}

export function hasModuleAccess(input: EntitlementInput, module: ModuleKey): boolean {
  const entitlements = resolveEntitlements(input);
  return entitlements.effectiveModules.includes(module);
}

export async function getOrganizationEntitlements(organizationId: string): Promise<OrganizationEntitlements | null> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: {
      plan: true,
      modules: true,
      subscription: {
        select: {
          planId: true,
        },
      },
    },
  });

  if (!organization) {
    return null;
  }

  return resolveEntitlements({
    organizationPlan: organization.plan,
    subscriptionPlanId: organization.subscription?.planId,
    organizationModules: organization.modules,
  });
}
